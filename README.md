# Spunti

> Cattura. Incuba. Distilla.

**Spunti** è una PWA statica — un diario/incubatore personale per raccogliere cose da vedere, leggere, fare, studiare o semplicemente tenere in mente. Niente notifiche, niente streak, niente ansia da produttività.

---

## Cosa fa

- **Cattura** idee, film, libri, progetti, pensieri in modo rapido
- **Incuba** gli spunti che non sono ancora pronti — non spariscono, maturano
- **Distilla** il tuo archivio personale in un testo pronto per l'analisi AI

I dati restano sul tuo dispositivo (localStorage). Nessun backend, nessun account.

---

## Come usarla

### Schermate principali

| Schermata | Descrizione |
|-----------|-------------|
| **Home** | Panoramica e spunti attivi |
| **Spunti** | Lista completa con ricerca e filtri |
| **Trend** | Statistiche per stato, tipo, energia e tag |
| **Export** | Esporta e importa i tuoi dati |

### Ciclo di vita di uno spunto

1. **Inbox** — appena catturato, da valutare
2. **Attivo** — su cui vuoi concentrarti ora
3. **Non adesso** — interessante ma non il momento
4. **Maturato** — pronto per essere approfondito o vissuto
5. **Archiviato** — fatto, abbandonato o non più rilevante

### Campi dello spunto

| Campo | Descrizione |
|-------|-------------|
| Titolo | Cosa è (obbligatorio) |
| Tipo | Categoria (vedere, leggere, fare…) |
| Stato | Fase del ciclo di vita |
| Energia | Quanto "ti costa" affrontarlo |
| Perché mi interessa | La motivazione originale |
| Prossima azione minima | Il passo più piccolo possibile |
| Note | Appunti liberi |
| Link | URL di riferimento |
| Tag | Etichette libere, separate da virgola |

---

## Installazione come PWA

Puoi installare Spunti sul tuo dispositivo per usarla come app nativa, senza aprire il browser.

**Android / Chrome**
1. Apri l'URL dell'app in Chrome.
2. Tocca il menu (⋮) in alto a destra.
3. Seleziona **"Aggiungi a schermata Home"** oppure **"Installa app"**.
4. Conferma: l'icona comparirà nella schermata Home.

**iPhone / iPad (Safari)**
1. Apri l'URL in Safari.
2. Tocca l'icona **Condividi** (il quadrato con la freccia).
3. Scorri e scegli **"Aggiungi alla schermata Home"**.
4. Dai un nome e tocca **Aggiungi**.

**Desktop — Chrome / Edge**
1. Apri l'URL nel browser.
2. Cerca l'icona di installazione (schermo con freccia) nella barra degli indirizzi, oppure vai su **Menu → Installa Spunti**.
3. Conferma l'installazione: l'app si apre in una finestra dedicata.

> **I dati restano nel tuo browser/dispositivo** tramite `localStorage`. Nessun dato viene inviato a server esterni. Per sicurezza, esporta periodicamente un backup JSON dalla scheda **Export**.

---

## Come pubblicarla su GitHub Pages

1. Crea un repository GitHub (es. `spunti-pwa`)
2. Carica tutti i file nella root:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `manifest.webmanifest`
   - `service-worker.js`
3. Vai su **Settings → Pages → Branch: main → / (root)** → Save
4. L'app sarà disponibile su `https://tuonome.github.io/spunti-pwa/`

> **Nota sul Service Worker e GitHub Pages:** il SW usa percorsi relativi e intercetta solo richieste dalla stessa origine. Funziona correttamente sia in locale che su GitHub Pages.

---

## Icone PWA

Per un'installazione PWA completa, aggiungi una cartella `icons/` con:
- `icons/icon-192.png` — 192×192 px
- `icons/icon-512.png` — 512×512 px

Puoi generarle da qualsiasi immagine con strumenti come [favicon.io](https://favicon.io) o [RealFaviconGenerator](https://realfavicongenerator.net). Senza icone l'app funziona ugualmente, ma non avrà un'icona personalizzata quando installata sul telefono.

---

## Export e Import dati

### Esporta Markdown per AI
Produce un file `.md` con tutti i tuoi spunti formattati e un prompt pronto da incollare in ChatGPT, Claude, Gemini o qualsiasi LLM. Puoi anche copiarlo direttamente negli appunti.

### Esporta JSON (backup completo)
Salva tutti i dati in un file JSON. Usalo per:
- Backup periodico
- Trasferire i dati su un nuovo dispositivo
- Versioning manuale

### Importa JSON
Ricarica un backup JSON. Gli spunti con lo stesso ID non vengono duplicati — puoi importare più volte in sicurezza.

### Esporta CSV
Per aprire i tuoi spunti in Excel, Google Sheets o Numbers.

---

## Limiti della v0.1

- I dati sono solo in `localStorage` — si perdono se si cancella la cache del browser
- Non c'è sincronizzazione tra dispositivi
- Non c'è ordinamento manuale delle card
- Non c'è una vista dettaglio singolo spunto (si apre direttamente la modifica)
- Nessuna icona PNG inclusa nel repo (aggiungila manualmente)
- Il Service Worker non gestisce aggiornamenti incrementali — per forzare un aggiornamento dopo una modifica ai file, incrementa `CACHE_NAME` in `service-worker.js`

---

## Possibili evoluzioni future

- Ordinamento drag-and-drop nella lista
- Vista dettaglio read-only dello spunto
- Sessioni di review periodica ("Rivedi 5 spunti a caso")
- Export verso Obsidian / Notion
- Sync opzionale via GitHub Gist o Pastebin
- Tema scuro
- Filtro multi-tag
- Import da clipboard (URL → nuovo spunto automatico)
- Versioning locale con cronologia modifiche

---

## Stack tecnico

- HTML5, CSS3, JavaScript ES6+ (vanilla)
- `localStorage` per la persistenza
- Service Worker per la cache offline
- Web App Manifest per l'installabilità
- Zero dipendenze, zero build step

---

*Fatto con cura. Dati tuoi, sempre.*
