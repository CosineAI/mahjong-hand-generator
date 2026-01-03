// Scoring logic for Taiwanese Mahjong winning hands.

import { dragonKeys, windKeyByName } from "./tiles.js";

export const WIN_TYPE_SELF_DRAWN = "self-drawn";
export const WIN_TYPE_DISCARD = "win";

export const scoringRules = [
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
    id: "fiveClosedTriplets",
    label: "Five closed triplets",
    defaultPoints: 80,
    evaluator: (ctx) => (ctx.closedTripletCount === 5 ? 1 : 0)
  },
  {
    id: "pair258",
    label: "Pair is 2, 5, or 8",
    defaultPoints: 2,
    evaluator: (ctx) => ctx.pairIs258
  },
  {
    id: "twoSuitsNoHonors",
    label: "Only two suits (no winds or dragons)",
    defaultPoints: 4,
    evaluator: (ctx) => ctx.twoSuitsNoHonors
  },
  {
    id: "oneSuitWithHonors",
    label: "Only one suit (winds/dragons allowed)",
    defaultPoints: 30,
    evaluator: (ctx) => ctx.oneSuitWithHonorsAllowed
  },
  {
    id: "oneSuitNoHonors",
    label: "Only one suit (no winds, no dragons)",
    defaultPoints: 80,
    evaluator: (ctx) => ctx.oneSuitNoHonors
  },
  {
    id: "openDragon",
    label: "Open Dragon (123 456 789 of one suit)",
    defaultPoints: 10,
    evaluator: (ctx) => ctx.openDragonCount
  },
  {
    id: "closedDragon",
    label: "Closed Dragon (123 456 789 of one suit, all closed)",
    defaultPoints: 20,
    evaluator: (ctx) => ctx.closedDragonCount
  },
  {
    id: "openMixedDragon",
    label: "Open Mixed Dragon (123 456 789 in three suits)",
    defaultPoints: 8,
    evaluator: (ctx) => ctx.openMixedDragonCount
  },
  {
    id: "closedMixedDragon",
    label: "Closed Mixed Dragon (123 456 789 in three suits)",
    defaultPoints: 15,
    evaluator: (ctx) => ctx.closedMixedDragonCount
  },
  {
    id: "smallFiveSuits",
    label: "Small 5 suits (dragon, wind, bamboo, character, dot)",
    defaultPoints: 5,
    evaluator: (ctx) => ctx.smallFiveSuits
  },
  {
    id: "bigFiveSuits",
    label: "Big 5 suits (dragon & wind triplets)",
    defaultPoints: 10,
    evaluator: (ctx) => ctx.bigFiveSuits
  },
  {
    id: "smallSevenSuits",
    label: "Small 7 suits (5 suits + red & blue flowers)",
    defaultPoints: 15,
    evaluator: (ctx) => ctx.smallSevenSuits
  },
  {
    id: "bigSevenSuits",
    label: "Big 7 suits (triplet dragon & wind + red & blue flowers)",
    defaultPoints: 20,
    evaluator: (ctx) => ctx.bigSevenSuits
  },
  {
    id: "smallThreeDragons",
    label: "Small Three Dragons (2 dragon triplets + dragon pair)",
    defaultPoints: 30,
    evaluator: (ctx) => ctx.smallThreeDragons
  },
  {
    id: "bigThreeDragons",
    label: "Big Three Dragons (3 dragon triplets)",
    defaultPoints: 60,
    evaluator: (ctx) => ctx.bigThreeDragons
  },
  {
    id: "smallThreeWinds",
    label: "Small Three Winds (2 wind triplets + wind pair)",
    defaultPoints: 15,
    evaluator: (ctx) => ctx.smallThreeWinds
  },
  {
    id: "bigThreeWinds",
    label: "Big Three Winds (3 wind triplets)",
    defaultPoints: 30,
    evaluator: (ctx) => ctx.bigThreeWinds
  },
  {
    id: "smallFourWinds",
    label: "Small Four Winds (3 wind triplets + wind pair)",
    defaultPoints: 60,
    evaluator: (ctx) => ctx.smallFourWinds
  },
  {
    id: "bigFourWinds",
    label: "Big Four Winds (4 wind triplets)",
    defaultPoints: 80,
    evaluator: (ctx) => ctx.bigFourWinds
  },
  {
    id: "onlyDragonsWinds",
    label: "Only Dragons/Winds",
    defaultPoints: 100,
    evaluator: (ctx) => ctx.onlyDragonsWinds
  },
  {
    id: "relyOnOthers",
    label: "Rely on others (one tile left closed before win)",
    defaultPoints: 15,
    evaluator: (ctx) => ctx.relyOnOthers
  },
  {
    id: "relyOnOthersHalf",
    label: "Rely on others – Half (one tile left closed before win, self-drawn)",
    defaultPoints: 8,
    evaluator: (ctx) => ctx.relyOnOthersHalf
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

function flattenHandTiles(hand) {
  if (!hand) return [];
  const tiles = [];
  hand.melds.forEach((meld) => tiles.push(...meld.tiles));
  tiles.push(...hand.pair);
  return tiles;
}

export function buildScoreContext(hand, options = {}) {
  const tiles = flattenHandTiles(hand);
  const tileCounts = {};
  tiles.forEach((t) => {
    tileCounts[t.key] = (tileCounts[t.key] || 0) + 1;
  });

  const roundWindName = options.roundWind || null;
  const playerWindName = options.playerWind || null;

  const roundWindKey = roundWindName ? windKeyByName[roundWindName] : null;
  const playerWindKey = playerWindName ? windKeyByName[playerWindName] : null;

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
    playerWindName && goodFlowerNumbersBySeat[playerWindName]
      ? goodFlowerNumbersBySeat[playerWindName]
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
    typeof options.openMeldCount === "number"
      ? Math.max(0, Math.min(options.openMeldCount, totalMelds))
      : 0;
  const allClosedHand = openMeldCount === 0;

  let closedTripletCount = 0;
  let closedTilesCount = 0;

  const chowsBySuit = {};
  const pungRanksBySuit = {};
  const sameSuitPatternCounts = {};
  const sameNumberPatternCounts = {};
  const sameNumberPatternSuits = {};

  const dragonTripletKeys = new Set();
  const windTripletKeys = new Set();

  const mixedDragon123Suits = new Set();
  const mixedDragon456Suits = new Set();
  const mixedDragon789Suits = new Set();
  const mixedDragonClosed123Suits = new Set();
  const mixedDragonClosed456Suits = new Set();
  const mixedDragonClosed789Suits = new Set();

  const isSelfDrawn =
    options.winType === WIN_TYPE_SELF_DRAWN || options.isSelfDrawn === true;

  hand.melds.forEach((meld, index) => {
    if (!meld || !Array.isArray(meld.tiles) || meld.tiles.length === 0) return;

    const firstTile = meld.tiles[0];
    const suit = firstTile.suit;
    const isSuited = !!suit && typeof firstTile.rank === "number";
    const isClosedMeld = index >= openMeldCount;

    if (isClosedMeld) {
      closedTilesCount += meld.tiles.length;
    }

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
        dragonTripletKeys.add(tileKey);
      }
      if (windTileKeys.includes(tileKey)) {
        windTripletKeys.add(tileKey);
      }
      if (isClosedMeld) {
        closedTripletCount += 1;
      }
    }

    if (!isSuited) {
      return;
    }

    const ranks = meld.tiles
      .map((t) => t.rank)
      .slice()
      .sort((a, b) => a - b);

    const minRank = ranks[0];
    const maxRank = ranks[ranks.length - 1];

    if (meld.type === "chow") {
      if (!chowsBySuit[suit]) {
        chowsBySuit[suit] = {
          has123: false,
          has456: false,
          has789: false,
          closed123: false,
          closed456: false,
          closed789: false
        };
      }
      const info = chowsBySuit[suit];

      if (minRank === 1 && maxRank === 3) {
        info.has123 = true;
        if (isClosedMeld) info.closed123 = true;
        mixedDragon123Suits.add(suit);
        if (isClosedMeld) mixedDragonClosed123Suits.add(suit);
      } else if (minRank === 4 && maxRank === 6) {
        info.has456 = true;
        if (isClosedMeld) info.closed456 = true;
        mixedDragon456Suits.add(suit);
        if (isClosedMeld) mixedDragonClosed456Suits.add(suit);
      } else if (minRank === 7 && maxRank === 9) {
        info.has789 = true;
        if (isClosedMeld) info.closed789 = true;
        mixedDragon789Suits.add(suit);
        if (isClosedMeld) mixedDragonClosed789Suits.add(suit);
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

  // Pure-suit dragon (123 / 456 / 789 in one suit)
  let openDragonCount = 0;
  let closedDragonCount = 0;

  Object.keys(chowsBySuit).forEach((suit) => {
    const info = chowsBySuit[suit];
    if (info.has123 && info.has456 && info.has789) {
      if (info.closed123 && info.closed456 && info.closed789) {
        closedDragonCount += 1;
      } else {
        openDragonCount += 1;
      }
    }
  });

  // Mixed-suit dragon (123 / 456 / 789 across three suits)
  let openMixedDragonCount = 0;
  let closedMixedDragonCount = 0;

  const suits123 = Array.from(mixedDragon123Suits);
  const suits456 = Array.from(mixedDragon456Suits);
  const suits789 = Array.from(mixedDragon789Suits);

  let foundAnyMixed = false;
  let foundClosedMixed = false;

  for (let i = 0; i < suits123.length; i++) {
    for (let j = 0; j < suits456.length; j++) {
      for (let k = 0; k < suits789.length; k++) {
        const s1 = suits123[i];
        const s2 = suits456[j];
        const s3 = suits789[k];
        if (s1 === s2 || s1 === s3 || s2 === s3) {
          continue;
        }
        const allClosed =
          mixedDragonClosed123Suits.has(s1) &&
          mixedDragonClosed456Suits.has(s2) &&
          mixedDragonClosed789Suits.has(s3);
        foundAnyMixed = true;
        if (allClosed) {
          foundClosedMixed = true;
          break;
        }
      }
      if (foundClosedMixed) break;
    }
    if (foundClosedMixed) break;
  }

  if (foundClosedMixed) {
    closedMixedDragonCount = 1;
  } else if (foundAnyMixed) {
    openMixedDragonCount = 1;
  }

  // Suit usage and honor-only patterns
  let hasDots = false;
  let hasBams = false;
  let hasChars = false;
  let suitedTileCount = 0;

  tiles.forEach((t) => {
    if (t.suit && typeof t.rank === "number") {
      suitedTileCount += 1;
      if (t.suit === "dots") hasDots = true;
      else if (t.suit === "bams") hasBams = true;
      else if (t.suit === "chars") hasChars = true;
    }
  });

  const suitsUsed = new Set();
  if (hasDots) suitsUsed.add("dots");
  if (hasBams) suitsUsed.add("bams");
  if (hasChars) suitsUsed.add("chars");

  const suitCount = suitsUsed.size;
  const hasDragonTiles = dragonTileCount > 0;
  const hasWindTiles = totalWindTileCount > 0;

  const pairType = hand.pairType || null;
  const pairTypeKey = pairType ? pairType.key : null;
  const pairRank =
    pairType && typeof pairType.rank === "number" ? pairType.rank : null;

  const pairIs258 =
    pairRank === 2 || pairRank === 5 || pairRank === 8 ? 1 : 0;

  const twoSuitsNoHonors =
    suitCount === 2 && !hasDragonTiles && !hasWindTiles ? 1 : 0;

  const oneSuitWithHonorsAllowed = suitCount === 1 ? 1 : 0;
  const oneSuitNoHonors =
    suitCount === 1 && !hasDragonTiles && !hasWindTiles ? 1 : 0;

  const hasRedFlower = flowers.some((f) => f.color === "Red");
  const hasBlueFlower = flowers.some((f) => f.color === "Blue");

  const hasAllFiveSuitTypes =
    hasDragonTiles && hasWindTiles && hasDots && hasBams && hasChars;

  const windTripletCount =
    roundWindTripletCount + playerWindTripletCount + otherWindTripletCount;

  // 5-suit / 7-suit patterns with override behavior
  const baseSmallFiveSuits = hasAllFiveSuitTypes ? 1 : 0;
  const baseBigFiveSuits =
    baseSmallFiveSuits && dragonTripletCount > 0 && windTripletCount > 0
      ? 1
      : 0;

  const baseSmallSevenSuits =
    baseSmallFiveSuits && hasRedFlower && hasBlueFlower ? 1 : 0;
  const baseBigSevenSuits =
    baseSmallSevenSuits && dragonTripletCount > 0 && windTripletCount > 0
      ? 1
      : 0;

  let smallFiveSuits = 0;
  let bigFiveSuits = 0;
  let smallSevenSuits = 0;
  let bigSevenSuits = 0;

  if (baseBigSevenSuits) {
    bigSevenSuits = 1;
  } else if (baseSmallSevenSuits) {
    smallSevenSuits = 1;
  } else if (baseBigFiveSuits) {
    bigFiveSuits = 1;
  } else if (baseSmallFiveSuits) {
    smallFiveSuits = 1;
  }

  const onlyDragonsWinds =
    suitedTileCount === 0 && totalWindTileCount + dragonTileCount > 0 ? 1 : 0;

  // Dragon / wind set patterns
  const dragonTripletKeysArray = Array.from(dragonTripletKeys);
  const windTripletKeysArray = Array.from(windTripletKeys);

  let smallThreeDragons = 0;
  let bigThreeDragons = 0;

  if (dragonTripletKeysArray.length === 3) {
    bigThreeDragons = 1;
  } else if (
    dragonTripletKeysArray.length === 2 &&
    pairTypeKey &&
    dragonKeys.includes(pairTypeKey)
  ) {
    const union = new Set(dragonTripletKeysArray);
    union.add(pairTypeKey);
    if (union.size === 3) {
      smallThreeDragons = 1;
    }
  }

  if (bigThreeDragons) {
    smallThreeDragons = 0;
  }

  const allWindKeys = windTileKeys;
  const windTripletSetSize = windTripletKeysArray.length;
  const windPairKey =
    pairTypeKey && allWindKeys.includes(pairTypeKey) ? pairTypeKey : null;

  let isSmallThreeWinds = false;
  let isBigThreeWinds = false;
  let isSmallFourWinds = false;
  let isBigFourWinds = false;

  if (windTripletSetSize === 4) {
    isBigFourWinds = true;
  } else if (
    windTripletSetSize === 3 &&
    windPairKey &&
    (() => {
      const union = new Set(windTripletKeysArray);
      union.add(windPairKey);
      return union.size === 4;
    })()
  ) {
    isSmallFourWinds = true;
  } else if (windTripletSetSize === 3) {
    isBigThreeWinds = true;
  } else if (
    windTripletSetSize === 2 &&
    windPairKey &&
    (() => {
      const union = new Set(windTripletKeysArray);
      union.add(windPairKey);
      return union.size === 3;
    })()
  ) {
    isSmallThreeWinds = true;
  }

  let smallThreeWinds = 0;
  let bigThreeWinds = 0;
  let smallFourWinds = 0;
  let bigFourWinds = 0;

  if (isBigFourWinds) {
    bigFourWinds = 1;
  } else if (isSmallFourWinds) {
    smallFourWinds = 1;
  } else if (isBigThreeWinds) {
    bigThreeWinds = 1;
  } else if (isSmallThreeWinds) {
    smallThreeWinds = 1;
  }

  // Rely on others: only one tile left closed prior to winning
  closedTilesCount += hand.pair.length;
  let closedTilesBeforeWin = closedTilesCount;
  if (options.winningTile) {
    closedTilesBeforeWin -= 1;
  }
  if (closedTilesBeforeWin < 0) {
    closedTilesBeforeWin = 0;
  }

  let relyOnOthers = 0;
  let relyOnOthersHalf = 0;

  if (closedTilesBeforeWin === 1) {
    if (isSelfDrawn) {
      relyOnOthersHalf = 1;
    } else {
      relyOnOthers = 1;
    }
  }

  // Winning tile wait-type analysis
  let waitEdge = 0;
  let waitHole = 0;
  let waitPair = 0;
  let waitFalseEdge = 0;

  const winningTile = options.winningTile || null;
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
    isSelfDrawn,
    openDragonCount,
    closedDragonCount,
    openMixedDragonCount,
    closedMixedDragonCount,
    pairIs258,
    twoSuitsNoHonors,
    oneSuitWithHonorsAllowed,
    oneSuitNoHonors,
    smallFiveSuits,
    bigFiveSuits,
    smallSevenSuits,
    bigSevenSuits,
    onlyDragonsWinds,
    smallThreeDragons,
    bigThreeDragons,
    smallThreeWinds,
    bigThreeWinds,
    smallFourWinds,
    bigFourWinds,
    relyOnOthers,
    relyOnOthersHalf
  };
}

export function evaluateScoringRules(hand, configById, options = {}) {
  if (!hand) {
    return { total: 0, breakdown: [] };
  }

  const ctx = buildScoreContext(hand, options);
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