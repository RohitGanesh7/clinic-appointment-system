### app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .auth.routes import router as auth_router
from .routers.appointments import router as appointments_router
from .routers.users import router as users_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Clinic Appointment System", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(appointments_router)
app.include_router(users_router)

@app.get("/")
def read_root():
    return {"message": "Clinic Appointment System API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)