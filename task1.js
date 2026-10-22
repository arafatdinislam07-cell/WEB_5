// ===== Constants: all numbers of the game =====
const START_LIVES = 3;      // lives at the start
const PRICE_MIN = 10;       // smallest possible price
const PRICE_MAX = 500;      // largest possible price
const START_STREAK = 0;     // streak at the start
const STEP = 1;             // streak / lives change per move

const ITEMS = ["Headphones", "Keyboard", "Backpack", "Monitor", "Lamp", "Mouse",
  "Speaker", "Camera", "Watch", "Tablet", "Router", "Microphone"];

// ===== Elements =====
const rules = document.querySelector("#rules");
const livesEl = document.querySelector("#lives");
const streakEl = document.querySelector("#streak");
const bestEl = document.querySelector("#best");
const currentCard = document.querySelector("#current-card");
const nextCard = document.querySelector("#next-card");
const currentName = document.querySelector("#current-name");
const currentPrice = document.querySelector("#current-price");
const nextName = document.querySelector("#next-name");
const nextPrice = document.querySelector("#next-price");
const higherBtn = document.querySelector("#higher-btn");
const lowerBtn = document.querySelector("#lower-btn");
const restartBtn = document.querySelector("#restart-btn");
const message = document.querySelector("#message");

// ===== State =====
let lives = START_LIVES;
let streak = START_STREAK;
let bestStreak = START_STREAK;
let current = null;      // { name, price }
let next = null;         // { name, price } - hidden until the player guesses
let revealed = false;    // true while the next price is shown
let gameOver = false;
let roundTimer = null;   // timer of the pause between rounds
const PAUSE_MS = 1200;   // pause after a guess

// ===== Helpers =====
// Whole number from min to max, both included.
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem() {
  return {
    name: ITEMS[randomInt(0, ITEMS.length - 1)],
    price: randomInt(PRICE_MIN, PRICE_MAX)
  };
}

// Equal prices count as a right guess.
function isRightGuess(choice, currentValue, nextValue) {
  return (choice === "higher" && nextValue >= currentValue) ||
         (choice === "lower" && nextValue <= currentValue);
}

function showMessage(text, type) {
  message.textContent = text;
  message.classList.remove("good", "bad", "error");
  if (type) {
    message.classList.add(type);
  }
}

// ===== Render: called after every change =====
function render() {
  livesEl.textContent = "";
  for (let i = 0; i < START_LIVES; i++) {
    const heart = document.createElement("span");
    heart.classList.add("life");
    heart.classList.toggle("lost", i >= lives);
    livesEl.appendChild(heart);
  }
  streakEl.textContent = streak;
  bestEl.textContent = bestStreak;

  currentName.textContent = current.name;
  currentPrice.textContent = "$" + current.price;
  nextName.textContent = next.name;
  nextPrice.textContent = revealed ? "$" + next.price : "?";

  higherBtn.disabled = gameOver;
  lowerBtn.disabled = gameOver;
}

// ===== Game flow =====
function startGame() {
  clearTimeout(roundTimer);
  lives = START_LIVES;
  streak = START_STREAK;
  gameOver = false;
  revealed = false;
  current = randomItem();
  next = randomItem();
  currentCard.classList.remove("correct", "wrong");
  nextCard.classList.remove("correct", "wrong");
  rules.textContent = "Is the price of the next item higher or lower? You have " +
    START_LIVES + " lives. Equal prices count as a right guess.";
  showMessage("Make your guess.", "");
  render();
}

function makeGuess(choice) {
  // Invalid moves are rejected and the state stays the same.
  if (gameOver) {
    showMessage("Game over. Press New game to play again.", "error");
    return;
  }
  if (choice !== "higher" && choice !== "lower") {
    showMessage("Choose Higher or Lower.", "error");
    return;
  }

  const right = isRightGuess(choice, current.price, next.price);
  revealed = true;
  nextCard.classList.remove("correct", "wrong");

  if (right) {
    streak += STEP;
    nextCard.classList.add("correct");
    if (streak > bestStreak) {
      bestStreak = streak;
      showMessage("Right! New best streak: " + bestStreak + ".", "good");
    } else {
      showMessage("Right! Streak: " + streak + ".", "good");
    }
  } else {
    lives -= STEP;
    streak = START_STREAK;
    nextCard.classList.add("wrong");
    if (lives === 0) {
      gameOver = true;
      showMessage("Wrong. No lives left. Game over.", "bad");
    } else {
      showMessage("Wrong. Lives left: " + lives + ".", "bad");
    }
  }
  render();

  if (!gameOver) {
    // Show the result for a moment, then move to the next round.
    higherBtn.disabled = true;
    lowerBtn.disabled = true;
    roundTimer = setTimeout(nextRound, PAUSE_MS);
  }
}

function nextRound() {
  current = next;
  next = randomItem();
  revealed = false;
  nextCard.classList.remove("correct", "wrong");
  render();
}

// ===== Events =====
higherBtn.addEventListener("click", function () { makeGuess("higher"); });
lowerBtn.addEventListener("click", function () { makeGuess("lower"); });
restartBtn.addEventListener("click", startGame);

startGame();