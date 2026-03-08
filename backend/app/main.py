from fastapi import FastAPI
from routes import dataset
from utils.exceptions import ProcessingError, processing_exception_handler
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="CleanML API")
app.add_exception_handler(ProcessingError, processing_exception_handler)
app.include_router(dataset.router, prefix="/api/dataset", tags=["Dataset"])

# Setup CORS
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

@app.get("/")
def read_root():
    return {"message": "Welcome to CleanML API"}
