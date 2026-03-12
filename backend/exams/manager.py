from fastapi import APIRouter

router = APIRouter(prefix="/exam", tags=["Exams"])


def setup_routes():

    @router.get("/all")
    def get_all_exams():
        return {"exam": 100}
        
    @router.get("/ranking")
    def get_exam_ranking(exam, ranking):
        return {"exam": [{"user": "score"}]}

    return router


