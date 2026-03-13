from __future__ import annotations

import argparse
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import Connection, Engine

STATEMENT_MARKER = "-- migrate:statement"
SAFE_IDENTIFIER_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")
VALID_DECAY_TIMES = {"weekly", "biweekly", "monthly"}
VALID_ANSWERS = {"A", "B", "C", "D", "E"}
KNOWN_EXAM_NAMES = {
    "P": "Exam P",
    "FM": "Exam FM",
    "SRM": "Exam SRM",
    "FAM": "Exam FAM",
}


def parse_args() -> argparse.Namespace:
    default_schema_path = Path(__file__).with_name("001_create_postgres_schema.sql")
    parser = argparse.ArgumentParser(
        description="Migrate the legacy SQLite exam database into the new Postgres schema."
    )
    parser.add_argument(
        "--sqlite-path", required=True, help="Path to the source SQLite database file."
    )
    parser.add_argument(
        "--postgres-url",
        required=True,
        help="SQLAlchemy URL for the target Postgres database.",
    )
    parser.add_argument(
        "--schema-path",
        default=str(default_schema_path),
        help="Path to the Postgres schema SQL file.",
    )
    parser.add_argument(
        "--skip-schema",
        action="store_true",
        help="Skip applying the schema SQL before copying data.",
    )
    return parser.parse_args()


def normalize_exam_code(raw_value: Any) -> str:
    value = str(raw_value).strip().upper()
    if value.startswith("EXAM_"):
        value = value[5:]
    return value


def exam_table_to_code(table_name: str) -> str:
    return normalize_exam_code(table_name)


def exam_name_for(code: str) -> str:
    return KNOWN_EXAM_NAMES.get(code, f"Exam {code}")


def normalize_decay_time(raw_value: Any) -> str:
    if raw_value is None:
        return "biweekly"
    value = str(raw_value).strip().lower()
    if value not in VALID_DECAY_TIMES:
        raise ValueError(f"Unsupported decay_time value: {raw_value!r}")
    return value


def normalize_answer(raw_value: Any) -> str:
    value = str(raw_value).strip().upper()
    if value not in VALID_ANSWERS:
        raise ValueError(f"Unsupported selected_answer value: {raw_value!r}")
    return value


def parse_timestamp(raw_value: Any) -> datetime:
    if isinstance(raw_value, datetime):
        return raw_value if raw_value.tzinfo else raw_value.replace(tzinfo=timezone.utc)

    if raw_value is None:
        return datetime.now(timezone.utc)

    candidate = str(raw_value).strip()
    candidate = candidate.replace("Z", "+00:00")

    for parser in (
        datetime.fromisoformat,
        lambda s: datetime.strptime(s, "%Y-%m-%d %H:%M:%S"),
        lambda s: datetime.strptime(s, "%Y-%m-%d %H:%M:%S.%f"),
    ):
        try:
            parsed = parser(candidate)
            return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
        except ValueError:
            continue

    raise ValueError(f"Could not parse timestamp value: {raw_value!r}")


def read_sql_statements(schema_path: Path) -> list[str]:
    raw_sql = schema_path.read_text(encoding="utf-8")
    blocks = [block.strip() for block in raw_sql.split(STATEMENT_MARKER)]
    return [block for block in blocks if block]


def apply_schema(target_conn: Connection, schema_path: Path) -> None:
    for statement in read_sql_statements(schema_path):
        target_conn.exec_driver_sql(statement)


def assert_identifier(identifier: str) -> str:
    if not SAFE_IDENTIFIER_RE.match(identifier):
        raise ValueError(f"Unsafe identifier: {identifier!r}")
    return identifier


def fetch_table_rows(
    conn: Connection, table_name: str, order_by: str | None = None
) -> list[dict[str, Any]]:
    safe_table_name = assert_identifier(table_name)
    sql = f"SELECT * FROM {safe_table_name}"
    if order_by:
        sql += f" ORDER BY {order_by}"
    result = conn.execute(text(sql))
    return [dict(row) for row in result.mappings()]


