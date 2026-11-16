import base64

import espaces
import store
from test_store import client_as  # noqa: F401  (pytest fixture)

PNG = base64.b64encode(
    base64.b64decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
    )
).decode()
CARD = {
    "id": "chapelle",
    "name": "La Chapelle",
    "photo": "/foto/chapelle.jpg",
    "details": ["80 à 150 personnes", "114 m²"],
    "prices": [["2 heures", "40 €"], ["Journée", "300 €"]],
    "note": "Sonorisation : 50 € en plus.",
    "space": "chapelle",
}


def clients(client_as):  # noqa: F811
    trio = client_as("equipe"), client_as("residents"), client_as(None)
    for client in trio:
        client.app.include_router(espaces.router)
    return trio


def test_the_home_page_reads_the_cards_and_only_the_team_changes_them(client_as):  # noqa: F811
    team, resident, anonymous = clients(client_as)
    assert anonymous.get("/api/espaces-a-louer").json() == {"cards": None}
    assert (
        resident.put("/api/espaces-a-louer", json={"cards": [CARD]}).status_code == 403
    )
    assert (
        anonymous.put("/api/espaces-a-louer", json={"cards": [CARD]}).status_code == 401
    )
    saved = team.put("/api/espaces-a-louer", json={"cards": [CARD]})
    assert saved.status_code == 200
    card = anonymous.get("/api/espaces-a-louer").json()["cards"][0]
    assert card["name"] == "La Chapelle" and card["prices"][1] == ["Journée", "300 €"]
    assert card["link"] is None and card["focus"] == "center 50%"
    assert team.delete("/api/espaces-a-louer").json() == {"cards": None}
    assert anonymous.get("/api/espaces-a-louer").json() == {"cards": None}


def test_cards_are_checked(client_as):  # noqa: F811
    team, _, _ = clients(client_as)
    for bad in (
        {**CARD, "photo": "https://example.org/x.jpg"},
        {**CARD, "name": ""},
        {**CARD, "link": {"url": "javascript:alert(1)", "label": "x"}},
        {**CARD, "id": "a b"},
    ):
        assert (
            team.put("/api/espaces-a-louer", json={"cards": [bad]}).status_code == 422
        )
    twice = team.put("/api/espaces-a-louer", json={"cards": [CARD, CARD]})
    assert twice.status_code == 422


def test_an_uploaded_photo_is_served_and_deleted_when_no_card_uses_it(client_as):  # noqa: F811
    team, resident, anonymous = clients(client_as)
    data = f"data:image/png;base64,{PNG}"
    assert (
        resident.post("/api/espaces-a-louer/photos", json={"data": data}).status_code
        == 403
    )
    assert (
        team.post(
            "/api/espaces-a-louer/photos", json={"data": "data:text/html;base64,PGI+"}
        ).status_code
        == 422
    )
    url = team.post("/api/espaces-a-louer/photos", json={"data": data}).json()["url"]
    photo = anonymous.get(url)
    assert photo.status_code == 200 and photo.headers["content-type"] == "image/png"
    assert "immutable" in photo.headers["cache-control"]
    new = {**CARD, "id": "jardin", "name": "Le Jardin", "photo": url, "space": ""}
    assert (
        team.put("/api/espaces-a-louer", json={"cards": [CARD, new]}).status_code == 200
    )
    assert anonymous.get(url).status_code == 200
    team.put("/api/espaces-a-louer", json={"cards": [CARD]})
    assert anonymous.get(url).status_code == 404
    assert store.list_keys(espaces.PHOTO_PREFIX) == []
    gone = team.put("/api/espaces-a-louer", json={"cards": [new]})
    assert gone.status_code == 422
