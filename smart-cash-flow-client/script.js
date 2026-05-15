const panels = {
  features: document.getElementById("featuresPanel"),
  demo: document.getElementById("demoPanel"),
  pricing: document.getElementById("pricingPanel"),
};

const peso = "\u20b1";
const toast = document.getElementById("toast");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2400);
}

function openModal(title, body) {
  modalTitle.textContent = title;
  modalBody.textContent = body;
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
}

document.querySelectorAll("[data-dropdown]").forEach((button) => {
  button.addEventListener("click", () => {
    const key = button.dataset.dropdown;
    Object.entries(panels).forEach(([name, panel]) => {
      panel.classList.toggle("show", name === key && !panel.classList.contains("show"));
    });
  });
});

document.addEventListener("click", (event) => {
  if (!event.target.closest("[data-menu]") && !event.target.closest(".dropdown-panel")) {
    Object.values(panels).forEach((panel) => panel.classList.remove("show"));
  }
});

document.getElementById("uploadButton").addEventListener("click", () => {
  document.getElementById("uploadInput").click();
});

document.getElementById("uploadInput").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  document.getElementById("cashBalance").textContent = peso + "18,940";
  showToast(file.name + " uploaded. Forecast refreshed.");
});

document.querySelectorAll(".side-item[data-section]").forEach((item) => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".side-item").forEach((link) => link.classList.remove("active"));
    item.classList.add("active");
    const section = item.dataset.section;
    if (section === "forecast") {
      document.getElementById("forecast").scrollIntoView({ behavior: "smooth", block: "center" });
      showToast("Forecast panel selected.");
    } else if (section === "scenario") {
      openModal("Scenario Simulation", "Revenue drop, late payments, and expense increase scenarios are modeled in the workflow section below.");
    } else if (section === "settings") {
      openModal("Settings", "Alert threshold: high risk at 75+. Notifications: live. Currency: PHP. Current risk score: 81.");
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
      showToast("Dashboard selected.");
    }
  });
});

document.querySelectorAll("[data-range]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-range]").forEach((range) => range.classList.remove("active"));
    button.classList.add("active");
    const sixMonths = button.dataset.range === "6";
    document.getElementById("forecastChart").classList.toggle("six-months", sixMonths);
    document.getElementById("forecastLabel").textContent = sixMonths ? peso + "58,200" : peso + "41,500";
    document.getElementById("latestForecast").textContent = sixMonths ? peso + "58,200" : peso + "41,500";
    showToast(sixMonths ? "Showing six-month forecast." : "Showing three-month forecast.");
  });
});

document.querySelector("[data-modal='details']").addEventListener("click", () => {
  openModal("Risk Score Details", "Score 81 is high risk because current cash is only " + peso + "12,500 while overdue receivables are " + peso + "22,365 and net cash flow is -" + peso + "4,900. Recommended action: follow up on overdue payments first.");
});

document.getElementById("updateRisk").addEventListener("click", () => {
  document.getElementById("riskBadge").textContent = "OK Medium Risk 62";
  document.getElementById("riskScore").textContent = "62";
  document.querySelector(".risk-alert").classList.add("improved");
  showToast("Risk forecast updated. Score improved to 62.");
});

document.getElementById("markRead").addEventListener("click", () => {
  document.querySelectorAll(".alert-card").forEach((card) => card.classList.add("read"));
  showToast("All alerts marked as read.");
});

document.getElementById("moreAlerts").addEventListener("click", () => {
  document.querySelectorAll(".hidden-alert").forEach((card) => card.classList.toggle("show"));
  showToast("Additional alert toggled.");
});

document.getElementById("showPrices").addEventListener("click", () => {
  openModal("Price Impact", "Estimated monthly pressure: rent +" + peso + "500, overdue payments " + peso + "22,365, working capital target " + peso + "10,000.");
});

document.querySelector("[data-modal='learn']").addEventListener("click", () => {
  document.getElementById("workflow").scrollIntoView({ behavior: "smooth" });
});

document.querySelectorAll(".alert-card").forEach((card) => {
  card.addEventListener("click", () => card.classList.toggle("selected"));
});

document.querySelectorAll(".step-card").forEach((card) => {
  card.addEventListener("click", () => openModal(card.querySelector("h2").textContent.trim(), card.dataset.step));
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      card.click();
    }
  });
});

document.getElementById("modalClose").addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
});