def ensure_target_is_empty(target_conn: Connection) -> None:
    tables_to_check = [
        "users",
        "exams",
        "topics",
        "questions",
        "user_exam_ratings",
        "question_attempts",
        "practice_exams",
    ]
    for table_name in tables_to_check:
        row_count = target_conn.execute(
            text(f"SELECT COUNT(*) FROM {table_name}")
        ).scalar_one()
        if row_count:
            raise RuntimeError(
                f"Target Postgres database is not empty. Found {row_count} rows in {table_name}."
            )


def discover_exam_codes(source_conn: Connection) -> list[str]:
    inspector = inspect(source_conn)
    codes = {
        exam_table_to_code(table_name)
        for table_name in inspector.get_table_names()
        if table_name.lower().startswith("exam_")
    }

    if "topics" in inspector.get_table_names():
        topic_rows = fetch_table_rows(source_conn, "topics")
        codes.update(normalize_exam_code(row["exam"]) for row in topic_rows)

    if "attempts" in inspector.get_table_names():
        attempt_rows = fetch_table_rows(source_conn, "attempts")
        codes.update(normalize_exam_code(row["exam"]) for row in attempt_rows)

    return sorted(codes)


def seed_exams(source_conn: Connection, target_conn: Connection) -> dict[str, int]:
    exam_ids: dict[str, int] = {}
    for exam_code in discover_exam_codes(source_conn):
        exam_id = target_conn.execute(
            text(
                """
                INSERT INTO exams (code, name)
                VALUES (:code, :name)
                ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
                RETURNING id
                """
            ),
            {"code": exam_code, "name": exam_name_for(exam_code)},
        ).scalar_one()
        exam_ids[exam_code] = exam_id
    return exam_ids


def migrate_users(source_conn: Connection, target_conn: Connection) -> dict[int, int]:
    inspector = inspect(source_conn)
    if "users" not in inspector.get_table_names():
        return {}

    user_ids: dict[int, int] = {}
    rows = fetch_table_rows(source_conn, "users", order_by="user_id")
    for row in rows:
        legacy_user_id = int(row["user_id"])
        new_user_id = target_conn.execute(
            text(
                """
                INSERT INTO users (discord_id, created_at, stat_decay, decay_time)
                VALUES (:discord_id, :created_at, :stat_decay, :decay_time)
                RETURNING id
                """
            ),
            {
                "discord_id": str(legacy_user_id),
                "created_at": parse_timestamp(row["created_at"]),
                "stat_decay": bool(row["stat_decay"]),
                "decay_time": normalize_decay_time(row.get("decay_time")),
            },
        ).scalar_one()
        user_ids[legacy_user_id] = new_user_id
    return user_ids


def seed_user_exam_ratings(
    target_conn: Connection, user_ids: dict[int, int], exam_ids: dict[str, int]
) -> None:
    payload = [
        {"user_id": new_user_id, "exam_id": exam_id, "elo": 0}
        for new_user_id in user_ids.values()
        for exam_id in exam_ids.values()
    ]

    if not payload:
        return

    target_conn.execute(
        text(
            """
            INSERT INTO user_exam_ratings (user_id, exam_id, elo)
            VALUES (:user_id, :exam_id, :elo)
            ON CONFLICT (user_id, exam_id) DO NOTHING
            """
        ),
        payload,
    )


def migrate_questions(
    source_conn: Connection, target_conn: Connection, exam_ids: dict[str, int]
) -> dict[tuple[str, int], int]:
    inspector = inspect(source_conn)
    question_ids: dict[tuple[str, int], int] = {}

    for table_name in sorted(inspector.get_table_names()):
        if not table_name.lower().startswith("exam_"):
            continue

        exam_code = exam_table_to_code(table_name)
        exam_id = exam_ids[exam_code]
        rows = fetch_table_rows(source_conn, table_name, order_by="number")

        for row in rows:
            question_id = target_conn.execute(
                text(
                    """
                    INSERT INTO questions (exam_id, question_number, image_path, solution_text, correct_answer)
                    VALUES (:exam_id, :question_number, :image_path, :solution_text, NULL)
                    RETURNING id
                    """
                ),
                {
                    "exam_id": exam_id,
                    "question_number": int(row["number"]),
                    "image_path": row["question_dir"],
                    "solution_text": row["solution"],
                },
            ).scalar_one()
            question_ids[(exam_code, int(row["number"]))] = question_id

    return question_ids


