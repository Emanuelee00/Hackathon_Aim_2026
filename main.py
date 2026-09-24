from contextlib import asynccontextmanager
from pathlib import Path
from threading import Thread

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from ai import router as ai_router
from ai import warm_up
from demo import DEMO_MODE
from employment.routes import router as employment_router
from matching import router as matching_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not DEMO_MODE:
        Thread(target=warm_up, daemon=True).start()
    yield


app = FastAPI(title="Marthe", version="0.1.0", lifespan=lifespan)
app.include_router(ai_router)
app.include_router(matching_router)
app.include_router(employment_router)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


# Use the same build directory locally and in the deployed Python bundle.
app.mount(
    "/",
    StaticFiles(
        directory=Path(__file__).parent / "web" / "dist", html=True, check_dir=False
    ),
    name="web",
)
