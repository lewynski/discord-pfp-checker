// Run this when the extension is installed or reloaded
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "checkPfpMenu",
    title: "🔍 Check PFP Poser (Pinterest / Lens)",
    contexts: ["image", "selection"] // Show when right-clicking an image or selected Discord User ID
  });
});

// Helper function to force Discord CDN links into 1024px PNGs
function optimizeDiscordUrl(rawUrl) {
  try {
    const urlObj = new URL(rawUrl);
    if (urlObj.hostname.includes("discordapp.com") || urlObj.hostname.includes("discordapp.net")) {
      // Replace .webp or .gif with .png for better reverse search accuracy
      urlObj.pathname = urlObj.pathname.replace(/\.(webp|gif)$/i, ".png");
      urlObj.searchParams.set("size", "1024");
      return urlObj.toString();
    }
  } catch (e) {
    // If it's not a standard URL, return as-is
  }
  return rawUrl;
}

// Resolve a Discord User ID to a high-res avatar URL
async function resolveUserIdToAvatar(userId) {
  const endpoints = [
    `https://japi.rest/discord/v1/user/${userId}`,
    `https://discordlookup.mesalytic.moe/v1/user/${userId}`,
    `https://api.lanyard.rest/v1/users/${userId}`
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const json = await res.json();

      if (json.data && json.data.id) {
        const d = json.data;
        if (d.avatar) {
          return `https://cdn.discordapp.com/avatars/${d.id}/${d.avatar}.png?size=1024`;
        }
        if (d.avatarURL || d.defaultAvatarURL) {
          return optimizeDiscordUrl(d.avatarURL || d.defaultAvatarURL);
        }
      }

      if (json.id && json.avatar) {
        if (json.avatar.id) {
          return `https://cdn.discordapp.com/avatars/${json.id}/${json.avatar.id}.png?size=1024`;
        }
        if (json.avatar.link) {
          return optimizeDiscordUrl(json.avatar.link);
        }
      }

      if (json.data && json.data.discord_user && json.data.discord_user.id) {
        const u = json.data.discord_user;
        if (u.avatar) {
          return `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=1024`;
        }
      }
    } catch (e) {
      // Continue to next endpoint
    }
  }
  return null;
}

// Listen for when the user clicks the right-click menu item
chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== "checkPfpMenu") return;

  if (info.srcUrl) {
    const highResUrl = optimizeDiscordUrl(info.srcUrl);
    const searchUrl = `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(highResUrl)}`;
    chrome.tabs.create({ url: searchUrl });
    return;
  }

  if (info.selectionText) {
    const cleaned = info.selectionText.trim().replace(/^<@!?(\d{17,20})>$/, "$1");
    if (/^\d{17,20}$/.test(cleaned)) {
      const avatarUrl = await resolveUserIdToAvatar(cleaned);
      if (avatarUrl) {
        const searchUrl = `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(avatarUrl)}`;
        chrome.tabs.create({ url: searchUrl });
      }
    }
  }
});
