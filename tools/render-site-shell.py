#!/usr/bin/env python3
"""Render the site shell into explicit public pages. Never traverse game archives."""
from pathlib import Path
from string import Template
import re, sys
ROOT = Path(__file__).resolve().parents[1]
PAGES = ['index.html','about.html','projects.html','links.html','404.html','feedback-thanks/index.html']
PAGES += [str(p.relative_to(ROOT)) for p in sorted((ROOT/'games').glob('*.html'))]
PAGES += [str(p.relative_to(ROOT)) for p in sorted((ROOT/'resources').glob('*.html'))]
PAGES += ['events/index.html']
PAGES += ['events/soulspires-secret/index.html']
PAGES += [f'events/{c}/{p}' for c in ['goldspire','stargate-phx'] for p in ['index.html','characters/index.html','dates/index.html','coming-soon/index.html']]
PAGES += ['shareables/story-atlas-ai-build-case-study/index.html']
LINKS = [('Public games','events/'),('About Kyle','about.html'),('Worlds & work','projects.html'),('Player resources','resources/')]
def render(page):
    f=ROOT/page;t=f.read_text();prefix='../'*(len(Path(page).parts)-1);root=prefix.rstrip('/') or '.'
    family='events/' if page.startswith('events/') else 'resources/' if page.startswith('resources/') else 'projects.html' if page.startswith(('games/','shareables/')) else page
    links='\n        '.join(f'<a href="{prefix}{url}"'+(' aria-current="page"' if family==url else '')+f'>{label}</a>' for label,url in LINKS)
    local=''
    for campaign,label,resource in [('goldspire','Peril to Profit','daggerheart'),('stargate-phx','Stargate PHX','stargate-phx')]:
        if page.startswith('events/'+campaign+'/') or page=='resources/'+resource+'.html':
            local=f'<nav class="gmk-local" aria-label="{label} navigation"><div><span>{label}</span>'
            for name,path in [('The adventure',f'events/{campaign}/'),('Dates & booking',f'events/{campaign}/dates/'),('Characters',f'events/{campaign}/characters/'),('Player guide',f'resources/{resource}.html')]:
                local+=f'<a href="{prefix}{path}">{name}</a>'
            local+='</div></nav>'
    header=Template((ROOT/'templates/site-header.tpl').read_text()).substitute(root=root,links=links,local_nav=local)
    footer=Template((ROOT/'templates/site-footer.tpl').read_text()).substitute(root=root)
    if '<!-- site-shell:start -->' in t:t=re.sub(r'<!-- site-shell:start -->.*?<!-- site-shell:end -->\n?',header,t,flags=re.S)
    elif 'shareables/' in page or 'goldspire/coming-soon' in page:t=re.sub(r'(<body[^>]*>)',r'\1\n'+header,t,count=1)
    else:t=re.sub(r'<header\b.*?</header>',header,t,count=1,flags=re.S)
    if '<!-- site-footer:start -->' in t:t=re.sub(r'<!-- site-footer:start -->.*?<!-- site-footer:end -->\n?',footer,t,flags=re.S)
    elif '<footer' in t:t=re.sub(r'<footer\b.*?</footer>',footer,t,count=1,flags=re.S)
    else:t=t.replace('</body>',footer+'</body>')
    if 'styles/site-shell.css' not in t:t=t.replace('</head>',f'  <link rel="stylesheet" href="{prefix}styles/site-shell.css" />\n  <script src="{prefix}scripts/site-shell.js" defer></script>\n</head>')
    if 'network/navigation.css' not in t:t=t.replace('</head>',f'<link rel="stylesheet" href="{prefix}network/navigation.css?v=2"><script src="{prefix}network/navigation.js?v=1" defer></script>\n</head>')
    t=t.replace('network/navigation.css?v=2','network/navigation.css?v=3')
    if not re.search(r'<main[^>]*id=',t):t=t.replace('<main','<main id="main"',1)
    if 'class="skip"' not in t and 'class="gmk-skip"' not in t:t=re.sub(r'(<body[^>]*>)',r'\1\n<a class="gmk-skip" href="#main">Skip to content</a>',t,count=1)
    if 'registration.js' in t and 'scripts/public-events.js' not in t:
        t=re.sub(r'(<script src="[^"]*registration\.js")',f'<script src="{prefix}scripts/public-events.js"></script>\n  '+r'\1',t,count=1)
    if '--check' in sys.argv:
        if t!=f.read_text():raise SystemExit(f'Stale shell: {page}')
    else:f.write_text(t)
for page in PAGES:render(page)
print(f'{len(PAGES)} static page shells '+('verified' if '--check' in sys.argv else 'rendered'))
