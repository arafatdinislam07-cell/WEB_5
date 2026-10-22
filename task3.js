// ===== Constants =====
const MAX_QTY = 10;                 // must match max="10" in HTML
const MIN_NAME_WORDS = 2;           // first and last name
const MIN_WORD_LENGTH = 2;
const CODE_LENGTH = 6;              // length of the booking code
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const PERCENT = 100;

// ===== Data =====
const events = [
  { id: "meetup", title: "Frontend Meetup" },
  { id: "jam",    title: "Game Jam Finals" },
  { id: "career", title: "Career Day" }
];
const ticketTypes = [
  { id: "standard", label: "Standard", price: 20, seatsLeft: 10 },
  { id: "student",  label: "Student",  price: 12, seatsLeft: 6 },
  { id: "vip",      label: "VIP",      price: 45, seatsLeft: 2 }
];
const soldOutDates = ["2026-11-14", "2026-11-21", "2026-12-05"];
const promoCodes = [
  { code: "AITU10", discount: 10 },
  { code: "WEB2026", discount: 20 }
];
const blockedDomains = ["mailinator.com", "tempmail.com", "10minutemail.com"];

// ===== Elements =====
const form = document.querySelector("#ticket-form");
const fieldIds = ["event", "date", "type", "quantity", "name", "email", "promo"];
const fields = {};
for (const id of fieldIds) {
  fields[id] = document.querySelector("#" + id);
}
const summary = document.querySelector("#error-summary");
const result = document.querySelector("#result");
const preview = {
  event: document.querySelector("#pv-event"),
  date: document.querySelector("#pv-date"),
  type: document.querySelector("#pv-type"),
  qty: document.querySelector("#pv-qty"),
  name: document.querySelector("#pv-name"),
  email: document.querySelector("#pv-email"),
  promo: document.querySelector("#pv-promo"),
  total: document.querySelector("#pv-total")
};

// ===== State =====
const touched = {};   // field id -> true after the first blur

// ===== Helpers =====
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function makeBookingCode() {
  let code = "TK-";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[randomInt(0, CODE_ALPHABET.length - 1)];
  }
  return code;
}
function todayISO() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function findType(id) {
  for (const t of ticketTypes) {
    if (t.id === id) { return t; }
  }
  return null;
}
function findEvent(id) {
  for (const e of events) {
    if (e.id === id) { return e; }
  }
  return null;
}
function findPromo(text) {
  const wanted = text.trim().toUpperCase();
  for (const p of promoCodes) {
    if (p.code === wanted) { return p; }
  }
  return null;
}

// ===== Validation =====
const REQUIRED = {
  event: "Choose an event.",
  date: "Choose a date.",
  type: "Choose a ticket type.",
  quantity: "Enter the number of tickets.",
  name: "Enter your full name.",
  email: "Enter your email."
};

// Returns an error text, or "" when the field is correct.
function getError(id) {
  const field = fields[id];
  const value = field.value.trim();

  if (value === "") {
    return field.required ? REQUIRED[id] : "";
  }
  // Rules from HTML attributes (Constraint Validation API)
  if (field.validity.typeMismatch) { return "Enter a valid email like name@example.com."; }
  if (field.validity.badInput) { return "This value is not valid."; }
  if (field.validity.rangeUnderflow) {
    return id === "date" ? "The date cannot be in the past." : "Order at least 1 ticket.";
  }
  if (field.validity.rangeOverflow) { return "No more than " + MAX_QTY + " tickets per order."; }
  if (field.validity.stepMismatch) { return "Use a whole number."; }

  // Rules HTML attributes cannot express
  if (id === "date" && soldOutDates.includes(value)) {
    return "This date is sold out. Choose another date.";
  }
  if (id === "quantity") {
    const type = findType(fields.type.value);
    if (type !== null && Number(value) > type.seatsLeft) {
      return type.seatsLeft === 0 ? "This ticket type is sold out." : "Only " + type.seatsLeft + " seats left for " + type.label + ".";
    }
  }
  if (id === "name") {
    const words = value.split(/\s+/);
    if (words.length < MIN_NAME_WORDS) { return "Enter first and last name."; }
    const wordPattern = new RegExp("^[A-Za-z\\u0400-\\u04FF'-]{" + MIN_WORD_LENGTH + ",}$");
    for (const word of words) {
      if (!wordPattern.test(word)) { return "Use letters only, at least " + MIN_WORD_LENGTH + " per word."; }
    }
  }
  if (id === "email") {
    const domain = value.split("@")[1].toLowerCase();
    if (blockedDomains.includes(domain)) { return "Temporary email addresses are not accepted."; }
  }
  if (id === "promo" && findPromo(value) === null) {
    return "Unknown promo code.";
  }
  return "";
}

