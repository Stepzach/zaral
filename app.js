const GIGS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTJM1n0L2wyP6LQ4jbPpPftXitGZFck6dNeyM7bztnMmOl8a4xQO8u0IQugImzqwJw_KW9Y0-id-7wR/pub?output=csv";

// Paste verified profile URLs and an optional booking form URL here.
// Blank profile URLs show an honest “Coming soon” label, never a guessed account.
const BOOKING_FORM_URL = "";
const INSTAGRAM_URL = "";
const TIKTOK_URL = "";

// Publish the four tabs as CSV and paste each complete published CSV URL.
// The existing gigs feed remains active until a replacement is supplied.
const CONTENT_FEEDS = {
  gigs: GIGS_CSV_URL,
  testimonials: "",
  setlist: "",
  gallery: ""
};

document.addEventListener("DOMContentLoaded", () => {
  initMenu();
  initExternalLinks();
  initLightbox();
  loadGigs();
  loadSection("testimonials", "#testimonials", ["quote", "name"], createQuote, row => row.quote && row.name);
  loadSection("setlist", "#setlist", ["song", "artist"], createSong, row => row.song);
  loadSection("gallery", "#gallery-images", ["image_url", "alt"], createPhoto, row => safeHttpUrl(row.image_url) && row.alt);
  document.querySelectorAll("[data-year]").forEach(el => el.textContent = new Date().getFullYear());
});

function initMenu() {
  const button = document.querySelector("[data-menu-button]");
  const nav = document.querySelector("[data-nav]");
  if (!button || !nav) return;

  const setOpen = (open) => {
    button.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
  };

  button.addEventListener("click", () => setOpen(button.getAttribute("aria-expanded") !== "true"));
  nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && button.getAttribute("aria-expanded") === "true") {
      setOpen(false);
      button.focus();
    }
  });
  window.addEventListener("resize", () => {
    if (window.matchMedia("(min-width: 801px)").matches) setOpen(false);
  });
}

function initExternalLinks() {
  document.querySelectorAll("[data-booking-link]").forEach(link => {
    const url = safeHttpUrl(BOOKING_FORM_URL);
    link.href = url || "mailto:hello@zaralakemusic.com?subject=Booking%20enquiry";
    if (!url) link.removeAttribute("target");
  });
  [["instagram", INSTAGRAM_URL], ["tiktok", TIKTOK_URL]].forEach(([platform, value]) => {
    document.querySelectorAll(`[data-${platform}-link]`).forEach(link => {
      const url = safeHttpUrl(value);
      if (url) {
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      } else {
        link.removeAttribute("href");
        link.setAttribute("aria-disabled", "true");
        link.title = `${platform === "tiktok" ? "TikTok" : "Instagram"} coming soon`;
        const action = link.querySelector(".social-action");
        if (action) action.textContent = "Coming soon";
        else link.append(document.createTextNode(" · soon"));
      }
    });
  });
}

function initLightbox() {
  const dialog = document.querySelector("[data-lightbox]");
  const image = document.querySelector("[data-lightbox-image]");
  const close = document.querySelector("[data-lightbox-close]");
  if (!dialog || !image || !close || typeof dialog.showModal !== "function") return;

  document.querySelector("#gallery-images")?.addEventListener("click", event => {
    const button = event.target.closest("[data-lightbox-src]");
    if (!button) return;
    const thumb = button.querySelector("img");
    image.src = button.dataset.lightboxSrc || thumb?.src || "";
    image.alt = thumb?.alt || "Gallery image";
    dialog.showModal();
  });
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => {
    const rect = dialog.getBoundingClientRect();
    const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
    if (!inside) dialog.close();
  });
  dialog.addEventListener("close", () => { image.src = ""; });
}

async function loadGigs() {
  const list = document.querySelector("#gig-list");
  if (!list) return;

  try {
    const rows = await fetchRows(CONTENT_FEEDS.gigs, ["date", "venue"]);
    const gigs = rows
      .map(normalizeGig)
      .filter(gig => gig.visible && gig.date && gig.date >= startOfToday())
      .sort((a, b) => a.date - b.date);

    list.replaceChildren();
    list.setAttribute("aria-busy", "false");
    if (!gigs.length) {
      list.innerHTML = '<p class="status">No upcoming gigs listed right now — check back soon.</p>';
      return;
    }
    gigs.forEach(gig => list.append(createGigCard(gig)));
  } catch (error) {
    console.error("Could not load gigs", error);
    list.setAttribute("aria-busy", "false");
    list.innerHTML = '<p class="status">Upcoming gigs couldn\'t be loaded right now. Please check back soon.</p>';
  }
}

function parseCSV(csv) {
  const rows = [];
  let row = [], value = "", quoted = false;
  for (let i = 0; i < csv.length; i++) {
    const char = csv[i], next = csv[i + 1];
    if (char === '"' && quoted && next === '"') { value += '"'; i++; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(value); value = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i++;
      row.push(value); rows.push(row); row = []; value = "";
    } else value += char;
  }
  if (value || row.length) { row.push(value); rows.push(row); }
  if (!rows.length) return [];
  const headers = rows.shift().map(h => h.trim().toLowerCase().replace(/\s+/g, "_"));
  return rows.filter(r => r.some(v => v.trim())).map(r => Object.fromEntries(headers.map((h, i) => [h, (r[i] || "").trim()])));
}

