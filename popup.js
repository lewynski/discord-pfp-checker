const urlInput = document.getElementById('avatarUrl');
const imgPreview = document.getElementById('imgPreview');
const placeholderIcon = document.getElementById('placeholderIcon');
const statusText = document.getElementById('statusText');
const subText = document.getElementById('subText');
const errorMsg = document.getElementById('errorMsg');
const forceHighRes = document.getElementById('forceHighRes');

let resolvedAvatarUrl = "";
let resolvedUserLabel = "";
let activeLookupSequence = 0;
let activeLookupPromise = null;
let debounceTimer = null;

// Extract a 17-20 digit Discord Snowflake ID from raw ID or <@id> mention
function extractDiscordUserId(input) {
  const trimmed = input.trim();
  const mentionMatch = trimmed.match(/^<@!?(\d{17,20})>$/);
  if (mentionMatch) return mentionMatch[1];
  if (/^\d{17,20}$/.test(trimmed)) return trimmed;
  return null;
}

// Compute default Discord avatar URL when user has no custom avatar
function getDefaultAvatarUrl(userId, discriminator) {
  try {
    if (discriminator && discriminator !== "0" && discriminator !== "0000") {
      const idx = parseInt(discriminator, 10) % 5;
      return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
    }
    const idx = Number((BigInt(userId) >> 22n) % 6n);
    return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
  } catch (e) {
    return "https://cdn.discordapp.com/embed/avatars/0.png";
  }
}

// Build CDN URL from user ID and avatar hash
function buildAvatarUrlFromHash(userId, avatarHash, discriminator) {
  if (!avatarHash) {
    return getDefaultAvatarUrl(userId, discriminator);
  }
  const isAnimated = avatarHash.startsWith("a_");
  const ext = (!forceHighRes.checked && isAnimated) ? "gif" : "png";
  const sizeParam = forceHighRes.checked ? "?size=1024" : "";
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${ext}${sizeParam}`;
}

// Upgrade Discord CDN links to 1024px static PNG so search engines don't choke
function cleanAndEnhanceUrl(rawUrl) {
  let cleaned = rawUrl.trim();
  if (!cleaned) return "";

  try {
    const urlObj = new URL(cleaned);
    if (urlObj.hostname.includes("discordapp.com") || urlObj.hostname.includes("discordapp.net")) {
      if (forceHighRes.checked) {
        // Force .png instead of .webp or .gif
        urlObj.pathname = urlObj.pathname.replace(/\.(webp|gif)$/i, ".png");
        // Force max resolution
        urlObj.searchParams.set("size", "1024");
      }
      return urlObj.toString();
    }
  } catch (err) {
    // Return original if URL parsing fails
  }
  return cleaned;
}

// Fetch Discord user profile by User ID across public lookup endpoints
async function fetchDiscordUserPfp(userId) {
  const endpoints = [
    {
      url: `https://japi.rest/discord/v1/user/${userId}`,
      parse: (json) => {
        const d = json && json.data;
        if (!d || !d.id) return null;
        const avatarUrl = d.avatar
          ? buildAvatarUrlFromHash(d.id, d.avatar, d.discriminator)
          : (d.avatarURL || d.defaultAvatarURL || getDefaultAvatarUrl(d.id, d.discriminator));
        const displayName = d.global_name ? `${d.global_name} (@${d.username})` : (d.username || d.tag || `ID: ${d.id}`);
        return { avatarUrl, displayName };
      }
    },
    {
      url: `https://discordlookup.mesalytic.moe/v1/user/${userId}`,
      parse: (json) => {
        if (!json || !json.id) return null;
        const avatarHash = json.avatar && json.avatar.id;
        const avatarUrl = avatarHash
          ? buildAvatarUrlFromHash(json.id, avatarHash, json.discriminator)
          : ((json.avatar && json.avatar.link) || getDefaultAvatarUrl(json.id, json.discriminator));
        const displayName = json.global_name ? `${json.global_name} (@${json.username})` : (json.username || `ID: ${json.id}`);
        return { avatarUrl, displayName };
      }
    },
    {
      url: `https://api.lanyard.rest/v1/users/${userId}`,
      parse: (json) => {
        const u = json && json.data && json.data.discord_user;
        if (!u || !u.id) return null;
        const avatarUrl = buildAvatarUrlFromHash(u.id, u.avatar, u.discriminator);
        const displayName = u.global_name ? `${u.global_name} (@${u.username})` : (u.username || `ID: ${u.id}`);
        return { avatarUrl, displayName };
      }
    }
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url);
      if (!response.ok) continue;
      const data = await response.json();
      const parsed = endpoint.parse(data);
      if (parsed && parsed.avatarUrl) {
        return parsed;
      }
    } catch (e) {
      // Try next fallback endpoint
    }
  }

  throw new Error("Could not find Discord user or fetch their avatar.");
}