def migrate_topics(
    source_conn: Connection, target_conn: Connection, exam_ids: dict[str, int]
) -> dict[int, int]:
    inspector = inspect(source_conn)
    if "topics" not in inspector.get_table_names():
        return {}

    topic_ids: dict[int, int] = {}
    rows = fetch_table_rows(source_conn, "topics", order_by="topic_id")
    for row in rows:
        legacy_topic_id = int(row["topic_id"])
        exam_code = normalize_exam_code(row["exam"])
        topic_id = target_conn.execute(
            text(
                """
                INSERT INTO topics (id, exam_id, name)
                VALUES (:id, :exam_id, :name)
                RETURNING id
                """
            ),
            {
                "id": legacy_topic_id,
                "exam_id": exam_ids[exam_code],
                "name": row["name"],
            },
        ).scalar_one()
        topic_ids[legacy_topic_id] = topic_id

    return topic_ids


def migrate_question_topics(
    source_conn: Connection,
    target_conn: Connection,
    topic_ids: dict[int, int],
    question_ids: dict[tuple[str, int], int],
) -> list[dict[str, Any]]:
    inspector = inspect(source_conn)
    if "question_topics" not in inspector.get_table_names():
        return []

    rows = fetch_table_rows(
        source_conn, "question_topics", order_by="exam, question_number, topic_id"
    )
    skipped_rows: list[dict[str, Any]] = []
    for row in rows:
        exam_code = normalize_exam_code(row["exam"])
        question_key = (exam_code, int(row["question_number"]))
        topic_key = int(row["topic_id"])

        if question_key not in question_ids:
            skipped_rows.append(row)
            continue
        if topic_key not in topic_ids:
            raise KeyError(f"Missing topic for question_topics row: {row}")

        target_conn.execute(
            text(
                """
                INSERT INTO question_topics (question_id, topic_id, is_primary)
                VALUES (:question_id, :topic_id, :is_primary)
                ON CONFLICT (question_id, topic_id) DO NOTHING
                """
            ),
            {
                "question_id": question_ids[question_key],
                "topic_id": topic_ids[topic_key],
                "is_primary": True,
            },
        )

    return skipped_rows


def migrate_recent_questions(
    source_conn: Connection,
    target_conn: Connection,
    question_ids: dict[tuple[str, int], int],
) -> None:
    inspector = inspect(source_conn)
    if "recent_questions" not in inspector.get_table_names():
        return

    rows = fetch_table_rows(
        source_conn, "recent_questions", order_by="exam, question_number"
    )
    for row in rows:
        question_key = (normalize_exam_code(row["exam"]), int(row["question_number"]))
        if question_key not in question_ids:
            raise KeyError(f"Missing question for recent_questions row: {row}")

        target_conn.execute(
            text(
                """
                INSERT INTO recent_questions (question_id)
                VALUES (:question_id)
                ON CONFLICT (question_id) DO NOTHING
                """
            ),
            {"question_id": question_ids[question_key]},
        )