function normalizeGig(gig) {
  return {
    date: parseDate(gig.date),
    venue: gig.venue || "Live performance",
    location: gig.location || "",
    time: gig.time || "",
    description: gig.description || "",
    link: safeHttpUrl(gig.link),
    visible: isVisible(gig)
  };
}

function parseDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  date.setHours(0, 0, 0, 0);
  return date.getFullYear() === Number(match[1]) && date.getMonth() === Number(match[2]) - 1 && date.getDate() === Number(match[3]) ? date : null;
}

function startOfToday() {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const get = type => parts.find(part => part.type === type).value;
  return new Date(Number(get("year")), Number(get("month")) - 1, Number(get("day")));
}

function safeHttpUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch { return ""; }
}

function createGigCard(gig) {
  const article = document.createElement("article");
  article.className = "gig-card";

  const date = document.createElement("time");
  date.className = "gig-date";
  date.dateTime = `${gig.date.getFullYear()}-${String(gig.date.getMonth() + 1).padStart(2, "0")}-${String(gig.date.getDate()).padStart(2, "0")}`;
  const day = document.createElement("strong");
  day.textContent = gig.date.getDate();
  const month = document.createElement("span");
  month.textContent = gig.date.toLocaleDateString("en-GB", { month: "short" });
  date.append(day, month);

  const info = document.createElement("div");
  info.className = "gig-info";
  const title = document.createElement("h3");
  title.textContent = gig.venue;
  info.append(title);
  if (gig.location) { const p = document.createElement("p"); p.textContent = gig.location; info.append(p); }
  if (gig.time) { const p = document.createElement("p"); p.className = "gig-time"; p.textContent = gig.time; info.append(p); }
  if (gig.description) { const p = document.createElement("p"); p.textContent = gig.description; info.append(p); }

  article.append(date, info);
  if (gig.link) {
    const action = document.createElement("a");
    action.className = "gig-action";
    action.href = gig.link;
    action.target = "_blank";
    action.rel = "noopener noreferrer";
    action.textContent = "Details ↗";
    article.append(action);
  }
  return article;
}

// Independent feeds: a failure in one section cannot stop the others.
async function fetchRows(url, requiredHeaders) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, { cache: "no-store", signal: controller.signal });
    if (!response.ok) throw new Error(`Content feed returned ${response.status}`);
    const csv = (await response.text()).replace(/^\uFEFF/, "");
    // Validate even a header-only tab; an empty published tab is intentional.
    const header = parseCSV(csv + "\n__header_check__").at(-1) || {};
    if (!requiredHeaders.every(key => Object.hasOwn(header, key))) throw new Error("Incorrect content tab or missing column headers");
    return parseCSV(csv);
  } finally { clearTimeout(timeout); }
}
function isVisible(row) {
  return !["false", "0", "no", "hide", "hidden"].includes((row.visible || "").toLowerCase());
}
function orderedRows(rows) {
  return rows.filter(isVisible).sort((a, b) => {
    const rank = r => r.order !== "" && Number.isFinite(Number(r.order)) ? Number(r.order) : Number.MAX_SAFE_INTEGER;
    return rank(a) - rank(b);
  });
}
async function loadSection(key, selector, headers, create, valid) {
  const container = document.querySelector(selector);
  if (!container || !CONTENT_FEEDS[key]) return;
  container.setAttribute("aria-busy", "true");
  try {
    const rows = orderedRows(await fetchRows(CONTENT_FEEDS[key], headers));
    if (rows.some(row => !valid(row))) throw new Error("A visible content row is missing a required value");
    container.replaceChildren(...rows.map(create));
    container.closest("section").hidden = rows.length === 0;
  } catch (error) {
    console.warn(`Could not refresh ${key}; retaining existing content.`, error);
    const note = document.createElement("p");
    note.className = "status";
    note.textContent = "Latest updates are temporarily unavailable. Showing saved content.";
    container.after(note);
  } finally { container.setAttribute("aria-busy", "false"); }
}
function textElement(tag, text) {
  const el = document.createElement(tag);
  el.textContent = text || "";
  return el;
}
function createQuote(row) {
  const figure = document.createElement("figure");
  const caption = document.createElement("figcaption");
  caption.append(textElement("strong", row.name), textElement("span", row.location));
  figure.append(textElement("blockquote", `“${row.quote.replace(/^[“”"]|[“”"]$/g, "")}”`), caption);
  return figure;
}
function createSong(row) {
  const li = document.createElement("li");
  li.append(textElement("span", row.song), textElement("small", row.artist));
  return li;
}
function createPhoto(row, index) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `photo photo-${["a", "b", "c", "d"][index % 4]}`;
  button.dataset.lightboxSrc = safeHttpUrl(row.image_url);
  const img = document.createElement("img");
  img.src = button.dataset.lightboxSrc;
  img.alt = row.alt;
  img.loading = "lazy";
  img.decoding = "async";
  button.append(img);
  return button;
}
