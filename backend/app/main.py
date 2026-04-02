from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import dataset, visualization
from app.utils.exceptions import ProcessingError, processing_exception_handler

app = FastAPI(title="CleanML API")

# Register CORS first — Starlette applies middleware outermost-last,
# so this must come before routers to wrap all responses.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://clean-ml.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(ProcessingError, processing_exception_handler)
app.include_router(dataset.router, prefix="/api/dataset", tags=["Dataset"])
app.include_router(visualization.router, prefix="/api/visualization", tags=["Visualization"])

@app.get("/")
def read_root():
    return {"message": "Welcome to CleanML API"}
