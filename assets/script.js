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
      evaluator: (ctx) => ctx.roundWindTripletCount
    },
    {
      id: "playerWind",
      label: "Matching Player Wind",
      defaultPoints: 2,
      evaluator: (ctx) => ctx.playerWindTripletCount
    },
    {
      id: "otherWind",
      label: "Other Wind",
      defaultPoints: 1,
      evaluator: (ctx) => ctx.otherWindTripletCount
    },
    {
      id: "dragon",
      label: "Red/Green/White Dragon",
      defaultPoints: 2,
      evaluator: (ctx) => ctx.dragonTripletCount
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
    },
    {
      id: "noFlowersNoWindNoDragon",
      label: "No Flowers, No Wind, No Dragon",
      defaultPoints: 4,
      evaluator: (ctx) =>
        ctx.flowers.length === 0 &&
        ctx.totalWindTileCount === 0 &&
        ctx.dragonTileCount === 0
          ? 1
          : 0
    },
    {
      id: "sequence123and789SameSuit",
      label: "Melds 123 and 789 of same suit",
      defaultPoints: 2,
      evaluator: (ctx) => ctx.count123and789SameSuit
    },
    {
      id: "triplet111and999SameSuit",
      label: "Melds 111 and 999 of same suit",
      defaultPoints: 3,
      evaluator: (ctx) => ctx.count111and999SameSuit
    },
    {
      id: "twoMeldsSameSuitNumbers",
      label: "Two sequence melds of same suit & numbers",
      defaultPoints: 3,
      evaluator: (ctx) => ctx.twoSameSuitNumbers
    },
    {
      id: "threeMeldsSameSuitNumbers",
      label: "Three sequence melds of same suit & numbers",
      defaultPoints: 15,
      evaluator: (ctx) => ctx.threeSameSuitNumbers
    },
    {
      id: "fourMeldsSameSuitNumbers",
      label: "Four sequence melds of same suit & numbers",
      defaultPoints: 30,
      evaluator: (ctx) => ctx.fourSameSuitNumbers
    },
    {
      id: "twoMeldsSameNumberDifferentSuits",
      label: "Two sequence melds of same numbers, different suits",
      defaultPoints: 2,
      evaluator: (ctx) => ctx.twoSameNumberDifferentSuits
    },
    {
      id: "threeMeldsSameNumberDifferentSuits",
      label: "Three sequence melds of same numbers, different suits",
      defaultPoints: 10,
      evaluator: (ctx) => ctx.threeSameNumberDifferentSuits
    },
    {
      id: "fourMeldsSameNumberAtLeastTwoSuits",
      label: "Four sequence melds of same numbers (≥2 suits)",
      defaultPoints: 20,
      evaluator: (ctx) => ctx.fourSameNumberAtLeastTwoSuits
    },
    {
      id: "fiveMeldsSameNumberAtLeastTwoSuits",
      label: "Five sequence melds of same numbers (≥2 suits)",
      defaultPoints: 40,
      evaluator: (ctx) => ctx.fiveSameNumberAtLeastTwoSuits
    },
    {
      id: "allClosedHand",
      label: "All Closed hand",
      defaultPoints: 3,
      evaluator: (ctx) => (ctx.allClosedHand ? 1 : 0)
    },
    {
      id: "twoClosedTriplets",
      label: "Two closed triplets",
      defaultPoints: 3,
      evaluator: (ctx) => (ctx.closedTripletCount === 2 ? 1 : 0)
    },
    {
      id: "threeClosedTriplets",
      label: "Three closed triplets",
      defaultPoints: 10,
      evaluator: (ctx) => (ctx.closedTripletCount === 3 ? 1 : 0)
    },
    {
      id: "fourClosedTriplets",
      label: "Four closed triplets",
      defaultPoints: 30,
      evaluator: (ctx) => (ctx.closedTripletCount >= 4 ? 1 : 0)
    },
    {
      id: "edgeWin",
      label: "Edge win (1-2 wait 3 / 7-8 wait 7)",
      defaultPoints: 2,
      evaluator: (ctx) => ctx.waitEdge
    },
    {
      id: "holeWin",
      label: "Hole win (inside wait)",
      defaultPoints: 2,
      evaluator: (ctx) => ctx.waitHole
    },
    {
      id: "pairWin",
      label: "Pair win",
      defaultPoints: 2,
      evaluator: (ctx) => ctx.waitPair
    },
    {
      id: "falseEdgeWin",
      label: "False edge win",
      defaultPoints: 1,
      evaluator: (ctx) => ctx.waitFalseEdge
    },
    {
      id: "selfDrawn",
      label: "Self-drawn",
      defaultPoints: 1,
      evaluator: (ctx) => (ctx.isSelfDrawn ? 1 : 0)
    }
  ];

  let currentRoundWind = null;
  let currentPlayerWind = null;
  let currentHand = null;
  let currentWinType = null;
  let currentOpenMeldCount = 0;
  let currentWinningTile = null;

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

    const windTileKeys = Object.values(windKeyByName);

    let otherWindTileCount = 0;
    windTileKeys.forEach((key) => {
      if (key === roundWindKey || key === playerWindKey) return;
      otherWindTileCount += tileCounts[key] || 0;
    });

    let totalWindTileCount = 0;
    windTileKeys.forEach((key) => {
      totalWindTileCount += tileCounts[key] || 0;
    });

    let dragonTileCount = 0;
    dragonKeys.forEach((key) => {
      dragonTileCount += tileCounts[key] || 0;
    });

    // Triplet-based counts for winds and dragons
    let roundWindTripletCount = 0;
    let playerWindTripletCount = 0;
    let otherWindTripletCount = 0;
    let dragonTripletCount = 0;

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

    const totalMelds = hand.melds.length;
    const openMeldCount =
      typeof currentOpenMeldCount === "number"
        ? Math.max(0, Math.min(currentOpenMeldCount, totalMelds))
        : 0;
    const allClosedHand = openMeldCount === 0;

    let closedTripletCount = 0;

    const chowsBySuit = {};
    const pungRanksBySuit = {};
    const sameSuitPatternCounts = {};
    const sameNumberPatternCounts = {};
    const sameNumberPatternSuits = {};

    hand.melds.forEach((meld, index) => {
      if (!meld || !Array.isArray(meld.tiles) || meld.tiles.length === 0) return;

      const firstTile = meld.tiles[0];

      // Triplet-based wind/dragon scoring
      if (meld.type === "pung") {
        const tileKey = firstTile.key;
        if (roundWindKey && tileKey === roundWindKey) {
          roundWindTripletCount += 1;
        }
        if (playerWindKey && tileKey === playerWindKey) {
          playerWindTripletCount += 1;
        }
        if (
          windTileKeys.includes(tileKey) &&
          tileKey !== roundWindKey &&
          tileKey !== playerWindKey
        ) {
          otherWindTripletCount += 1;
        }
        if (dragonKeys.includes(tileKey)) {
          dragonTripletCount += 1;
        }
      }

      const suit = firstTile.suit;
      const isSuited = !!suit && typeof firstTile.rank === "number";

      if (meld.type === "pung" && index >= openMeldCount) {
        closedTripletCount += 1;
      }

      if (!isSuited) {
        return;
      }

      const ranks = meld.tiles
        .map((t) => t.rank)
        .slice()
        .sort((a, b) => a - b);

      if (meld.type === "chow") {
        if (!chowsBySuit[suit]) {
          chowsBySuit[suit] = { has123: false, has789: false };
        }
        const minRank = ranks[0];
        const maxRank = ranks[ranks.length - 1];
        if (minRank === 1 && maxRank === 3) {
          chowsBySuit[suit].has123 = true;
        }
        if (minRank === 7 && maxRank === 9) {
          chowsBySuit[suit].has789 = true;
        }
      }

      if (meld.type === "pung") {
        if (!pungRanksBySuit[suit]) {
          pungRanksBySuit[suit] = new Set();
        }
        pungRanksBySuit[suit].add(ranks[0]);
      }

      // For "same suit & numbers" and "same numbers" rules, only consider sequences (chows),
      // not triplets. Closed triplets are handled separately.
      let basePattern = null;
      if (meld.type === "chow") {
        basePattern = `chow:${ranks.join("-")}`;
      }

      if (basePattern) {
        const keySuitPattern = `${suit}|${basePattern}`;
        sameSuitPatternCounts[keySuitPattern] =
          (sameSuitPatternCounts[keySuitPattern] || 0) + 1;

        sameNumberPatternCounts[basePattern] =
          (sameNumberPatternCounts[basePattern] || 0) + 1;

        if (!sameNumberPatternSuits[basePattern]) {
          sameNumberPatternSuits[basePattern] = new Set();
        }
        sameNumberPatternSuits[basePattern].add(suit);
      }
    });

    let count123and789SameSuit = 0;
    Object.keys(chowsBySuit).forEach((suit) => {
      const info = chowsBySuit[suit];
      if (info.has123 && info.has789) {
        count123and789SameSuit += 1;
      }
    });

    let count111and999SameSuit = 0;
    Object.keys(pungRanksBySuit).forEach((suit) => {
      const ranksSet = pungRanksBySuit[suit];
      if (ranksSet.has(1) && ranksSet.has(9)) {
        count111and999SameSuit += 1;
      }
    });

    let twoSameSuitNumbers = 0;
    let threeSameSuitNumbers = 0;
    let fourSameSuitNumbers = 0;

    Object.values(sameSuitPatternCounts).forEach((count) => {
      if (count === 2) {
        twoSameSuitNumbers += 1;
      } else if (count === 3) {
        threeSameSuitNumbers += 1;
      } else if (count >= 4) {
        fourSameSuitNumbers += 1;
      }
    });

    let twoSameNumberDifferentSuits = 0;
    let threeSameNumberDifferentSuits = 0;
    let fourSameNumberAtLeastTwoSuits = 0;
    let fiveSameNumberAtLeastTwoSuits = 0;

    Object.keys(sameNumberPatternCounts).forEach((pattern) => {
      const count = sameNumberPatternCounts[pattern];
      const suitsSet = sameNumberPatternSuits[pattern];
      const suitCount = suitsSet ? suitsSet.size : 0;

      if (suitCount < 2) return;

      if (count === 2) {
        twoSameNumberDifferentSuits += 1;
      } else if (count === 3 && suitCount >= 3) {
        threeSameNumberDifferentSuits += 1;
      } else if (count === 4) {
        fourSameNumberAtLeastTwoSuits += 1;
      } else if (count >= 5) {
        fiveSameNumberAtLeastTwoSuits += 1;
      }
    });

    // Winning tile wait-type analysis
    let waitEdge = 0;
    let waitHole = 0;
    let waitPair = 0;
    let waitFalseEdge = 0;
    const isSelfDrawn = currentWinType === WIN_TYPE_SELF_DRAWN;

    const winningTile = currentWinningTile || null;
    if (winningTile) {
      const winningTileKey = winningTile.key;
      const winningTileSuit =
        typeof winningTile.suit === "string" ? winningTile.suit : null;
      const winningTileRank =
        typeof winningTile.rank === "number" ? winningTile.rank : null;

      const pairKey = hand.pairType ? hand.pairType.key : null;
      const pairCandidate =
        winningTileKey && pairKey && winningTileKey === pairKey;

      let potentialSequences = [];
      let edgeCandidate = false;
      let holeCandidate = false;

      if (winningTileSuit && winningTileRank != null) {
        const ranksInSuit = {};
        tiles.forEach((t) => {
          if (t.suit === winningTileSuit && typeof t.rank === "number") {
            ranksInSuit[t.rank] = (ranksInSuit[t.rank] || 0) + 1;
          }
        });

        for (let start = winningTileRank - 2; start <= winningTileRank; start++) {
          const r1 = start;
          const r2 = start + 1;
          const r3 = start + 2;
          if (r1 < 1 || r3 > 9) continue;
          if (winningTileRank < r1 || winningTileRank > r3) continue;
          if (
            (ranksInSuit[r1] || 0) > 0 &&
            (ranksInSuit[r2] || 0) > 0 &&
            (ranksInSuit[r3] || 0) > 0
          ) {
            potentialSequences.push([r1, r2, r3]);
          }
        }

        potentialSequences.forEach((seq) => {
          const [a, b, c] = seq;
          if (a === 1 && c === 3 && winningTileRank === 3) {
            edgeCandidate = true;
          } else if (a === 7 && c === 9 && winningTileRank === 7) {
            edgeCandidate = true;
          }
          if (winningTileRank === b) {
            holeCandidate = true;
          }
        });
      }

      const seqCount = potentialSequences.length;

      if (pairCandidate && seqCount === 0) {
        waitPair = 1;
      } else if (edgeCandidate && seqCount === 1 && !pairCandidate) {
        waitEdge = 1;
      } else if (holeCandidate && seqCount === 1 && !pairCandidate) {
        waitHole = 1;
      } else if (pairCandidate || seqCount > 0) {
        waitFalseEdge = 1;
      }
    }

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
      totalWindTileCount,
      dragonTileCount,
      roundWindTripletCount,
      playerWindTripletCount,
      otherWindTripletCount,
      dragonTripletCount,
      allMeldsSequences,
      count123and789SameSuit,
      count111and999SameSuit,
      twoSameSuitNumbers,
      threeSameSuitNumbers,
      fourSameSuitNumbers,
      twoSameNumberDifferentSuits,
      threeSameNumberDifferentSuits,
      fourSameNumberAtLeastTwoSuits,
      fiveSameNumberAtLeastTwoSuits,
      allClosedHand,
      closedTripletCount,
      waitEdge,
      waitHole,
      waitPair,
      waitFalseEdge,
      isSelfDrawn
    };
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
      return;
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

    // Persist winning tile for scoring context.
    currentWinningTile = winningTile || null;

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

      let openMeldCount = 0;
      if (hand && Array.isArray(hand.melds)) {
        const totalMelds = hand.melds.length;
        openMeldCount = Math.floor(Math.random() * (totalMelds + 1)); // 0..totalMelds
      }
      currentOpenMeldCount = openMeldCount;

      renderHand(handOutput, hand, groupMelds, {
        winType: currentWinType,
        openMeldCount
      });
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