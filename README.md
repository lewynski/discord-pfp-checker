# Discord PFP Poser Detector Pro 🔍 — Enter a User ID, find the original

<p align="center">
  <a href="https://developer.chrome.com/docs/extensions/mv3/intro/"><img src="https://img.shields.io/badge/manifest-v3-blue?style=flat-square" alt="Manifest V3"></a>
  <img src="https://img.shields.io/badge/version-2.1-5865F2?style=flat-square" alt="Version 2.1">
  <img src="https://img.shields.io/badge/platform-Chrome%20%7C%20Chromium-yellow?style=flat-square" alt="Chrome / Chromium">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License: MIT"></a>
</p>

Discord PFP Poser Detector Pro is a lightweight browser extension that grabs a Discord profile picture in high resolution and reverse-searches it across **Google Lens, Yandex, and Bing**. Use it to check whether a PFP was copied from Pinterest or another source.

Just enter a **Discord User ID** and the avatar is fetched for you. You can also paste an image link, or right-click an image or a highlighted ID on any page.

**Private by design.** There is no account, no tracking, no analytics, and no server of our own. The extension only calls the public lookup APIs listed under [How the ID lookup works](#how-the-id-lookup-works), and nothing is stored.

## Features

| Feature | What it does |
| --- | --- |
| 🆔 **User ID lookup** | Type or paste a 17–20 digit ID (or a `<@id>` mention) and the PFP and display name load automatically. |
| 🔗 **Paste a link** | Paste any Discord CDN link and it is upgraded to a 1024px PNG. |
| 🖱️ **Right-click search** | Right-click any image, or a highlighted User ID, and send it straight to Google Lens. |
| 🔎 **Multi-engine search** | Google Lens, Yandex (best for faces and crops), Bing Visual, or **Deep Scan** to open all three at once. |
| 🖼️ **Auto-enhance** | Converts `.webp` and `.gif` avatars to static `.png` at `size=1024`, because search engines match these far better. |
| 🧩 **Default avatars** | Users with no custom PFP still resolve to the right default Discord avatar. |

## Install

The extension isn't on the Chrome Web Store yet, so load it manually. It takes about 30 seconds.

1. Download this repo: **Code → Download ZIP**, then unzip it. You can also run `git clone`.
2. Open `chrome://extensions` in Chrome, Edge, Brave, or any Chromium browser.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select the repo folder, the one that contains `manifest.json`.
5. Pin the extension from the puzzle-piece menu for quick access.

```bash
git clone https://github.com/lewynski/discord-pfp-checker.git
```

## Quick start

1. Click the extension icon.
2. Enter a Discord User ID, for example `80351110224678912`. The avatar and name appear in the preview card.
3. Pick an engine:
   - **Google Lens** is best for finding Pinterest sources.
   - **Yandex** is best for faces and cropped images.
   - **Bing Visual** gives a second opinion.
   - **Deep Scan** opens all three.

To get a User ID, turn on **Developer Mode** in Discord (*Settings → Advanced*), then right-click a user and choose **Copy User ID**.

## How the ID lookup works

Discord's official API needs a bot token to look up users, so this extension uses public community lookup services instead. It tries them in order until one answers:

1. [`japi.rest`](https://japi.rest)
2. [`discordlookup.mesalytic.moe`](https://discordlookup.mesalytic.moe)
3. [`api.lanyard.rest`](https://api.lanyard.rest)

The service returns the user's avatar hash. The extension then builds the avatar URL on Discord's own CDN (`cdn.discordapp.com`). Only public profile data is used.

> [!NOTE]
> These are unofficial third-party services. They can change, rate-limit, or go offline at any time. If a lookup fails, paste the avatar's image link instead.

## How it fits together

- [`popup.html`](popup.html) and [`popup.js`](popup.js) hold the popup UI, ID detection, API lookup, preview, and search buttons.
- [`background.js`](background.js) is the service worker that powers the right-click menu for images and selected User IDs.
- [`manifest.json`](manifest.json) declares the Manifest V3 config. The permissions are `activeTab` and `contextMenus`, plus host access to the three lookup APIs above.

## Privacy

- No data is collected or stored by this extension.
- The User ID you enter is sent to the lookup APIs listed above.
- The avatar URL is sent to the search engine you choose (Google, Yandex, or Bing) so it can run the image search.

## Development

There is no build step. Edit the files and click **Reload** on the extension card in `chrome://extensions`.

```bash
git clone https://github.com/lewynski/discord-pfp-checker.git
cd discord-pfp-checker
# edit, then reload the extension in chrome://extensions
```

## Contributing

Issues and pull requests are welcome. Good first ideas include:

- More lookup providers as fallbacks
- Firefox support
- Animated GIF previews
- A history of recent lookups

## Disclaimer

This project is not affiliated with or endorsed by Discord, Google, Yandex, Microsoft, or Pinterest. It only uses publicly available profile data. A match on a reverse image search is a lead, not proof. Please respect people's privacy and don't use this tool to harass anyone.

## License

[MIT](LICENSE) © Jon Lewyn Tanggaro
