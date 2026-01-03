// Tile definitions and helpers for Taiwanese Mahjong Winning Hand Generator.

export const suits = [
  { key: "dots", label: "Dots", short: "●", spritePrefix: "Circles" },
  { key: "bams", label: "Bamboos", short: "🀐", spritePrefix: "Bamboo" },
  { key: "chars", label: "Characters", short: "萬", spritePrefix: "Characters" }
];

// Build standard tiles (1–9 of each suit, 4 copies each)
const suitedTileTypes = [];
suits.forEach((suit) => {
  for (let rank = 1; rank <= 9; rank++) {
    suitedTileTypes.push({
      key: `${suit.key}-${rank}`,
      name: `${rank} of ${suit.label}`,
      suit: suit.key,
      rank,
      display: `${rank}${suit.short}`,
      image: `assets/mahjong_tiles/${suit.spritePrefix}${rank}.png`
    });
  }
});

// Honors: winds and dragons (4 copies each)
export const honorTileTypes = [
  { key: "wind-east", name: "East Wind", display: "E", image: "assets/mahjong_tiles/East.png" },
  { key: "wind-south", name: "South Wind", display: "S", image: "assets/mahjong_tiles/South.png" },
  { key: "wind-west", name: "West Wind", display: "W", image: "assets/mahjong_tiles/West.png" },
  { key: "wind-north", name: "North Wind", display: "N", image: "assets/mahjong_tiles/North.png" },
  { key: "dragon-red", name: "Red Dragon", display: "R", image: "assets/mahjong_tiles/Red.png" },
  { key: "dragon-green", name: "Green Dragon", display: "G", image: "assets/mahjong_tiles/Green.png" },
  { key: "dragon-white", name: "White Dragon", display: "W?", image: "assets/mahjong_tiles/White.png" }
];

export const allNormalTileTypes = [...suitedTileTypes, ...honorTileTypes];

// Flowers: conceptually present, but no specific sprites —
// we just mark each as a red or blue flower and add them randomly.
export const flowerColors = ["Red", "Blue"];

export const dragonKeys = ["dragon-red", "dragon-green", "dragon-white"];

export const windKeyByName = {
  East: "wind-east",
  South: "wind-south",
  West: "wind-west",
  North: "wind-north"
};

export function buildInitialCounts() {
  const counts = {};
  allNormalTileTypes.forEach((t) => {
    counts[t.key] = 4;
  });
  return counts;
}

export function getTileTypeByKey(key) {
  return allNormalTileTypes.find((t) => t.key === key);
}