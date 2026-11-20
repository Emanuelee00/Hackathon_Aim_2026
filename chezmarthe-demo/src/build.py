"""Assemble each page into a standalone ../<name>/index.html.

Sources, one subfolder per kind:
  pages/<name>.html  body markup only
  css/common.css     shared styles; css/<name>.css  page styles
  js/nav.js          inter-sites menu; js/<name>.js     page script

Edit the sources, then run: python3 build.py
"""

import os

css = open("css/common.css").read()
nav = open("js/nav.js").read()
for name, title, sub in [
    ("accueil", "Chez Marthe | Proposer un projet", "Tiers-lieu solidaire"),
    ("equipe", "Chez Marthe | Espace équipe", "Espace équipe"),
    ("partenaire", "Chez Marthe | Associations", "Associations hébergées"),
    ("benevole", "Chez Marthe | Bénévoles", "Espace bénévoles"),
    ("retour", "Chez Marthe | Bilan", "Bilan d'événement"),
]:
    page = f"pages/{name}.html"
    if not os.path.exists(page):
        continue
    body = open(page).read() + f"<script>{open(f'js/{name}.js').read()}</script>\n"
    page_css = open(f"css/{name}.css").read()
    html = f'''<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>{title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Anton&family=Atkinson+Hyperlegible:wght@400;700&display=swap" rel="stylesheet">
<style>{css}{page_css}</style></head><body>
<div class="demo-note">Démonstration hackathon, données fictives</div>
<header class="top"><div class="wrap"><a class="brand" data-link="accueil">CHEZ MARTHE<small>{sub}</small></a><nav class="sites" aria-label="Espaces de la plateforme"></nav></div></header>
{body}
<div class="toast" id="toast" role="status"></div>
<script>{nav}</script><script>cmNav("{name}");</script>
</body></html>'''
    os.makedirs(f"../{name}", exist_ok=True)
    open(f"../{name}/index.html", "w").write(html)
    print("built", name)
