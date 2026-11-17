# ShelfWise project web presence

A static capstone site built from the smoked-glass template. Plain HTML, CSS and JavaScript; no build step.

Run a static server from this directory:

```sh
python -m http.server 3000 --bind 127.0.0.1
```

Open http://127.0.0.1:3000. Internet access is needed for three.js 0.169.0 (jsDelivr) and the Inter variable font (rsms.me). Without WebGL or with reduced motion, the landing page uses styled HTML.

- `index.html`: glass landing; **Meet ShelfWise →** shatters into a project introduction. **← Back** reassembles.
- `about.html`: high-level overview, app screenshot, architecture, technology stack, and capstone context.
- `team.html`: confirmed photo order, alternating portraits, four 150–250 word bios, undergraduate Computer Science programs, December 2026 graduation dates, and contact fields.
- `tutorial.html`: five-step screenshot walkthrough, keyboard tabs, full text instructions, and FAQs.
- **Open app** links to the existing application at https://shelfwise-nxbo.onrender.com/.

Run `node verify.mjs` for geometry/easing, local-link integrity, biography word counts, and tutorial assets. Check syntax with `node --check app.js` and `node --check tutorial.js`.

## Before publishing

All four members are listed as undergraduate Computer Science students with expected graduation in December 2026. Will’s and Conner’s emails, Yi’s email, and Conner’s and Yi’s LinkedIn profiles are provided; replace the remaining contact/LinkedIn placeholders in `team.html` as teammates supply details. No addresses or personal details have been invented. The current bios are editorial drafts based on the supplied project responsibilities.

Publish the root HTML/CSS/JS files and `assets/` to a static host. Do not publish `.impeccable/`, which contains local review artifacts. The existing Render application is a separate site and is not changed by this project.

Photo and screenshot provenance is recorded in `assets/README.md`. The web app’s store and product information may change, so tutorial captions do not present captured prices or availability as current guarantees.
