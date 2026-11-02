import os
from contextlib import asynccontextmanager
from pathlib import Path
from threading import Thread

from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse, Response
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException

from accounts.routes import router as accounts_router
from agents.routes import router as agents_router
from ai import AI_ENABLED, warm_up
from ai import router as ai_router
from db import migrate
from demo import DEMO_MODE
from employment.routes import router as employment_router
from funding.routes import router as funding_router
from matching import router as matching_router
from sharing.forms import router as forms_router
from sharing.qr import router as qr_router
from sharing.routes import router as sharing_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    migrate()
    if AI_ENABLED and not DEMO_MODE:
        Thread(target=warm_up, daemon=True).start()
    yield


app = FastAPI(title="Marthe", version="0.1.0", lifespan=lifespan)
app.include_router(ai_router)
app.include_router(matching_router)
app.include_router(employment_router)
app.include_router(sharing_router)
app.include_router(forms_router)
app.include_router(qr_router)
app.include_router(accounts_router)
app.include_router(agents_router)
app.include_router(funding_router)


# In production every visitor ends up on CANONICAL_DOMAIN: www.<domain> and the
# old domains in OLD_DOMAINS (same subdomain kept) are redirected there.
CANONICAL_DOMAIN = os.getenv("CANONICAL_DOMAIN", "")
OLD_DOMAINS = [d for d in os.getenv("OLD_DOMAINS", "").split(",") if d]


def canonical_host(host: str) -> str | None:
    """Host to redirect to, or None when the request is already canonical."""
    if not CANONICAL_DOMAIN:
        return None
    if host == f"www.{CANONICAL_DOMAIN}":
        return CANONICAL_DOMAIN
    for old in OLD_DOMAINS:
        if host in (old, f"www.{old}"):
            return CANONICAL_DOMAIN
        if host.endswith(f".{old}"):
            return host.removesuffix(old) + CANONICAL_DOMAIN
    return None


@app.middleware("http")
async def redirect_to_canonical(request: Request, call_next):
    target = canonical_host(request.url.hostname or "")
    if target:
        url = request.url.replace(scheme="https", hostname=target, port=None)
        # 308 keeps the method and body of POST requests.
        status = 301 if request.method in ("GET", "HEAD") else 308
        return RedirectResponse(str(url), status_code=status)
    return await call_next(request)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


class Frontend(StaticFiles):
    """Never answers 304 for HTML pages.

    After a rebuild index.html can keep its size and date, so its ETag would not
    change: browsers (or a caching proxy) would reuse an old page that
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

    async def get_response(self, path: str, scope) -> Response:
        try:
            return await super().get_response(path, scope)
        except HTTPException as exc:
            # The app has no URL paths: old links (e.g. pages of the previous
            # site) land on the home page instead of a 404.
            if exc.status_code == 404 and not path.startswith("api"):
                return RedirectResponse("/", status_code=301)
            raise

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
