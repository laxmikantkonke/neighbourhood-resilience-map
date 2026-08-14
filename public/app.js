const $ = (selector) => document.querySelector(selector);
const serviceGrid = $("#serviceGrid");
const serviceMessage = $("#serviceMessage");
const category = $("#category");
const area = $("#area");
const categoryChips = $("#categoryChips");
let referralController;

function applyTheme(theme) {
  const dark = theme === "dark";
  document.body.classList.toggle("dark", dark);
  const button = $("#themeToggle");
  button.setAttribute("aria-pressed", String(dark));
  button.setAttribute("aria-label", `Switch to ${dark ? "light" : "dark"} theme`);
  button.querySelector(".theme-icon").textContent = dark ? "☀" : "☾";
  button.querySelector(".theme-label").textContent = dark ? "Light" : "Dark";
}

const savedTheme = localStorage.getItem("neighbourlink-theme");
applyTheme(savedTheme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));

function showMessage(element, text, kind = "loading") {
  element.className = `message ${kind}`;
  element.innerHTML = kind === "loading" ? `<span class="spinner"></span>${text}` : text;
  element.hidden = false;
}

function addText(element, selector, text) { element.querySelector(selector).textContent = text || ""; }

const nextSteps = {
  Food: "Check the opening time, then visit the provider. These food services do not need a referral.",
  Housing: "Bring any tenancy, rent, or landlord documents you have. The provider can explain your options.",
  Work: "Bring your CV if you have one. The team can help even if you are starting from scratch.",
  Money: "Ask for a benefit check and explain if you need urgent financial support.",
  Wellbeing: "You can attend the next session and speak to the team about what support feels right for you."
};

function openServiceDetail(service) {
  const detail = $("#serviceDetail");
  addText(detail, "#detailCategory", service.category);
  addText(detail, "#detailTitle", service.name);
  addText(detail, "#detailDescription", service.description);
  addText(detail, "#detailAvailability", service.availability);
  addText(detail, "#detailAreas", service.areas?.join(" · ") || "Local area");
  addText(detail, "#detailProvider", service.organisation);
  addText(detail, "#detailNextStep", nextSteps[service.category] || "Contact the provider to confirm the best next step.");
  detail.hidden = false;
  document.body.classList.add("modal-open");
  $("#closeDetail").focus();
}

function closeServiceDetail() {
  $("#serviceDetail").hidden = true;
  document.body.classList.remove("modal-open");
}

function displayServices(services) {
  serviceGrid.innerHTML = "";
  if (!services.length) return showMessage(serviceMessage, "No services match these filters. Try another area or category.", "empty");
  serviceMessage.hidden = true;
  const template = $("#serviceTemplate");
  services.forEach((service) => {
    const card = template.content.cloneNode(true);
    addText(card, ".tag", service.category);
    addText(card, "h3", service.name);
    addText(card, ".description", service.description);
    addText(card, ".availability", service.availability);
    addText(card, ".areas", service.areas?.join(" · ") || "Local");
    addText(card, ".provider", `Provided by ${service.organisation}`);
    card.querySelector(".verified").hidden = !service.verified;
    const article = card.querySelector(".service-card");
    article.tabIndex = 0;
    article.setAttribute("role", "button");
    article.setAttribute("aria-label", `Show details for ${service.name}`);
    article.addEventListener("click", () => openServiceDetail(service));
    article.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openServiceDetail(service); }
    });
    serviceGrid.append(card);
  });
}

function renderCategoryChips(categories) {
  categoryChips.innerHTML = "";
  ["All", ...categories].forEach((name) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "category-chip";
    chip.textContent = name;
    chip.setAttribute("aria-pressed", String(name === category.value));
    chip.addEventListener("click", () => {
      category.value = name;
      renderCategoryChips(categories);
      loadServices();
    });
    categoryChips.append(chip);
  });
}

async function loadServices() {
  showMessage(serviceMessage, "Mapping support services...");
  try {
    const params = new URLSearchParams({ category: category.value, area: area.value });
    const response = await fetch(`/api/services?${params}`);
    if (!response.ok) throw new Error((await response.json()).message);
    displayServices(await response.json());
  } catch (error) {
    showMessage(serviceMessage, error.message || "We could not load local services right now. Please try again shortly.", "error");
  }
}