function showError(id, text) {
  const field = fields[id];
  document.querySelector("#" + id + "-error").textContent = text;
  field.classList.toggle("invalid", text !== "");
  field.classList.toggle("valid", text === "" && field.value.trim() !== "");
  field.setAttribute("aria-invalid", text !== "" ? "true" : "false");
}
function validateField(id) {
  const text = getError(id);
  showError(id, text);
  return text;
}
function clearErrors() {
  for (const id of fieldIds) {
    document.querySelector("#" + id + "-error").textContent = "";
    fields[id].classList.remove("invalid", "valid");
    fields[id].removeAttribute("aria-invalid");
    touched[id] = false;
  }
  summary.hidden = true;
  summary.textContent = "";
}

// ===== Rendering =====
function renderSelects() {
  const eventValue = fields.event.value;
  const typeValue = fields.type.value;
  fields.event.textContent = "";
  fields.type.textContent = "";

  const eventPlaceholder = document.createElement("option");
  eventPlaceholder.value = "";
  eventPlaceholder.textContent = "Choose an event";
  fields.event.appendChild(eventPlaceholder);
  for (const e of events) {
    const option = document.createElement("option");
    option.value = e.id;
    option.textContent = e.title;
    fields.event.appendChild(option);
  }

  const typePlaceholder = document.createElement("option");
  typePlaceholder.value = "";
  typePlaceholder.textContent = "Choose a ticket type";
  fields.type.appendChild(typePlaceholder);
  for (const t of ticketTypes) {
    const option = document.createElement("option");
    option.value = t.id;
    option.textContent = t.label + " - $" + t.price + " (" + t.seatsLeft + " left)";
    fields.type.appendChild(option);
  }
  fields.event.value = eventValue;
  fields.type.value = typeValue;
}

function calcTotal() {
  const type = findType(fields.type.value);
  const qty = Number(fields.quantity.value);
  if (type === null || !(qty > 0)) {
    return { total: 0, discount: 0 };
  }
  const promo = findPromo(fields.promo.value);
  const discount = promo === null ? 0 : promo.discount;
  const total = type.price * qty * (PERCENT - discount) / PERCENT;
  return { total: Math.round(total * PERCENT) / PERCENT, discount: discount };
}

function updatePreview() {
  const dash = "-";
  const event = findEvent(fields.event.value);
  const type = findType(fields.type.value);
  preview.event.textContent = event === null ? dash : event.title;
  preview.date.textContent = fields.date.value === "" ? dash : fields.date.value;
  preview.type.textContent = type === null ? dash : type.label;
  preview.qty.textContent = fields.quantity.value === "" ? dash : fields.quantity.value;
  preview.name.textContent = fields.name.value.trim() === "" ? dash : fields.name.value.trim();
  preview.email.textContent = fields.email.value.trim() === "" ? dash : fields.email.value.trim();

  const calc = calcTotal();
  preview.promo.textContent = calc.discount > 0 ? "-" + calc.discount + "% applied" : dash;
  preview.total.textContent = "$" + calc.total;
}

function showTicket(data) {
  result.textContent = "";
  const ticket = document.createElement("article");
  ticket.classList.add("ticket");

  const title = document.createElement("h2");
  title.textContent = "Your ticket is ready";
  const code = document.createElement("p");
  code.classList.add("code");
  code.textContent = data.code;

  const lines = [
    data.eventTitle + ", " + data.date,
    data.quantity + " x " + data.typeLabel + " for " + data.name,
    "Sent to " + data.email,
    "Total paid: $" + data.total
  ];
  ticket.append(title, code);
  for (const line of lines) {
    const p = document.createElement("p");
    p.textContent = line;
    ticket.appendChild(p);
  }
  result.appendChild(ticket);
}

// ===== Events =====
for (const id of fieldIds) {
  fields[id].addEventListener("blur", function () {
    touched[id] = true;
    validateField(id);
  });
}

form.addEventListener("input", function (event) {
  const id = event.target.id;
  updatePreview();
  if (touched[id]) {
    validateField(id);
  }
  // Seats depend on the ticket type, so re-check the quantity too.
  if (id === "type" && touched.quantity) {
    validateField("quantity");
  }
});

form.addEventListener("submit", function (event) {
  event.preventDefault();
  const invalid = [];
  for (const id of fieldIds) {
    touched[id] = true;
    if (validateField(id) !== "") {
      invalid.push(id);
    }
  }

  if (invalid.length > 0) {
    summary.textContent = invalid.length + (invalid.length === 1 ? " error" : " errors") + " found. Fix the marked fields.";
    summary.hidden = false;
    fields[invalid[0]].focus();
    return;
  }

  // Success: read values, update data, build the result, reset the form.
  const type = findType(fields.type.value);
  const calc = calcTotal();
  const data = {
    code: makeBookingCode(),
    eventTitle: findEvent(fields.event.value).title,
    date: fields.date.value,
    typeLabel: type.label,
    quantity: Number(fields.quantity.value),
    name: fields.name.value.trim(),
    email: fields.email.value.trim(),
    total: calc.total
  };
  type.seatsLeft -= data.quantity;

  form.reset();
  clearErrors();
  renderSelects();
  updatePreview();
  showTicket(data);
});

// ===== Start =====
form.noValidate = true;               // turn off browser messages, keep checkValidity()
fields.date.min = todayISO();
renderSelects();
updatePreview();