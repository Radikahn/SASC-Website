rebuild:
    docker compose down
    docker rmi actuary-actuary_sjsu
    docker compsoe up -d
