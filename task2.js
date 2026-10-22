// ===== Constants =====
const WIP_LIMIT = 3;            // max cards in "In progress"
const PERCENT = 100;            // for the progress bar
const STATUSES = ["todo", "progress", "done"];

// ===== Data: array of objects (id, title, tag, priority, hours, urgent, status) =====
const tasks = [
  { id: 1,  title: "Plan the site structure",   tag: "design",  priority: 1, hours: 2, urgent: false, status: "done" },
  { id: 2,  title: "Draw the page wireframe",   tag: "design",  priority: 2, hours: 3, urgent: false, status: "todo" },
  { id: 3,  title: "Write the HTML skeleton",   tag: "html",    priority: 1, hours: 4, urgent: true,  status: "progress" },
  { id: 4,  title: "Add the navigation menu",   tag: "html",    priority: 2, hours: 2, urgent: false, status: "todo" },
  { id: 5,  title: "Style the header",          tag: "css",     priority: 2, hours: 2, urgent: false, status: "todo" },
  { id: 6,  title: "Make the grid layout",      tag: "css",     priority: 1, hours: 5, urgent: true,  status: "todo" },
  { id: 7,  title: "Add the contact form",      tag: "html",    priority: 3, hours: 3, urgent: false, status: "todo" },
  { id: 8,  title: "Validate the form in JS",   tag: "js",      priority: 1, hours: 6, urgent: true,  status: "todo" },
  { id: 9,  title: "Build the image gallery",   tag: "js",      priority: 3, hours: 4, urgent: false, status: "progress" },
  { id: 10, title: "Check on a 375px screen",   tag: "css",     priority: 2, hours: 1, urgent: false, status: "todo" },
  { id: 11, title: "Write the project report",  tag: "report",  priority: 2, hours: 3, urgent: false, status: "todo" },
  { id: 12, title: "Upload to GitHub Pages",    tag: "report",  priority: 3, hours: 1, urgent: false, status: "done" }
];

// ===== Elements =====
const board = document.querySelector("#board");
const columns = {
  todo: document.querySelector("#col-todo"),
  progress: document.querySelector("#col-progress"),
  done: document.querySelector("#col-done")
};
const counters = {
  todo: document.querySelector("#count-todo"),
  progress: document.querySelector("#count-progress"),
  done: document.querySelector("#count-done")
};
const tagFilter = document.querySelector("#tag-filter");
const searchInput = document.querySelector("#search");
const sortSelect = document.querySelector("#sort-select");
const message = document.querySelector("#message");
const emptyMessage = document.querySelector("#empty-message");
const progress = document.querySelector("#progress");
const progressText = document.querySelector("#progress-text");

// ===== State =====
let currentTag = "all";
let currentSort = "none";
let currentQuery = "";
let flashId = null;      // card that just moved

// ===== Helpers =====
function showMessage(text, type) {
  message.textContent = text;
  message.classList.remove("error", "ok");
  if (type) {
    message.classList.add(type);
  }
}

// Own loop: counts cards in a status.
function countByStatus(status) {
  let count = 0;
  for (const task of tasks) {
    if (task.status === status) {
      count++;
    }
  }
  return count;
}

// Own loop: finished cards and their total hours.
function calcProgress() {
  let doneCount = 0;
  let doneHours = 0;
  let totalHours = 0;
  for (const task of tasks) {
    totalHours += task.hours;
    if (task.status === "done") {
      doneCount++;
      doneHours += task.hours;
    }
  }
  return { doneCount: doneCount, doneHours: doneHours, totalHours: totalHours };
}

function fillTagFilter() {
  const tags = [];
  for (const task of tasks) {
    if (!tags.includes(task.tag)) {
      tags.push(task.tag);
    }
  }
  tags.unshift("all");
  for (const tag of tags) {
    const option = document.createElement("option");
    option.value = tag;
    option.textContent = tag === "all" ? "All tags" : tag;
    tagFilter.appendChild(option);
  }
}

