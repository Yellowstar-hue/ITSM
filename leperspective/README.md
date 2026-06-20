# Le Perspective

A scroll-driven landing page for **Le Perspective Media** — _"The news media sucks. So here's another one."_

The site tells the story of how news evolved, in a fun way:

> Oral Traditions → Early Scribes → The Print → The TV → Social Media → **Le Perspective**

## Highlights

- **Pinned horizontal timeline** — the history of news scrolls sideways as you scroll down.
- **Kinetic hero** with outline type, parallax and a staggered intro reveal.
- **Scroll-reveal** animations, line-by-line manifesto, marquees and a custom cursor.
- **Scroll progress** bar, hide-on-scroll nav and a back-to-top control.
- Fully **responsive** and **reduced-motion friendly**.
- **Zero dependencies / no build step** — plain HTML, CSS and vanilla JS.

## Run it

It's a static site. Any static server works:

```bash
cd leperspective
python3 -m http.server 8099
# open http://localhost:8099
```

Or just open `index.html` in a browser.

## Structure

```
leperspective/
├── index.html        # markup + content
├── styles.css        # all styling, design tokens, responsive rules
├── script.js         # loader, cursor, reveals, pinned timeline, progress
└── assets/
    ├── logo.svg       # full brand lockup
    └── monogram.svg   # "P." mark (favicon + inline use)
```

## Brand

- Ink `#0A0A0A` · Paper `#F3F1EA` · Lime accent `#C5F94E`
- Display: Space Grotesk · Accents: Instrument Serif (italic) · Body: Inter

Follow on LinkedIn: https://www.linkedin.com/company/leperspective/

_There is no contact us. (Lol) Bye._
