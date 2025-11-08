from fastapi import APIRouter

router = APIRouter(prefix='/discover', tags=['discover'])

@router.get("/health", status_code =200)
async def health_check():
    """
    Health check endpoint that returns a status 200
    """
    return {"status":"ok","message":"Server is running"}