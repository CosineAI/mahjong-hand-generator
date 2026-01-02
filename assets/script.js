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

  const dragonKeys = ["dragon-red", "dragon-green", "dragon-white"];

  const windKeyByName = {
    East: "wind-east",
    South: "wind-south",
    West: "wind-west",
    North: "wind-north"
  };

  const WIN_TYPE_SELF_DRAWN = "self-drawn";
  const WIN_TYPE_DISCARD = "win";

  const scoringRules = [
    {
      id: "baseWin",
      label: "Base Win",
      defaultPoints: 5,
      evaluator: (ctx) => 1
    },
    {
      id: "noFlowers",
      label: "No flowers",
      defaultPoints: 1,
      evaluator: (ctx) => (ctx.flowers.length === 0 ? 1 : 0)
    },
    {
      id: "goodFlower",
      label: "Good flower",
      defaultPoints: 2,
      evaluator: (ctx) => ctx.goodFlowerCount
    },
    {
      id: "badFlower",
      label: "Bad flower",
      defaultPoints: 1,
      evaluator: (ctx) => ctx.badFlowerCount
    },
    {
      id: "roundWind",
      label: "Matching Round Wind",
      defaultPoints: 2,
      evaluator: (ctx) => ctx.roundWindTileCount
    },
    {
      id: "playerWind",
      label: "Matching Player Wind",
      defaultPoints: 2,
      evaluator: (ctx) => ctx.playerWindTileCount
    },
    {
      id: "otherWind",
      label: "Other Wind",
      defaultPoints: 1,
      evaluator: (ctx) => ctx.otherWindTileCount
    },
    {
      id: "dragon",
      label: "Red/Green/White Dragon",
      defaultPoints: 2,
      evaluator: (ctx) => ctx.dragonTileCount
    },
    {
      id: "allSequences",
      label: "All melds are sequences",
      defaultPoints: 3,
      evaluator: (ctx) => (ctx.allMeldsSequences ? 1 : 0)
    },
    {
      id: "allSequencesNoFlowers",
      label: "All melds are sequences, no flowers",
      defaultPoints: 10,
      evaluator: (ctx) =>
        ctx.allMeldsSequences && ctx.flowers.length === 0 ? 1 : 0
    }
  ];

  let currentRoundWind = null;
  let currentPlayerWind = null;
  let currentHand = null;
  let currentWinType = null;

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

  // --- Scoring helpers -----------------------------------------------------

  function flattenHandTiles(hand) {
    if (!hand) return [];
    const tiles = [];
    hand.melds.forEach((meld) => tiles.push(...meld.tiles));
    tiles.push(...hand.pair);
    return tiles;
  }

  function buildScoreContext(hand) {
    const tiles = flattenHandTiles(hand);
    const tileCounts = {};
    tiles.forEach((t) => {
      tileCounts[t.key] = (tileCounts[t.key] || 0) + 1;
    });

    const roundWindKey = currentRoundWind ? windKeyByName[currentRoundWind] : null;
    const playerWindKey = currentPlayerWind ? windKeyByName[currentPlayerWind] : null;

    const roundWindTileCount = roundWindKey ? (tileCounts[roundWindKey] || 0) : 0;
    const playerWindTileCount = playerWindKey ? (tileCounts[playerWindKey] || 0) : 0;

    let otherWindTileCount = 0;
    Object.keys(windKeyByName).forEach((name) => {
      const key = windKeyByName[name];
      if (key === roundWindKey || key === playerWindKey) return;
      otherWindTileCount += tileCounts[key] || 0;
    });

    let dragonTileCount = 0;
    dragonKeys.forEach((key) => {
      dragonTileCount += tileCounts[key] || 0;
    });

    const flowers = hand.flowers || [];

    const goodFlowerNumbersBySeat = {
      East: 1,
      South: 2,
      West: 3,
      North: 4
    };
    const goodFlowerNumber =
      currentPlayerWind && goodFlowerNumbersBySeat[currentPlayerWind]
        ? goodFlowerNumbersBySeat[currentPlayerWind]
        : null;

    let goodFlowerCount = 0;
    let badFlowerCount = 0;
    flowers.forEach((f) => {
      if (goodFlowerNumber != null && f.number === goodFlowerNumber) {
        goodFlowerCount += 1;
      } else {
        badFlowerCount += 1;
      }
    });

    const allMeldsSequences = hand.melds.every((m) => m.type === "chow");

    return {
      tiles,
      tileCounts,
      flowers,
      goodFlowerCount,
      badFlowerCount,
      roundWindTileCount,
      playerWindTileCount,
      otherWindTileCount,
      dragonTileCount,
      allMeldsSequences
    };
  }

  function evaluateScoringRules(hand, configById) {
    if (!hand) {
      return { total: 0, breakdown: [] };
    }

    const ctx = buildScoreContext(hand);
    let total = 0;
    const breakdown = [];

    scoringRules.forEach((rule) => {
      const cfg = configById && configById[rule.id];
      const enabled = cfg ? !!cfg.enabled : true;
      const value =
        cfg && typeof cfg.value === "number" && !Number.isNaN(cfg.value)
          ? cfg.value
          : rule.defaultPoints;

      if (!enabled || value === 0) return;

      const count = rule.evaluator(ctx);
      if (!count) return;

      const points = count * value;
      total += points;
      breakdown.push({
        id: rule.id,
        label: rule.label,
        count,
        value,
        points
      });
    });

    return { total, breakdown };
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

  function renderHand(container, handData, _groupMelds, options) {
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
      winTypeEl.textContent = winType === WIN_TYPE_SELF_DRAWN ? "Self-drawn" :
        winType === WIN_TYPE_DISCARD ? "Win" : "—";
    }

    if (!handData) {
      container.classList.add("empty");
      const p = document.createElement("p");
      p.className = "placeholder";
      p.textContent = "Unable to generate a valid hand. Please try again.";
      container.appendChild(p);
      return;
    }

    // Randomly choose how many melds are open vs closed, then flatten within each.
    // Any closed melds plus the pair are shown under "Closed".
    const totalMelds = handData.melds.length;
    const openMeldCount = Math.floor(Math.random() * (totalMelds + 1)); // 0..totalMelds

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

    const showScoreCheckbox = document.getElementById("show-score");
    const scoreDisplay = document.getElementById("score-display");
    const scoreTotalValue = document.getElementById("score-total-value");
    const scoreBreakdownEl = document.getElementById("score-breakdown");

    if (!generateBtn || !handOutput || !flowersOutput) {
      console.warn("Mahjong generator: required elements not found.");
      return;
    }

    const windNames = ["East", "South", "West", "North"];

    function randomWind() {
      return windNames[Math.floor(Math.random() * windNames.length)];
    }

    function updateWinds() {
      const newRound = randomWind();
      const newSeat = randomWind();
      currentRoundWind = newRound;
      currentPlayerWind = newSeat;

      if (roundWindEl) {
        roundWindEl.textContent = newRound + " Round";
      }
      if (playerWindEl) {
        playerWindEl.textContent = newSeat + " Seat";
      }
    }

    function getScoreConfigFromDOM() {
      const config = {};
      const rows = document.querySelectorAll("[data-rule-id]");
      rows.forEach((row) => {
        const ruleId = row.getAttribute("data-rule-id");
        if (!ruleId) return;
        const checkbox = row.querySelector("input[type='checkbox']");
        const valueInput = row.querySelector("input[type='number']");
        const enabled = checkbox ? checkbox.checked : true;
        const value = valueInput ? parseFloat(valueInput.value) : Number.NaN;
        config[ruleId] = {
          enabled,
          value: Number.isNaN(value) ? undefined : value
        };
      });
      return config;
    }

    function updateScoreDisplay() {
      if (!scoreDisplay || !currentHand) {
        if (scoreDisplay) {
          scoreDisplay.classList.add("score-display-hidden");
        }
        return;
      }

      if (showScoreCheckbox && !showScoreCheckbox.checked) {
        scoreDisplay.classList.add("score-display-hidden");
        return;
      }

      scoreDisplay.classList.remove("score-display-hidden");

      const config = getScoreConfigFromDOM();
      const result = evaluateScoringRules(currentHand, config);

      if (scoreTotalValue) {
        scoreTotalValue.textContent = String(result.total);
      }

      if (scoreBreakdownEl) {
        scoreBreakdownEl.innerHTML = "";
        result.breakdown.forEach((item) => {
          const row = document.createElement("div");
          row.className = "score-breakdown-row";
          row.textContent = `${item.label}: ${item.points} (${item.count} × ${item.value})`;
          scoreBreakdownEl.appendChild(row);
        });
      }
    }

    function generateAndRender() {
      const hand = generateWinningHand();
      const groupMelds = !!groupMeldsCheckbox?.checked;

      currentHand = hand || null;
      updateWinds();

      // 1/4 chance of self-drawn vs win by discard
      const isSelfDrawn = Math.random() < 0.25;
      currentWinType = isSelfDrawn ? WIN_TYPE_SELF_DRAWN : WIN_TYPE_DISCARD;

      renderHand(handOutput, hand, groupMelds, { winType: currentWinType });
      renderFlowers(flowersOutput, hand ? hand.flowers : []);
      updateScoreDisplay();
    }

    generateBtn.addEventListener("click", generateAndRender);

    if (showScoreCheckbox && scoreDisplay) {
      showScoreCheckbox.addEventListener("change", updateScoreDisplay);
    }

    const scoreRuleRows = document.querySelectorAll("[data-rule-id]");
    scoreRuleRows.forEach((row) => {
      const cb = row.querySelector("input[type='checkbox']");
      const valueInput = row.querySelector("input[type='number']");
      if (cb) {
        cb.addEventListener("change", updateScoreDisplay);
      }
      if (valueInput) {
        valueInput.addEventListener("change", updateScoreDisplay);
        valueInput.addEventListener("input", updateScoreDisplay);
      }
    });

    // Initial render
    generateAndRender();
  });
})();