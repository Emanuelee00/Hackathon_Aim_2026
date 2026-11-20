from datetime import date

import gcal


def event(title, day, color=None):
    item = {
        "summary": title,
        "start": {"dateTime": f"{day}T18:00:00+01:00"},
        "end": {"dateTime": f"{day}T19:00:00+01:00"},
    }
    return item | ({"colorId": color} if color else {})


def test_a_red_event_is_featured_and_the_others_are_not(monkeypatch):
    events = [
        event("Danse immersive", "2026-11-13", "11"),
        event("Jardinage", "2026-11-10"),
        event("Yoga", "2026-11-11", "4"),
    ]
    monkeypatch.setattr(gcal, "list_events", lambda *args, **kwargs: events)
    gcal._weeks.clear()
    result = gcal.week_public(date(2026, 11, 9), ttl=0)
    assert {item["title"]: item["featured"] for item in result} == {
        "Danse immersive": True,
        "Jardinage": False,
        "Yoga": False,
    }


def test_only_the_registration_address_is_made_public(monkeypatch):
    internal = (
        "Notes internes : code du portail 4521, contact https://drive.example/secret\n"
    )
    with_link = event("Danse immersive", "2026-11-13") | {
        "description": internal
        + "Inscription : https://www.helloasso.com/associations/chez-marthe/evenements/danse."
    }
    html_link = event("Yoga", "2026-11-11") | {
        "description": 'Inscriptions <a href="https://forms.gle/abc123">ici</a><br>Apporter un tapis'
    }
    no_word = event("Jardinage", "2026-11-10") | {
        "description": "Voir https://drive.example/secret"
    }
    monkeypatch.setattr(
        gcal, "list_events", lambda *args, **kwargs: [with_link, html_link, no_word]
    )
    gcal._weeks.clear()
    result = {
        item["title"]: item for item in gcal.week_public(date(2026, 11, 9), ttl=0)
    }
    assert (
        result["Danse immersive"]["link"]
        == "https://www.helloasso.com/associations/chez-marthe/evenements/danse"
    )
    assert result["Yoga"]["link"] == "https://forms.gle/abc123"
    assert result["Jardinage"]["link"] == ""  # no « Inscription » : nothing is shown
    assert "4521" not in str(result) and "secret" not in str(
        result
    )  # the rest of the description never leaves


def test_registration_link_ignores_unsafe_or_missing_addresses():
    assert gcal.registration_link("") == ""
    assert (
        gcal.registration_link("Inscription : http://exemple.fr/x") == ""
    )  # https only
    assert (
        gcal.registration_link("Réservation : https://exemple.fr/x)")
        == "https://exemple.fr/x"
    )
