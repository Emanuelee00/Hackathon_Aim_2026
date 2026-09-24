from contextlib import asynccontextmanager
from pathlib import Path
from threading import Thread

from fastapi import FastAPI
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles

from ai import router as ai_router
from ai import warm_up
from demo import DEMO_MODE
from employment.routes import router as employment_router
from matching import router as matching_router
from store import router as store_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not DEMO_MODE:
        Thread(target=warm_up, daemon=True).start()
    yield


app = FastAPI(title="Marthe", version="0.1.0", lifespan=lifespan)
app.include_router(ai_router)
app.include_router(matching_router)
app.include_router(employment_router)
app.include_router(store_router)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


class Frontend(StaticFiles):
    """Never answers 304 for HTML pages.

    On Vercel every deploy keeps the same file date, and index.html keeps its
    size, so its ETag never changes: browsers would reuse an old page that
    points to deleted bundles and show a blank screen.
    """

    def file_response(self, *args, **kwargs) -> Response:
        response = super().file_response(*args, **kwargs)
        if response.headers.get("content-type", "").startswith("text/html"):
            response.headers["cache-control"] = "no-store"
            # Without validators no proxy can answer 304 with a stale page.
            del response.headers["etag"]
            del response.headers["last-modified"]
        return response

    def is_not_modified(self, response_headers, request_headers) -> bool:
        if response_headers.get("content-type", "").startswith("text/html"):
            return False
        return super().is_not_modified(response_headers, request_headers)


# Use the same build directory locally and in the deployed Python bundle.
app.mount(
    "/",
    Frontend(
        directory=Path(__file__).parent / "web" / "dist", html=True, check_dir=False
    ),
    name="web",
)
