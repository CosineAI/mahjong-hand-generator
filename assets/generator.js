// Random winning-hand generator for Taiwanese Mahjong.

import {
  suits,
  flowerColors,
  buildInitialCounts,
  getTileTypeByKey
} from "./tiles.js";

const MELD_COUNT = 5; // Taiwanese: 5 melds + 1 pair
const MAX_FLOWERS = 4; // numbered flowers 1–4; they don't affect the hand, just random bonuses

function cloneCounts(counts) {
  const copy = {};
  for (const k in counts) {
    copy[k] = counts[k];
  }
  return copy;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function pickRandomPair(counts) {
  const candidates = Object.keys(counts).filter((k) => counts[k] >= 2);
  if (!candidates.length) return null;
  const key = candidates[Math.floor(Math.random() * candidates.length)];
  return key;
}

function listPossiblePungs(counts) {
  return Object.keys(counts).filter((k) => counts[k] >= 3);
}

function listPossibleChows(counts) {
  const chows = [];
  suits.forEach((suit) => {
    for (let rank = 1; rank <= 7; rank++) {
      const k1 = `${suit.key}-${rank}`;
      const k2 = `${suit.key}-${rank + 1}`;
      const k3 = `${suit.key}-${rank + 2}`;
      if ((counts[k1] || 0) > 0 && (counts[k2] || 0) > 0 && (counts[k3] || 0) > 0) {
        chows.push([k1, k2, k3]);
      }
    }
  });
  return chows;
}

// Try to build a random sequence of melds from remaining counts
function buildRandomMelds(counts, meldCount) {
  const melds = [];
  let workingCounts = cloneCounts(counts);

  for (let i = 0; i < meldCount; i++) {
    const pungs = listPossiblePungs(workingCounts);
    const chows = listPossibleChows(workingCounts);

    if (!pungs.length && !chows.length) {
      return null; // dead end, let caller retry
    }

    // Decide randomly pung vs chow, biased by availability
    const choices = [];
    if (pungs.length) choices.push("pung");
    if (chows.length) choices.push("chow");

    const choice = choices[Math.floor(Math.random() * choices.length)];

    if (choice === "pung") {
      const tileKey = pungs[Math.floor(Math.random() * pungs.length)];
      melds.push({ type: "pung", tiles: [tileKey, tileKey, tileKey] });
      workingCounts[tileKey] -= 3;
    } else {
      const chow = chows[Math.floor(Math.random() * chows.length)];
      melds.push({ type: "chow", tiles: chow.slice() });
      chow.forEach((k) => {
        workingCounts[k] -= 1;
      });
    }
  }

  return { melds, remainingCounts: workingCounts };
}

function generateRandomFlowers() {
  // Choose a random subset of flower numbers 1–4, each with a random color
  const availableNumbers = [1, 2, 3, 4];
  const count = Math.floor(Math.random() * (MAX_FLOWERS + 1)); // 0–4

  shuffle(availableNumbers);
  const selectedNums = availableNumbers.slice(0, count);

  return selectedNums.map((num) => {
    const color = flowerColors[Math.floor(Math.random() * flowerColors.length)];
    return {
      key: `flower-${num}`,
      name: `${color} Flower ${num}`,
      display: `${color} ${num}`,
      color,
      number: num
    };
  });
}

// Core generator: builds one Taiwanese-style winning structure
export function generateWinningHand() {
  let attempts = 0;

  while (attempts < 200) {
    attempts++;
    const counts = buildInitialCounts();
    const pairKey = pickRandomPair(counts);
    if (!pairKey) continue;
    counts[pairKey] -= 2;

    const meldResult = buildRandomMelds(counts, MELD_COUNT);
    if (!meldResult) continue;

    const { melds } = meldResult;

    // Flatten tiles to objects for display, but keep meld structure
    const pairTileType = getTileTypeByKey(pairKey);
    const pairTiles = [pairTileType, pairTileType];

    const meldTileObjects = melds.map((meld) => ({
      type: meld.type,
      tiles: meld.tiles.map((k) => getTileTypeByKey(k))
    }));

    const flowers = generateRandomFlowers();

    return {
      pair: pairTiles,
      pairType: pairTileType,
      melds: meldTileObjects,
      flowers
    };
  }

  return null;
}