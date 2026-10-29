# VibeCapsule

Spatial 3D playlist bridge. React + Vite site hosted on GitHub Pages. Paste a Spotify playlist link and it plays the tracks as a YouTube queue.

- `src/` the app. `intro.js`, `intro.css`, `frames/` the scroll intro. `config.js` your Worker address and Spotify Client ID.
- `worker/` the Cloudflare Worker that fetches playlists (see its comments).
- Starts empty: set `DEMO_SONGS_ENABLED` to `true` in `src/data/playlistPresets.ts` to start with demo songs.
- The GitHub Action in `.github/workflows/deploy.yml` builds and publishes the site on every push to `main`.
