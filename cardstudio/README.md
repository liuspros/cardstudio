# Card Studio

A batch card/badge/certificate design tool: design one template, connect a
spreadsheet and photos, and export hundreds of print-ready PDFs. Also a
general-purpose vector editor (shapes, curves, boolean ops, PowerClip,
bitmap trace, blur effects) built on Next.js + Canvas, with its own
`.cstudio` project file format.

Everything runs client-side in the browser — there is no backend, database,
or API key to configure.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy (Vercel — recommended)

1. Push this folder to a GitHub repo:
   ```bash
   git init
   git add .
   git commit -m "Card Studio"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```
2. Go to https://vercel.com/new, import the repo, and click Deploy.
   Vercel auto-detects Next.js — no configuration or environment variables
   are needed.
3. Every push to `main` redeploys automatically.

### Deploy without git (quick one-off)

```bash
npm install -g vercel
vercel
```
Follow the prompts; it deploys the current folder directly.

## Deploy elsewhere (Netlify, Render, your own server)

This is a standard Next.js app (`npm run build && npm run start`), so any
host that runs Next.js works. If your host needs a static export instead of
a Node server, note that Save/Open using the native file picker
(`showSaveFilePicker`) and PDF export both need to run in the browser
anyway, so a static export (`next export`) would work too, with the
caveat that Next's Image Optimization isn't used here so nothing is lost
by exporting statically.

## Notes for production

- Requires Node 18.17+ (set in `package.json` under `engines`).
- Bitmap tracing (`imagetracerjs`) and PSD import (`ag-psd`) run entirely
  in the browser tab and can be CPU-heavy on large files — this is
  expected, not a bug.
- PDF page rendering during PDF-page import loads its worker script from
  a CDN (`cdnjs.cloudflare.com`), so that import feature needs internet
  access even once deployed.
- The `.cstudio` project format is versioned (see `lib/project.js`) so
  files saved today keep opening after future updates.
