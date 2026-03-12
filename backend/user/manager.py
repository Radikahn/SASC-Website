from fastapi import APIRouter

router = APIRouter(prefix="/user", tags=["User"])

def setup_routes():
    
    @router.get("/all")
    def return_all_users():
        return {"user": "evan"}
        
        
    @router.get("/get/exam")
    def get_user_exam_scores(user_id, exam):
        return {"user_id": [{"date": "datetime", "score": "score"}]}
        
    @router.post("")
        
    return router
        