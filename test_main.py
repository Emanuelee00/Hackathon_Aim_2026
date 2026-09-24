from fastapi.testclient import TestClient

import main


def test_html_page_is_never_served_from_browser_cache():
    client = TestClient(main.app)
    first = client.get("/")
    again = client.get("/", headers={"If-None-Match": first.headers["etag"]})
    assert first.headers["cache-control"] == "no-store"
    assert again.status_code == 200


def test_hashed_assets_can_still_be_revalidated():
    client = TestClient(main.app)
    asset = next(
        (main.Path(main.__file__).parent / "web/dist/assets").glob("*.js")
    ).name
    first = client.get(f"/assets/{asset}")
    again = client.get(
        f"/assets/{asset}", headers={"If-None-Match": first.headers["etag"]}
    )
    assert again.status_code == 304
