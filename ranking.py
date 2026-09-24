import re

STOPWORDS = {"avec", "pour", "dans", "entre", "nous", "notre", "vous", "leur", "autour"}


def stems(text: str) -> set[str]:
    words = re.findall(r"\w{4,}", text.casefold())
    return {word[:6] for word in words if word not in STOPWORDS}


def shared_terms(event_text: str, profile: dict) -> list[str]:
    """Terms of the resident's goals and skills that also appear in the event."""
    event = stems(event_text)
    terms = []
    for item in profile["goals"] + profile["skills"]:
        if any(a.startswith(b) or b.startswith(a) for a in stems(item) for b in event):
            terms.append(item)
    return terms


def rank_profiles(
    event_text: str, profiles: list[dict]
) -> list[tuple[dict, list[str]]]:
    """Best three profiles by overlap; everyone stays eligible when nobody overlaps."""
    scored = [(profile, shared_terms(event_text, profile)) for profile in profiles]
    related = [item for item in scored if item[1]]
    related.sort(key=lambda item: len(item[1]), reverse=True)
    return (related or scored)[:3]


def guided_rationale(first_name: str, terms: list[str]) -> dict[str, str]:
    if not terms:
        return {
            "rationale": f"Aucun lien direct détecté : l'événement reste ouvert à {first_name}.",
            "benefit": "Un moment pour découvrir le lieu et rencontrer d'autres personnes.",
            "vigilance": "Demander à la résidente si le thème l'intéresse.",
        }
    return {
        "rationale": f"Lien avec le profil de {first_name} : {', '.join(terms)}.",
        "benefit": "Mettre en pratique ce qui compte pour elle dans un cadre concret.",
        "vigilance": "Vérifier ses disponibilités et son envie de participer.",
    }