function createCard(task) {
  const card = document.createElement("article");
  card.classList.add("card", "p" + task.priority);
  card.classList.toggle("flash", task.id === flashId);
  card.dataset.id = task.id;

  const title = document.createElement("h3");
  title.textContent = task.title;

  const meta = document.createElement("p");
  meta.classList.add("meta");
  meta.textContent = "#" + task.tag + " | priority " + task.priority + " | " + task.hours + " h";
  if (task.urgent) {
    const badge = document.createElement("span");
    badge.classList.add("badge");
    badge.textContent = "urgent";
    meta.appendChild(badge);
  }

  const actions = document.createElement("div");
  actions.classList.add("actions");
  const index = STATUSES.indexOf(task.status);
  if (index > 0) {
    const back = document.createElement("button");
    back.type = "button";
    back.dataset.action = "back";
    back.textContent = "Back";
    actions.appendChild(back);
  }
  if (index < STATUSES.length - 1) {
    const forward = document.createElement("button");
    forward.type = "button";
    forward.dataset.action = "forward";
    forward.textContent = "Forward";
    actions.appendChild(forward);
  }

  card.append(title, meta, actions);
  return card;
}

// ===== Render: one function, called after every change =====
function render() {
  // 1. filter
  let visible = [];
  for (const task of tasks) {
    const tagMatches = currentTag === "all" || task.tag === currentTag;
    const textMatches = task.title.toLowerCase().includes(currentQuery);
    if (tagMatches && textMatches) {
      visible.push(task);
    }
  }
  // 2. sort (copy, so the data order stays the same)
  if (currentSort === "priority") {
    visible = visible.slice().sort(function (a, b) { return a.priority - b.priority; });
  }
  // 3. draw columns
  for (const status of STATUSES) {
    columns[status].textContent = "";
    let shown = 0;
    for (const task of visible) {
      if (task.status === status) {
        columns[status].appendChild(createCard(task));
        shown++;
      }
    }
    if (shown === 0) {
      const empty = document.createElement("p");
      empty.classList.add("empty-col");
      empty.textContent = "No cards here";
      columns[status].appendChild(empty);
    }
    counters[status].textContent = countByStatus(status);
  }
  emptyMessage.hidden = visible.length > 0;

  // 4. progress bar
  const result = calcProgress();
  const percent = Math.round(result.doneCount / tasks.length * PERCENT);
  progress.value = percent;
  progressText.textContent = result.doneCount + " of " + tasks.length +
    " (" + percent + "%), " + result.doneHours + " of " + result.totalHours + " hours";
}

// ===== Actions =====
function moveTask(id, direction) {
  let task = null;
  for (const t of tasks) {
    if (t.id === id) {
      task = t;
    }
  }
  if (task === null) {
    return;
  }
  const newIndex = STATUSES.indexOf(task.status) + (direction === "forward" ? 1 : -1);
  if (newIndex < 0 || newIndex >= STATUSES.length) {
    showMessage("This card cannot move further.", "error");
    return;
  }
  const newStatus = STATUSES[newIndex];

  // Rule: "In progress" holds at most WIP_LIMIT cards.
  if (newStatus === "progress" && countByStatus("progress") >= WIP_LIMIT) {
    showMessage("Blocked: In progress already has " + WIP_LIMIT + " cards. Finish one first.", "error");
    return;
  }
  task.status = newStatus;
  flashId = task.id;
  showMessage("Moved \"" + task.title + "\" to " + newStatus + ".", "ok");
  render();
  flashId = null;
}

// ===== Events =====
// One listener on the board for the buttons of all cards (event delegation).
board.addEventListener("click", function (event) {
  const button = event.target.closest("button");
  if (button === null || button.dataset.action === undefined) {
    return;
  }
  const card = button.closest(".card");
  moveTask(Number(card.dataset.id), button.dataset.action);
});

tagFilter.addEventListener("change", function () {
  currentTag = tagFilter.value;
  showMessage("", "");
  render();
});

searchInput.addEventListener("input", function () {
  currentQuery = searchInput.value.trim().toLowerCase();
  showMessage("", "");
  render();
});

sortSelect.addEventListener("change", function () {
  currentSort = sortSelect.value;
  showMessage("", "");
  render();
});

fillTagFilter();
render();