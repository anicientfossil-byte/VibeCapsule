# VibeCapsule (GitHub Pages, no build step)

Plain static site: `index.html` + `config.js`. No Node, no npm, no build.

## Put it online
1. Create a GitHub repo, upload **all files in this folder** (drag and drop works; include `.nojekyll`).
2. Repo **Settings > Pages > Build and deployment**: Source = *Deploy from a branch*, Branch = `main`, folder `/ (root)`. Save.
3. After ~1 minute your site is at `https://<user>.github.io/<repo>/`.

## Make playlists load (pick one or both)

### A. Cloudflare Worker (recommended; lets anyone paste a public playlist link)
```
cd worker
npx wrangler login
# edit wrangler.toml: ALLOWED_ORIGINS = "https://<user>.github.io"
npx wrangler deploy
```
Paste the printed URL into `config.js` as `API_BASE`, commit.

### B. Spotify login (your own playlists)
1. https://developer.spotify.com/dashboard > Create app > Web API.
2. Add Redirect URI = the exact address shown in the site's login window (e.g. `https://<user>.github.io/<repo>/`).
3. Put the Client ID in `config.js` (or paste it in the login window).
Dev-mode limits: app owner needs Premium, max 5 allowlisted users, tracks readable only for playlists you own/collaborate on.

Without A or B the site loads but cannot import playlists.
