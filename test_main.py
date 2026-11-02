from fastapi.testclient import TestClient

import main


def test_html_page_is_never_served_from_browser_cache():
    client = TestClient(main.app)
    first = client.get("/")
    again = client.get(
        "/",
        headers={
            "If-None-Match": '"any"',
            "If-Modified-Since": "Sat, 20 Oct 2018 01:46:40 GMT",
        },
    )
    assert first.headers["cache-control"] == "no-store"
    assert "etag" not in first.headers and "last-modified" not in first.headers
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


def test_old_and_www_domains_redirect_to_canonical(monkeypatch):
    monkeypatch.setattr(main, "CANONICAL_DOMAIN", "chezmarthe.org")
    monkeypatch.setattr(main, "OLD_DOMAINS", ["chezmarthe.site"])
    client = TestClient(main.app, follow_redirects=False)
    cases = {
        "http://www.chezmarthe.org/?a=1": "https://chezmarthe.org/?a=1",
        "http://chezmarthe.site/": "https://chezmarthe.org/",
        "http://bilan.chezmarthe.site/?event=yoga": "https://bilan.chezmarthe.org/?event=yoga",
    }
    for url, target in cases.items():
        response = client.get(url)
        assert response.status_code == 301
        assert response.headers["location"] == target
    assert client.post("http://chezmarthe.site/api/health").status_code == 308
    assert client.get("http://equipe.chezmarthe.org/").status_code == 200


def test_unknown_pages_of_the_old_site_go_home():
    client = TestClient(main.app, follow_redirects=False)
    response = client.get("/shop/category/dons-3")
    assert response.status_code == 301
    assert response.headers["location"] == "/"
    assert client.get("/api/inconnu").status_code == 404