// Render preview image and status text
function loadPreviewImage(rawTargetUrl, userLabel = "") {
  const finalUrl = cleanAndEnhanceUrl(rawTargetUrl);
  resolvedAvatarUrl = finalUrl;

  imgPreview.src = finalUrl;
  imgPreview.onload = () => {
    placeholderIcon.style.display = 'none';
    imgPreview.style.display = 'block';
    statusText.textContent = userLabel ? userLabel : "Avatar Loaded Ready!";
    subText.textContent = forceHighRes.checked ? "Enhanced to 1024px PNG" : "Raw URL loaded";
  };

  imgPreview.onerror = () => {
    imgPreview.style.display = 'none';
    placeholderIcon.style.display = 'block';
    placeholderIcon.textContent = '?';
    statusText.textContent = "Invalid or Expired Link";
    subText.textContent = "Make sure the ID or URL points to a valid avatar.";
  };
}

// Handle User ID lookup or direct URL update
function updatePreview() {
  const rawInput = urlInput.value.trim();
  errorMsg.style.display = 'none';

  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }

  if (!rawInput) {
    activeLookupSequence++;
    resolvedAvatarUrl = "";
    resolvedUserLabel = "";
    imgPreview.style.display = 'none';
    placeholderIcon.style.display = 'block';
    placeholderIcon.textContent = '?';
    statusText.textContent = "Waiting for ID or link...";
    subText.textContent = "Enter a Discord User ID or paste an image URL.";
    return;
  }

  const userId = extractDiscordUserId(rawInput);
  if (userId) {
    const seq = ++activeLookupSequence;
    resolvedAvatarUrl = "";
    imgPreview.style.display = 'none';
    placeholderIcon.style.display = 'block';
    placeholderIcon.textContent = '⏳';
    statusText.textContent = "Fetching Discord User...";
    subText.textContent = `Looking up ID ${userId}...`;

    debounceTimer = setTimeout(() => {
      activeLookupPromise = (async () => {
        try {
          const result = await fetchDiscordUserPfp(userId);
          if (seq !== activeLookupSequence) return;
          resolvedUserLabel = result.displayName;
          loadPreviewImage(result.avatarUrl, result.displayName);
        } catch (err) {
          if (seq !== activeLookupSequence) return;
          resolvedAvatarUrl = "";
          imgPreview.style.display = 'none';
          placeholderIcon.style.display = 'block';
          placeholderIcon.textContent = '!';
          statusText.textContent = "User Lookup Failed";
          subText.textContent = "Verify the Discord User ID is valid.";
        }
      })();
    }, 200);
    return;
  }

  // Otherwise treat input as a direct URL
  activeLookupSequence++;
  resolvedUserLabel = "";
  loadPreviewImage(rawInput);
}

urlInput.addEventListener('input', updatePreview);
forceHighRes.addEventListener('change', () => {
  const userId = extractDiscordUserId(urlInput.value);
  if (userId && resolvedAvatarUrl) {
    // Re-apply high-res setting to already resolved URL without re-fetching unless needed
    loadPreviewImage(resolvedAvatarUrl, resolvedUserLabel);
  } else {
    updatePreview();
  }
});

// Generate search URLs for different engines
function getEngineUrl(engine, targetImageUrl) {
  const encoded = encodeURIComponent(targetImageUrl);
  switch (engine) {
    case 'lens':
      return `https://lens.google.com/uploadbyurl?url=${encoded}`;
    case 'yandex':
      return `https://yandex.com/images/search?rpt=imageview&url=${encoded}`;
    case 'bing':
      return `https://www.bing.com/images/search?view=detailv2&iss=sbi&q=imgurl:${encoded}`;
  }
}

async function runSearch(engines) {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
    const userId = extractDiscordUserId(urlInput.value);
    if (userId && !resolvedAvatarUrl) {
      const seq = ++activeLookupSequence;
      try {
        const result = await fetchDiscordUserPfp(userId);
        if (seq === activeLookupSequence) {
          resolvedUserLabel = result.displayName;
          loadPreviewImage(result.avatarUrl, result.displayName);
        }
      } catch (e) {
        // Handled below if resolvedAvatarUrl is still empty
      }
    }
  } else if (activeLookupPromise && !resolvedAvatarUrl) {
    await activeLookupPromise;
  }

  const finalUrl = resolvedAvatarUrl || cleanAndEnhanceUrl(urlInput.value);
  if (!finalUrl || extractDiscordUserId(finalUrl)) {
    errorMsg.style.display = 'block';
    return;
  }

  engines.forEach((engine) => {
    const searchUrl = getEngineUrl(engine, finalUrl);
    chrome.tabs.create({ url: searchUrl });
  });
}

// Button listeners
document.getElementById('btnLens').addEventListener('click', () => runSearch(['lens']));
document.getElementById('btnYandex').addEventListener('click', () => runSearch(['yandex']));
document.getElementById('btnBing').addEventListener('click', () => runSearch(['bing']));
document.getElementById('btnAll').addEventListener('click', () => runSearch(['lens', 'yandex', 'bing']));