def migrate_attempts(
    source_conn: Connection,
    target_conn: Connection,
    user_ids: dict[int, int],
    question_ids: dict[tuple[str, int], int],
) -> None:
    inspector = inspect(source_conn)
    if "attempts" not in inspector.get_table_names():
        return

    rows = fetch_table_rows(
        source_conn, "attempts", order_by="user_id, exam, question_number"
    )
    payload: list[dict[str, Any]] = []

    for row in rows:
        legacy_user_id = int(row["user_id"])
        question_key = (normalize_exam_code(row["exam"]), int(row["question_number"]))
        if legacy_user_id not in user_ids:
            raise KeyError(f"Missing user for attempt row: {row}")
        if question_key not in question_ids:
            raise KeyError(f"Missing question for attempt row: {row}")

        payload.append(
            {
                "user_id": user_ids[legacy_user_id],
                "question_id": question_ids[question_key],
                "selected_answer": normalize_answer(row["selected_answer"]),
                "is_correct": bool(row["correct"]),
                "created_at": parse_timestamp(row["created_at"]),
            }
        )

    if payload:
        target_conn.execute(
            text(
                """
                INSERT INTO question_attempts (
                  user_id,
                  question_id,
                  practice_exam_id,
                  mode,
                  selected_answer,
                  is_correct,
                  created_at
                )
                VALUES (
                  :user_id,
                  :question_id,
                  NULL,
                  'single',
                  :selected_answer,
                  :is_correct,
                  :created_at
                )
                """
            ),
            payload,
        )


def reset_sequence(
    target_conn: Connection, table_name: str, column_name: str = "id"
) -> None:
    safe_table_name = assert_identifier(table_name)
    safe_column_name = assert_identifier(column_name)
    target_conn.execute(
        text(
            f"""
            SELECT setval(
              pg_get_serial_sequence('{safe_table_name}', '{safe_column_name}'),
              COALESCE((SELECT MAX({safe_column_name}) FROM {safe_table_name}), 1),
              (SELECT MAX({safe_column_name}) IS NOT NULL FROM {safe_table_name})
            )
            """
        )
    )


def build_engine(url: str) -> Engine:
    return create_engine(url, future=True)


def main() -> None:
    args = parse_args()
    schema_path = Path(args.schema_path).resolve()
    sqlite_path = Path(args.sqlite_path).expanduser().resolve()

    if not schema_path.exists():
        raise FileNotFoundError(f"Schema file not found: {schema_path}")
    if not sqlite_path.exists():
        raise FileNotFoundError(f"SQLite database file not found: {sqlite_path}")

    source_engine = build_engine(f"sqlite:///{sqlite_path}")
    target_engine = build_engine(args.postgres_url)

    with source_engine.connect() as source_conn, target_engine.begin() as target_conn:
        if not args.skip_schema:
            print(f"Applying schema from {schema_path} ...")
            apply_schema(target_conn, schema_path)

        print("Checking target database state ...")
        ensure_target_is_empty(target_conn)

        print("Seeding exams ...")
        exam_ids = seed_exams(source_conn, target_conn)

        print("Migrating users ...")
        user_ids = migrate_users(source_conn, target_conn)

        print("Seeding per-exam user ratings ...")
        seed_user_exam_ratings(target_conn, user_ids, exam_ids)

        print("Migrating questions ...")
        question_ids = migrate_questions(source_conn, target_conn, exam_ids)

        print("Migrating topics ...")
        topic_ids = migrate_topics(source_conn, target_conn, exam_ids)

        print("Migrating question-to-topic relationships ...")
        skipped_question_topics = migrate_question_topics(
            source_conn, target_conn, topic_ids, question_ids
        )

        print("Migrating recent question cache ...")
        migrate_recent_questions(source_conn, target_conn, question_ids)

        print("Migrating question attempts ...")
        migrate_attempts(source_conn, target_conn, user_ids, question_ids)

        for table_name in (
            "topics",
            "questions",
            "question_attempts",
            "practice_exams",
        ):
            reset_sequence(target_conn, table_name)

    source_engine.dispose()
    target_engine.dispose()

    if skipped_question_topics:
        print(
            "Skipped question_topics rows with no matching question in legacy exam tables: "
            f"{len(skipped_question_topics)}"
        )
        for row in skipped_question_topics[:10]:
            print(f"  - {row}")
        if len(skipped_question_topics) > 10:
            print("  - ...")

    print("Migration complete.")


if __name__ == "__main__":
    main()
