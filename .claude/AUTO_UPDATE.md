# Auto-Update System

Pic Collage has **4 independent mechanisms** to keep the app up-to-date automatically.

---

## How It Works (From My Side)

### 1. Service Worker Auto-Update ⭐ (Primary)
- Built into `vite.config.ts` with `registerType: 'autoUpdate'`
- The service worker checks for updates **every 45 minutes**
- When a new deployment is detected, it:
  1. Downloads the new files in the background
  2. Shows "Updating..." toast
  3. **Auto-reloads the page** within 150ms
- This is the main mechanism — works silently

### 2. Version.json Polling (Fallback)
- `useVersionCheck.ts` polls `version.json` every 45 minutes
- Compares build ID in current page vs. latest on server
- If mismatch detected → **immediate reload**
- Catches cases where the service worker fails/throttles

### 3. Cache-Bust Comment
- Every commit bumps a comment in `index.html`
- Forces GitHub Pages CDN to treat it as a new file
- Prevents `index.html` from being cached forever

### 4. On-Page Visibility
- When you switch back to the tab after being away
- Both SW and version check fire immediately
- Updates land within seconds of switching back

---

## How YOU Can Force an Update (From Your Side)

| Method | Steps | Effect |
|--------|-------|--------|
| **?nocache=1** | Add to URL: `https://sashimee.github.io/Pic-collage/?nocache=1` | Bypasses browser cache for that load |
| **Hard Reload** | **Chrome/Android**: Hold refresh button → "Empty Cache and Hard Reload" | Clears all cached assets |
| **iOS Safari** | Settings → Safari → Clear History and Website Data | Full cache wipe |
| **Chrome DevTools** | F12 → Network tab → Disable cache checkbox → reload | Bypasses cache while DevTools open |
| **Unregister SW** | Chrome DevTools → Application → Service Workers → Unregister | Forces fresh SW install |
| **Incognito Mode** | Open in private/incognito window | No cache from previous sessions |

---

## What I Can Do On Demand

If you say **"force update now"** I will:

1. Bump the cache-bust timestamp in `index.html`
2. Rebuild and push to `main`
3. GitHub Pages deploys within ~30 seconds
4. Your service worker detects the new build ID
5. Page auto-reloads with the latest code

**This is the most reliable method** — it guarantees the server serves fresh files.

---

## Typical Delay Breakdown

| Stage | Time |
|-------|------|
| Git push → GitHub Actions starts | 0-5 sec |
| Build + deploy to Pages | 20-40 sec |
| CDN edge propagation (Cloudflare) | 10-60 sec |
| Service worker detects update | 0-45 min (or on tab focus) |
| **Total worst case** | ~46 minutes |
| **Total with tab focus** | ~1 minute |
| **Total with ?nocache=1** | Instant (bypasses cache) |

---

## Troubleshooting

**"I still see the old version"**
1. Try `?nocache=1` on the URL
2. Hard reload (Ctrl+Shift+R or Cmd+Shift+R)
3. If using the PWA (installed app), uninstall and reinstall
4. Check DevTools → Application → Service Workers to see if new SW is waiting

**"The PWA app doesn't update"**
- Installed PWAs cache aggressively
- Kill the app fully (swipe away from recents)
- Reopen — the SW check fires on cold start
- Or use the in-app **Refresh** button (top-right) which calls `location.reload(true)`
