// Entry point for the Taiwanese Mahjong Winning Hand Generator.

import { generateWinningHand } from "./generator.js";
import {
  evaluateScoringRules,
  WIN_TYPE_DISCARD,
  WIN_TYPE_SELF_DRAWN
} from "./scoring.js";
import { renderFlowers, renderHand } from "./render.js";

let currentRoundWind = null;
let currentPlayerWind = null;
let currentHand = null;
let currentWinType = null;
let currentOpenMeldCount = 0;
let currentWinningTile = null;

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
    const scoringOptions = {
      roundWind: currentRoundWind,
      playerWind: currentPlayerWind,
      openMeldCount: currentOpenMeldCount,
      winningTile: currentWinningTile,
      winType: currentWinType
    };
    const result = evaluateScoringRules(currentHand, config, scoringOptions);

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

    let winningTile = null;
    if (hand) {
      const renderResult = renderHand(handOutput, hand, groupMelds, {
        winType: currentWinType,
        openMeldCount
      });
      if (renderResult && renderResult.winningTile) {
        winningTile = renderResult.winningTile;
      }
    } else {
      handOutput.innerHTML = "";
      handOutput.classList.add("empty");
    }

    currentWinningTile = winningTile;

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