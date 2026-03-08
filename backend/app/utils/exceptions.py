from fastapi import Request
from fastapi.responses import JSONResponse

class ProcessingError(Exception):
    pass

async def processing_exception_handler(request: Request, exc: ProcessingError):
    return JSONResponse(
        status_code=400,
        content={"message": str(exc)},
    )
