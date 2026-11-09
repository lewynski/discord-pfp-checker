# Discord PFP Poser Detector Pro

A Chrome extension (Manifest V3) that extracts Discord profile pictures and reverse-searches them across Google Lens, Yandex, and Bing to help spot stolen or "poser" PFPs (e.g. from Pinterest).

## Features
- **User ID lookup**: enter a Discord User ID (or `<@id>` mention) and the PFP is fetched automatically.
- **Paste a link**: Discord CDN URLs are auto-upgraded to a 1024px PNG.
- **Right-click**: on any image, or on a highlighted User ID, to search with Google Lens.
- **Multi-engine search**: Google Lens, Yandex, Bing, or Deep Scan (all three).

## Install
1. Clone or download this repo.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Click **Load unpacked** and select the `discord-pfp-checker` folder.

## How the ID lookup works
Only public avatar data is used. The extension queries third-party lookup APIs (`japi.rest`, with fallbacks to `discordlookup.mesalytic.moe` and `api.lanyard.rest`), then builds the avatar URL on Discord's CDN. These services are unofficial and may change or go offline. No data is stored.

## Disclaimer
Not affiliated with Discord. Use responsibly and respect people's privacy.
