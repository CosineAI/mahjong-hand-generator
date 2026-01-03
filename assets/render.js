// Rendering helpers for the Taiwanese Mahjong winning-hand UI.

import { WIN_TYPE_DISCARD, WIN_TYPE_SELF_DRAWN } from "./scoring.js";

export function createTileElement(tile) {
  const el = document.createElement("div");
  el.className = "tile";
  el.title = tile.name;

  if (tile.image) {
    const img = document.createElement("img");
    img.src = tile.image;
    img.alt = tile.name;
    img.className = "tile-image";
    el.appendChild(img);
  } else {
    // Fallback to text if no image defined (e.g. for flowers)
    const span = document.createElement("span");
    span.className = "tile-text";
    span.textContent = tile.display || tile.name;
    el.appendChild(span);
  }

  return el;
}

/**
 * Render the current hand into the main hand container.
 * Returns the chosen winning tile (if any) and the open-meld count.
 */
export function renderHand(container, handData, _groupMelds, options) {
  container.innerHTML = "";
  container.classList.remove("empty");

  const winningTileContainer = document.getElementById("winning-tile");
  const winTypeEl = document.getElementById("win-type");
  const opts = options || {};
  const winType = opts.winType || null;

  if (winningTileContainer) {
    winningTileContainer.innerHTML = "";
  }
  if (winTypeEl) {
    winTypeEl.textContent =
      winType === WIN_TYPE_SELF_DRAWN
        ? "Self-drawn"
        : winType === WIN_TYPE_DISCARD
        ? "Win"
        : "—";
  }

  if (!handData) {
    container.classList.add("empty");
    const p = document.createElement("p");
    p.className = "placeholder";
    p.textContent = "Unable to generate a valid hand. Please try again.";
    container.appendChild(p);
    return { winningTile: null, openMeldCount: 0 };
  }

  // Choose how many melds are open vs closed. If not provided, randomise.
  const totalMelds = handData.melds.length;
  let openMeldCount =
    typeof opts.openMeldCount === "number"
      ? opts.openMeldCount
      : Math.floor(Math.random() * (totalMelds + 1)); // 0..totalMelds

  if (openMeldCount < 0) openMeldCount = 0;
  if (openMeldCount > totalMelds) openMeldCount = totalMelds;

  const openMelds = handData.melds.slice(0, openMeldCount);
  const closedMelds = handData.melds.slice(openMeldCount);

  const openTiles = [];
  openMelds.forEach((meld) => openTiles.push(...meld.tiles));

  const closedTiles = [];
  closedMelds.forEach((meld) => closedTiles.push(...meld.tiles));
  closedTiles.push(...handData.pair);

  // Choose winning tile from the closed portion, and remove it from the closed display.
  let winningTile = null;
  if (closedTiles.length > 0) {
    const idx = Math.floor(Math.random() * closedTiles.length);
    winningTile = closedTiles[idx];
    closedTiles.splice(idx, 1);
  }

  if (winningTile && winningTileContainer) {
    winningTileContainer.appendChild(createTileElement(winningTile));
  }

  const halvesContainer = document.createElement("div");
  halvesContainer.className = "hand-halves";

  const openHalf = document.createElement("div");
  openHalf.className = "hand-half";

  const openLabel = document.createElement("div");
  openLabel.className = "half-label";
  openLabel.textContent = "Open";
  openHalf.appendChild(openLabel);

  const openWrap = document.createElement("div");
  openWrap.className = "half-tiles";
  openTiles.forEach((t) => openWrap.appendChild(createTileElement(t)));
  openHalf.appendChild(openWrap);

  const closedHalf = document.createElement("div");
  closedHalf.className = "hand-half";

  const closedLabel = document.createElement("div");
  closedLabel.className = "half-label";
  closedLabel.textContent = "Closed";
  closedHalf.appendChild(closedLabel);

  const closedWrap = document.createElement("div");
  closedWrap.className = "half-tiles";
  closedTiles.forEach((t) => closedWrap.appendChild(createTileElement(t)));
  closedHalf.appendChild(closedWrap);

  halvesContainer.appendChild(openHalf);
  halvesContainer.appendChild(closedHalf);

  container.appendChild(halvesContainer);

  return { winningTile, openMeldCount };
}

export function renderFlowers(container, flowers) {
  container.innerHTML = "";
  container.classList.remove("empty");

  if (!flowers || flowers.length === 0) {
    container.classList.add("empty");
    const p = document.createElement("p");
    p.className = "placeholder";
    p.textContent = "No flowers for this hand.";
    container.appendChild(p);
    return;
  }

  const row = document.createElement("div");
  row.className = "flowers-row";

  flowers.forEach((f) => {
    const el = document.createElement("div");
    el.className = "tile flower-tile";
    el.textContent = f.display || f.name;
    el.title = f.name;
    row.appendChild(el);
  });

  container.appendChild(row);
}