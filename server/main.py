import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load env variables
load_dotenv()

app = FastAPI(
    title="Dayflow API",
    description="Human Resource Management System backend API",
    version="1.0.0"
)

# CORS configuration to allow local frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict to frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routes
from api import adminroutes
from api import attendanceroutes
from api import authroutes
from api import employeeroutes
from api import leaveroutes

# Mount routes
app.include_router(adminroutes.router, prefix="/api")
app.include_router(attendanceroutes.router, prefix="/api")
app.include_router(authroutes.router, prefix="/api")
app.include_router(employeeroutes.router, prefix="/api")
app.include_router(leaveroutes.router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "message": "Welcome to the Dayflow HRM API!"
    }

if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )