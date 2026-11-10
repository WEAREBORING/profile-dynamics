# Profile Dynamics site-code

De eigen CSS en JavaScript van de Webflow-site van Profile Dynamics. Webflow laadt ze via jsDelivr, zodat de code niet in de custom-code-velden van Webflow staat (die hebben een limiet).

| Bestand | Wat | In Webflow |
|---|---|---|
| `site.css` | vloeiende root-fontgrootte, rich text, focus, en verder alleen wat Webflow niet zelf kan | site-head, als `<link>` |
| `site.js` | attribuutmodules (`data-p-*`) | site-footer, als `<script>` |
| `test/index.html` | lokale testpagina voor alle modules | niet |

De repository is publiek: zet er nooit sleutels, tokens of interne documentatie in.

## In Webflow

Site settings > Custom code. Staat er andere code in dezelfde blokken (bijvoorbeeld Google Tag Manager), dan blijft die staan.

```html
<!-- head -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/WEAREBORING/profile-dynamics@<tag>/site.min.css">
<!-- footer -->
<script src="https://cdn.jsdelivr.net/gh/WEAREBORING/profile-dynamics@<tag>/site.min.js"></script>
```

- Altijd een tag, nooit `@main`: jsDelivr bewaart een branch tot 7 dagen in de cache, een tag verandert nooit.
- Het script zonder `defer` of `async`: `data-p-form` moet draaien vóór webflow.js het formulier start.
- `.min.` maakt jsDelivr zelf.

## Een wijziging uitbrengen

1. Pas `site.js` of `site.css` aan en hoog het versienummer in de eerste commentaarregel op.
2. Test lokaal met `test/index.html`.
3. Commit, tag en push: `git tag vX.Y.Z && git push && git push --tags`. Eén tag per release, ook als maar één bestand wijzigt.
4. Controleer dat jsDelivr de nieuwe versie geeft: `curl -s https://cdn.jsdelivr.net/gh/WEAREBORING/profile-dynamics@vX.Y.Z/site.js | head -1`. Vraag daarna ook `site.min.js` en `site.min.css` op tot ze 200 geven: jsDelivr maakt de `.min`-bestanden pas bij het eerste verzoek, en dat eerste verzoek kan in de browser mislukken (dan draait site.js niet). Gaf de push een fout (GitHub gaf soms 500, soms alleen op de tag), controleer dan `main` en de tag met `git ls-remote origin`.
5. Lees het head- en footerblok in Webflow (`get_site_freeform_code`), vervang alleen de tag in de link en schrijf het blok terug (`set_site_freeform_code`).
6. Publiceer naar webflow.io en controleer de pagina in de browser.

Terugdraaien: zet de vorige tag terug in Webflow en publiceer.

## Pagina-code

Code die maar op één pagina hoort, komt in `pages/<slug>.js` en gaat als `<script>` in de custom code van die pagina, met dezelfde tag. Gebruik dit alleen als een `data-p-*`-module in `site.js` niet past.

## Homepage (pagina home-nieuw)

De beweging van de nieuwe homepage staat in `home/` en laadt alleen op die pagina, niet in de site-footer.

| Bestand | Wat |
|---|---|
| `home/home.js` | lader: zoekt de `data-p-*`-hooks op de pagina, laadt alleen de modules die nodig zijn (van dezelfde tag, `.min.js` als hij zelf als `.min.js` geladen is) en zet `html[data-p-ready]` als alles klaarstaat |
| `home/modules/*.js` | één module per onderwerp: `reveal`, `photos`, `seal`, `btn`, `marquee`, `products`, `cases`, `testimonials`. Elk exporteert `init(container, a)` |
| `test/home.html` | lokale testpagina met alle hooks; gebruikt beelden en letters uit `design/homepage/` in de projectmap |

In Webflow, Page settings van `home-nieuw` > Custom code > Before `</body>`:

```html
<script type="module" src="https://cdn.jsdelivr.net/gh/WEAREBORING/profile-dynamics@home-vX.Y.Z/home/home.min.js"></script>
```

- De code leest alleen `data-p-*`-attributen, geen eigen classnamen; de enige classes zijn de Webflow-statusclasses `w-dyn-bind-empty` en `w-condition-invisible` (lege of verborgen CMS-beelden in `cases.js`). GSAP komt van de site (3.12.2); ontbreekt hij, dan laadt `home.js` dezelfde versie. Lenis van de site (`let lenis`) wordt gestopt zolang de case-modal open is.
- Wat binnenkomt wordt tot `data-p-ready` verborgen door de css in de embed `CSS - Home`. Die css, het hookcontract en de easing staan in `docs/code.md` in de projectmap.
- Testen: serveer de projectmap (niet alleen `site-code/`, de testpagina haalt beelden uit `design/homepage/`), bijvoorbeeld `python3 -m http.server 8767 --bind 127.0.0.1`, en open `http://127.0.0.1:8767/site-code/test/home.html`. Bovenaan staat "geladen, geen fouten" als alles goed gaat.

Een nieuwe versie uitbrengen:

1. Pas de code aan en hoog het versienummer in de eerste regel van `home/home.js` op (ook als alleen een module verandert).
2. Test met `test/home.html` op 1440, 834 en 390 px.
3. Commit, tag en push: `git tag home-vX.Y.Z && git push && git push --tags`. De tags van de homepage beginnen met `home-`, los van die van `site.js`.
4. Warm jsDelivr op tot alles 200 geeft (de `.min`-bestanden maakt jsDelivr pas bij het eerste verzoek):

   ```bash
   tag=home-vX.Y.Z; for f in home/home.js home/home.min.js $(cd home/modules && ls *.js | sed 's/\.js$//' | while read m; do echo home/modules/$m.js home/modules/$m.min.js; done); do curl -s -o /dev/null -w "%{http_code} $f\n" "https://cdn.jsdelivr.net/gh/WEAREBORING/profile-dynamics@$tag/$f"; done
   ```

5. Zet de nieuwe tag in de footer-code van de pagina in Webflow en publiceer naar webflow.io. Terugdraaien: de vorige tag terugzetten.

Een nieuwe module: maak `home/modules/<naam>.js` met `export function init(container, a) { ...; return a.clean; }` en zet een regel in de tabel `modules` in `home/home.js`. Gebruik `a.listen`, `a.wait`, `a.raf`, `a.view`, `a.withGsap` en `a.undo`, dan ruimt `a.clean` alles op. Importeer niets uit een andere module (jsDelivr laat paden in `import` staan).

## Toegang

Profile Dynamics past deze code zelf aan, met Claude Code in de map `profile-dynamics-website/` (die zet de repository in `site/`). Wie code uitbrengt, heeft schrijfrechten op deze repository nodig: voeg die persoon toe onder Settings > Collaborators. Lezen kan iedereen, want de repository is publiek.

Gaat de repository later naar een andere eigenaar (bijvoorbeeld een GitHub-organisatie van de klant), zet dan na de verhuizing de nieuwe eigenaar in beide jsDelivr-links in Webflow (`gh/<eigenaar>/<repo>@<tag>`) en in `profile-dynamics-website/CLAUDE.md`.
