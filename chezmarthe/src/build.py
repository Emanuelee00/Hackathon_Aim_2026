import sys,os
css=open('common.css').read();nav=open('nav.js').read()
for name,title,sub in [('accueil','Chez Marthe | Proposer un projet','Tiers-lieu solidaire'),('equipe','Chez Marthe | Espace équipe','Espace équipe'),('partenaire','Chez Marthe | Associations','Associations hébergées'),('benevole','Chez Marthe | Bénévoles','Espace bénévoles'),('retour','Chez Marthe | Bilan','Bilan d\'événement')]:
    if not os.path.exists(name+'.html'):continue
    body=open(name+'.html').read()
    extra_css,_,body=body.partition('<!--/css-->') if '<!--/css-->' in body else ('','',body)
    html=f'''<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>{title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Anton&family=Atkinson+Hyperlegible:wght@400;700&display=swap" rel="stylesheet">
<style>{css}{extra_css}</style></head><body>
<div class="demo-note">Démonstration hackathon, données fictives</div>
<header class="top"><div class="wrap"><a class="brand" data-link="accueil">CHEZ MARTHE<small>{sub}</small></a><nav class="sites" aria-label="Espaces de la plateforme"></nav></div></header>
{body}
<div class="toast" id="toast" role="status"></div>
<script>{nav}</script><script>cmNav("{name}");</script>
</body></html>'''
    os.makedirs(f'../{name}',exist_ok=True)
    open(f'../{name}/index.html','w').write(html)
    print('built',name)
