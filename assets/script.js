// Taiwanese Mahjong Winning Hand Generator
// Now uses mahjong tile sprites for the main hand tiles.

(function () {
  const MELD_COUNT = 5; // Taiwanese: 5 melds + 1 pair
  const MAX_FLOWERS = 4; // numbered flowers 1–4; they don't affect the hand, just random bonuses

  // --- Tile definitions ----------------------------------------------------

  const suits = [
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
  const honorTileTypes = [
    { key: "wind-east", name: "East Wind", display: "E", image: "assets/mahjong_tiles/East.png" },
    { key: "wind-south", name: "South Wind", display: "S", image: "assets/mahjong_tiles/South.png" },
    { key: "wind-west", name: "West Wind", display: "W", image: "assets/mahjong_tiles/West.png" },
    { key: "wind-north", name: "North Wind", display: "N", image: "assets/mahjong_tiles/North.png" },
    { key: "dragon-red", name: "Red Dragon", display: "R", image: "assets/mahjong_tiles/Red.png" },
    { key: "dragon-green", name: "Green Dragon", display: "G", image: "assets/mahjong_tiles/Green.png" },
    { key: "dragon-white", name: "White Dragon", display: "W?", image: "assets/mahjong_tiles/White.png" }
  ];

  const allNormalTileTypes = [...suitedTileTypes, ...honorTileTypes];

  // Flowers: conceptually present, but no specific sprites —
  // we just mark each as a red or blue flower and add them randomly.
  const flowerColors = ["Red", "Blue"];

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
    // Choose a random subset of flower numbers 1–4, each with a random color
    const availableNumbers = [1, 2, 3, 4];
    const count = Math.floor(Math.random() * (MAX_FLOWERS + 1)); // 0–4

    shuffle(availableNumbers);
    const selectedNums = availableNumbers.slice(0, count);

    return selectedNums.map((num) =&gt; {
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

  function renderHand(container, handData, _groupMelds) {
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

    // Flatten tiles (melds + pair) into a single ordered line
    const flat = [];
    handData.melds.forEach((meld) => flat.push(...meld.tiles));
    flat.push(...handData.pair);

    // Split into "open" and "closed" halves
    const splitIndex = Math.floor(flat.length / 2);
    const openTiles = flat.slice(0, splitIndex);
    const closedTiles = flat.slice(splitIndex);

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
  }

  function renderFlowers(container, flowers) {
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

  // --- Wire up UI ----------------------------------------------------------

  document.addEventListener("DOMContentLoaded", () => {
    const generateBtn = document.getElementById("generate-btn");
    const handOutput = document.getElementById("hand-output");
    const flowersOutput = document.getElementById("flowers-output");
    const groupMeldsCheckbox = document.getElementById("group-melds");
    const roundWindEl = document.getElementById("round-wind");
    const playerWindEl = document.getElementById("player-wind");

    if (!generateBtn || !handOutput || !flowersOutput) {
      console.warn("Mahjong generator: required elements not found.");
      return;
    }

    const windNames = ["East", "South", "West", "North"];

    function randomWind() {
      return windNames[Math.floor(Math.random() * windNames.length)];
    }

    function updateWinds() {
      if (roundWindEl) {
        roundWindEl.textContent = randomWind() + " Round";
      }
      if (playerWindEl) {
        playerWindEl.textContent = randomWind() + " Seat";
      }
    }

    function generateAndRender() {
      const hand = generateWinningHand();
      const groupMelds = !!groupMeldsCheckbox?.checked;

      renderHand(handOutput, hand, groupMelds);
      renderFlowers(flowersOutput, hand ? hand.flowers : []);
      updateWinds();
    }

    generateBtn.addEventListener("click", generateAndRender);

    // Optionally, generate an initial hand on load
    generateAndRender();
  });
})();