async function loadOverview() {
  try {
    const response = await fetch("/api/overview");
    if (!response.ok) throw new Error("The map is unavailable.");
    const overview = await response.json();
    const categories = overview.categories.sort();
    categories.forEach((name) => category.add(new Option(name, name)));
    renderCategoryChips(categories);
    displayServices(overview.services);
  } catch (error) {
    showMessage(serviceMessage, "The map is temporarily unavailable. Please check back soon.", "error");
  }
}

async function selectNeed(need) {
  // A new click supersedes an older request, preventing duplicate cards or a stale spinner.
  referralController?.abort();
  const controller = new AbortController();
  referralController = controller;
  const route = $("#routes");
  route.hidden = false;
  route.scrollIntoView({ behavior: "smooth", block: "start" });
  $("#routeTitle").textContent = `Trusted routes for ${need === "work" ? "work and skills" : need + " support"}`;
  const routeList = $("#routeList");
  routeList.innerHTML = "";
  const routeMessage = $("#routeMessage");
  showMessage(routeMessage, "Following trusted connections...");
  try {
    const params = new URLSearchParams({ need, area: area.value });
    const response = await fetch(`/api/referrals?${params}`, { signal: controller.signal });
    if (!response.ok) throw new Error((await response.json()).message);
    const routes = await response.json();
    if (!routes.length) return showMessage(routeMessage, "No linked referral routes in this area yet. Explore all services above.", "empty");
    routeMessage.hidden = true;
    const template = $("#routeTemplate");
    routes.forEach((item) => {
      const card = template.content.cloneNode(true);
      addText(card, ".provider", item.provider);
      addText(card, ".partner", item.partner);
      addText(card, ".service", item.service);
      addText(card, ".description", item.description);
      addText(card, ".tag", item.category);
      addText(card, ".route-supports", `Supports ${item.supports}`);
      addText(card, ".route-area", item.areas?.join(" · ") || "Local");
      routeList.append(card);
    });
  } catch (error) {
    if (error.name === "AbortError") return;
    showMessage(routeMessage, error.message || "We could not follow this route right now.", "error");
  } finally {
    if (referralController === controller) referralController = undefined;
  }
}

async function updateHealth() {
  const status = $("#databaseStatus");
  try {
    const response = await fetch("/api/health");
    if (!response.ok) throw new Error();
    status.innerHTML = '<span class="status-dot"></span> Live CognoDB network';
  } catch {
    status.classList.add("error");
    status.innerHTML = '<span class="status-dot"></span> Connection unavailable';
  }
}

category.addEventListener("change", () => { renderCategoryChips([...category.options].slice(1).map((option) => option.value)); loadServices(); });
area.addEventListener("change", loadServices);
document.querySelectorAll(".need-card").forEach((card) => card.addEventListener("click", () => selectNeed(card.dataset.need)));
$("#closeRoute").addEventListener("click", () => $("#routes").hidden = true);
$("#closeDetail").addEventListener("click", closeServiceDetail);
$("#serviceDetail").addEventListener("click", (event) => { if (event.target === event.currentTarget) closeServiceDetail(); });
$("#showHow").addEventListener("click", () => $("#how").scrollIntoView({ behavior: "smooth" }));
const menuToggle = $("#menuToggle");
const siteMenu = $("#siteMenu");
function closeMenu() {
  menuToggle.setAttribute("aria-expanded", "false");
  siteMenu.hidden = true;
}
menuToggle.addEventListener("click", () => {
  const open = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!open));
  siteMenu.hidden = open;
});
siteMenu.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
document.addEventListener("click", (event) => {
  if (!event.target.closest(".menu-wrap")) closeMenu();
});
document.addEventListener("keydown", (event) => { if (event.key === "Escape") { closeMenu(); closeServiceDetail(); } });
$("#themeToggle").addEventListener("click", () => {
  const nextTheme = document.body.classList.contains("dark") ? "light" : "dark";
  localStorage.setItem("neighbourlink-theme", nextTheme);
  applyTheme(nextTheme);
});
updateHealth();
loadOverview();
