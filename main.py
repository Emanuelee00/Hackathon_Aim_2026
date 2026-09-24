from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from ai import router as ai_router
from employment.routes import router as employment_router

app = FastAPI(title="Marthe", version="0.1.0")
app.include_router(ai_router)
app.include_router(employment_router)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.mount(
    "/",
    StaticFiles(
        directory=Path(__file__).parent / "web" / "dist", html=True, check_dir=False
    ),
    name="web",
)
