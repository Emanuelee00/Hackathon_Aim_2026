from features.equipe import profiles as profils
from features.equipe import site as espaces
from test_site import PNG

VERO = {
    "id": "veronique",
    "name": "Véronique",
    "role": "Coordinatrice",
    "photo": "/foto/equipe/veronique.jpg",
    "menuOrder": ["funding", "dashboard"],
    "starred": ["funding"],
    "pageBackground": {"kind": "color", "value": "#f3e9f7"},
    "menuBackground": {"kind": "image", "value": "/foto/jardin.webp"},
    "theme": "violet",
}


def clients(client_as):
    pair = client_as("equipe"), client_as("partenaires")
    for client in pair:
        client.app.include_router(profils.router)
        client.app.include_router(espaces.router)
    return pair


def test_each_person_keeps_her_own_space_and_only_the_team_sees_them(client_as):
    team, asso = clients(client_as)
    assert team.get("/api/profils").json() == {"profiles": None}
    assert asso.get("/api/profils").status_code == 403
    barbara = {"id": "barbara", "name": "Barbara"}
    assert team.put("/api/profils", json=[VERO, barbara]).status_code == 200
    # Barbara changes her menu: Véronique's space stays as it is.
    changed = {**barbara, "starred": ["quotes"]}
    saved = team.put("/api/profils/barbara", json=changed).json()["profiles"]
    assert saved[0]["menuBackground"]["value"] == "/foto/jardin.webp"
    assert saved[1]["starred"] == ["quotes"]
    added = team.put("/api/profils/lea", json={"id": "lea", "name": "Léa"})
    assert [p["id"] for p in added.json()["profiles"]] == [
        "veronique",
        "barbara",
        "lea",
    ]
    left = team.delete("/api/profils/lea").json()["profiles"]
    assert [p["id"] for p in left] == ["veronique", "barbara"]


def test_backgrounds_and_photos_are_checked(client_as):
    team, _ = clients(client_as)
    for wrong in (
        {**VERO, "pageBackground": {"kind": "color", "value": "red"}},
        {
            **VERO,
            "menuBackground": {"kind": "image", "value": "https://ailleurs.fr/x.jpg"},
        },
        {**VERO, "photo": "javascript:alert(1)"},
        {**VERO, "starred": ["<script>"]},
        {**VERO, "theme": "rose"},
        {
            **VERO,
            "menuBackground": {
                "kind": "image",
                "value": "/api/espaces-a-louer/photos/abc",
            },
        },
    ):
        assert team.put("/api/profils/veronique", json=wrong).status_code == 422, wrong
    assert team.put("/api/profils/autre", json=VERO).status_code == 422


def test_an_uploaded_background_is_kept_while_a_space_uses_it(client_as):
    team, _ = clients(client_as)
    url = team.post(
        "/api/espaces-a-louer/photos", json={"data": f"data:image/png;base64,{PNG}"}
    ).json()["url"]
    team.put(
        "/api/profils/veronique",
        json={**VERO, "pageBackground": {"kind": "image", "value": url}},
    )
    team.put(
        "/api/espaces-a-louer", json={"cards": []}
    )  # a save elsewhere cleans unused photos
    assert team.get(url).status_code == 200
    team.put("/api/profils/veronique", json=VERO)
    assert team.get(url).status_code == 404
