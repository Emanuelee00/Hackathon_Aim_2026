from datetime import date

import gcal


def event(title, day, color=None):
    item = {"summary": title, "start": {"dateTime": f"{day}T18:00:00+01:00"}, "end": {"dateTime": f"{day}T19:00:00+01:00"}}
    return item | ({"colorId": color} if color else {})


def test_a_red_event_is_featured_and_the_others_are_not(monkeypatch):
    events = [event("Danse immersive", "2026-11-13", "11"), event("Jardinage", "2026-11-10"), event("Yoga", "2026-11-11", "4")]
    monkeypatch.setattr(gcal, "list_events", lambda *args, **kwargs: events)
    gcal._weeks.clear()
    result = gcal.week_public(date(2026, 11, 9), ttl=0)
    assert {item["title"]: item["featured"] for item in result} == {"Danse immersive": True, "Jardinage": False, "Yoga": False}
