// Taiwanese Mahjong Winning Hand Generator
// Uses simple text placeholders for tiles; images can be added later.

(function () {
  const MELD_COUNT = 5; // Taiwanese: 5 melds + 1 pair
  const MAX_FLOWERS = 8; // 4 flowers + 4 seasons

  // --- Tile definitions ----------------------------------------------------

  const suits = [
    { key: "dots", label: "Dots", short: "●" },
    { key: "bams", label: "Bamboos", short: "🀐" },
    { key: "chars", label: "Characters", short: "萬" }
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
        display: `${rank}${suit.short}`
      });
    }
  });

  // Honors: winds and dragons (4 copies each)
  const honorTileTypes = [
    { key: "wind-east", name: "East Wind", display: "E" },
    { key: "wind-south", name: "South Wind", display: "S" },
    { key: "wind-west", name: "West Wind", display: "W" },
    { key: "wind-north", name: "North Wind", display: "N" },
    { key: "dragon-red", name: "Red Dragon", display: "R" },
    { key: "dragon-green", name: "Green Dragon", display: "G" },
    { key: "dragon-white", name: "White Dragon", display: "W?" }
  ];

  const allNormalTileTypes = [...suitedTileTypes, ...honorTileTypes];

  // Flowers & seasons: 1 copy each
  const flowerTiles = [
    { key: "flower-plum", name: "Plum (Flower)", display: "Plum" },
    { key: "flower-orchid", name: "Orchid (Flower)", display: "Orchid" },
    { key: "flower-chrys", name: "Chrysanthemum (Flower)", display: "Chrys." },
    { key: "flower-bamboo", name: "Bamboo (Flower)", display: "Bamboo" },
    { key: "season-spring", name: "Spring (Season)", display: "Spring" },
    { key: "season-summer", name: "Summer (Season)", display: "Summer" },
    { key: "season-autumn", name: "Autumn (Season)", display: "Autumn" },
    { key: "season-winter", name: "Winter (Season)", display: "Winter" }
  ];

  // --- Utility functions ---------------------------------------------------

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

  function buildInitialCounts() {
    const counts = {};
    allNormalTileTypes.forEach((t) => {
      counts[t.key] = 4;
    });
    return counts;
  }

  function pickRandomPair(counts) {
    const candidates = Object.keys(counts).filter((k) => counts[k] >= 2);
    if (!candidates.length) return null;
    const key = candidates[Math.floor(Math.random() * candidates.length)];
    return key;
  }

  function getTileTypeByKey(key) {
    return allNormalTileTypes.find((t) => t.key === key);
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
    const count = Math.floor(Math.random() * (MAX_FLOWERS + 1)); // 0–8
    const shuffled = shuffle(flowerTiles.slice());
    return shuffled.slice(0, count);
  }

  // Core generator: builds one Taiwanese-style winning structure
  function generateWinningHand() {
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

  // --- Rendering -----------------------------------------------------------

  function createTileElement(tile) {
    const el = document.createElement("div");
    el.className = "tile";
    // Use short display where available, fallback to name
    el.textContent = tile.display || tile.name;
    el.title = tile.name;
    return el;
  }

  function renderHand(container, handData, groupMelds) {
    container.innerHTML = "";
    container.classList.remove("empty");

    if (!handData) {
      container.classList.add("empty");
      const p = document.createElement("p");
      p.className = "placeholder";
      p.textContent = "Unable to generate a valid hand. Please try again.";
      container.appendChild(p);
      return;
    }

    if (groupMelds) {
      // Render each meld in its own group row
      handData.melds.forEach((meld, index) => {
        const row = document.createElement("div");
        row.className = "meld-row";

        const label = document.createElement("div");
        label.className = "meld-label";
        label.textContent = `Meld ${index + 1} (${meld.type.toUpperCase()})`;
        row.appendChild(label);

        const tilesWrap = document.createElement("div");
        tilesWrap.className = "meld-tiles";
        meld.tiles.forEach((t) => tilesWrap.appendChild(createTileElement(t)));
        row.appendChild(tilesWrap);

        container.appendChild(row);
      });

      // Pair
      const pairRow = document.createElement("div");
      pairRow.className = "meld-row pair-row";

      const pairLabel = document.createElement("div");
      pairLabel.className = "meld-label";
      pairLabel.textContent = "Pair";
      pairRow.appendChild(pairLabel);

      const pairTilesWrap = document.createElement("div");
      pairTilesWrap.className = "meld-tiles";
      handData.pair.forEach((t) => pairTilesWrap.appendChild(createTileElement(t)));
      pairRow.appendChild(pairTilesWrap);

      container.appendChild(pairRow);
    } else {
      // Flattened tiles in one row (melds + pair)
      const flat = [];
      handData.melds.forEach((meld) => flat.push(...meld.tiles));
      flat.push(...handData.pair);

      const row = document.createElement("div");
      row.className = "flat-hand-row";
      flat.forEach((t) => row.appendChild(createTileElement(t)));
      container.appendChild(row);
    }
  }

  function renderFlowers(container, flowers) {
    container.innerHTML = "";
    container.classList.remove("empty");

    if (!flowers || flowers.length === 0) {
      container.classList.add("empty");
      const p = document.createElement("p");
      p.className = "placeholder";
      p.textContent = "No flowers or seasons for this hand.";
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

  // --- Wire up UI ----------------------------------------------------------

  document.addEventListener("DOMContentLoaded", () => {
    const generateBtn = document.getElementById("generate-btn");
    const handOutput = document.getElementById("hand-output");
    const flowersOutput = document.getElementById("flowers-output");
    const groupMeldsCheckbox = document.getElementById("group-melds");

    if (!generateBtn || !handOutput || !flowersOutput) {
      console.warn("Mahjong generator: required elements not found.");
      return;
    }

    function generateAndRender() {
      const hand = generateWinningHand();
      const groupMelds = !!groupMeldsCheckbox?.checked;

      renderHand(handOutput, hand, groupMelds);
      renderFlowers(flowersOutput, hand ? hand.flowers : []);
    }

    generateBtn.addEventListener("click", generateAndRender);

    // Optionally, generate an initial hand on load
    generateAndRender();
  });
})();