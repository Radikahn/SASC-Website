from fastapi import APIRouter, FastAPI

from exams import manager as em
from user import manager as um

app = FastAPI()


exam_router = em.setup_routes()
app.include_router(exam_router)

user_router = um.setup_routes()
app.include_router(user_routes)



@app.get("/")
def root():
    return {"Heath": "yes"}
