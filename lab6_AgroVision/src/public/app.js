const fieldSelect = document.querySelector("#fieldSelect");
const refreshBtn = document.querySelector("#refreshBtn");
const recommendBtn = document.querySelector("#recommendBtn");
const fieldInfo = document.querySelector("#fieldInfo");
const metricsBox = document.querySelector("#metrics");
const recommendationBox = document.querySelector("#recommendation");
const sourceBox = document.querySelector("#source");

let fields = [];

async function request(path, options) {
  const res = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) }
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || `HTTP ${res.status}`);
  }
  return res.json();
}

function renderFieldOptions() {
  fieldSelect.innerHTML = fields
    .map((f) => `<option value="${f.id}">${f.name} (${f.crop})</option>`)
    .join("");
}

function selectedField() {
  return fields.find((f) => f.id === fieldSelect.value);
}

function renderSummary(summary) {
  const field = summary.field;
  fieldInfo.textContent = `${field.name}: ${field.areaHa} га, культура: ${field.crop}`;

  metricsBox.innerHTML = summary.metrics
    .map((m) => {
      const warning = m.metric === "soil_moisture" && m.last < 28 ? "<span class='warn'>низкая влажность</span>" : "";
      return `<div class="metric"><b>${m.metric}</b><br>avg=${m.avg}, last=${m.last} ${warning}</div>`;
    })
    .join("");
}

async function loadSummary() {
  const field = selectedField();
  if (!field) return;
  const summary = await request(`/api/fields/${field.id}/summary`);
  renderSummary(summary);
}

async function loadFields() {
  const data = await request("/api/fields");
  fields = data.items;
  renderFieldOptions();
  await loadSummary();
}

async function createRecommendation() {
  recommendBtn.disabled = true;
  sourceBox.textContent = "";

  try {
    const data = await request("/api/recommendation", {
      method: "POST",
      body: JSON.stringify({ fieldId: fieldSelect.value })
    });

    const rec = data.recommendation;
    sourceBox.textContent = `Источник: ${rec.source}`;
    recommendationBox.textContent = `${rec.text}\n\nДействия:\n- ${rec.actions.join("\n- ")}`;
    renderSummary(data.summary);
  } catch (err) {
    recommendationBox.textContent = `Ошибка: ${err.message}`;
  } finally {
    recommendBtn.disabled = false;
  }
}

refreshBtn.addEventListener("click", loadSummary);
fieldSelect.addEventListener("change", loadSummary);
recommendBtn.addEventListener("click", createRecommendation);

loadFields().catch((err) => {
  recommendationBox.textContent = `Ошибка загрузки: ${err.message}`;
});
