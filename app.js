const STORAGE_KEY = "margin-paper-notes-v1";
const CATALOG_VERSION_KEY = "margin-curated-catalog-v3";
const TOPIC_CATALOG_KEY = "paper-notes-study-topics-v2";
const STUDY_CONTENT_KEY = "paper-notes-imported-content-v4";
const PAPER_CONTENT_KEY = "paper-notes-imported-paper-content-v3";

const seedPapers = [
  {
    id: "attention-is-all-you-need",
    title: "Attention Is All You Need",
    authors: "Ashish Vaswani et al.",
    year: 2017,
    venue: "NeurIPS",
    doi: "arXiv:1706.03762",
    collection: "Language models",
    status: "done",
    tags: ["Transformer", "NLP"],
    url: "https://arxiv.org/abs/1706.03762",
    abstract: "순환 구조 없이 attention만으로 시퀀스를 처리하는 Transformer를 제안한다.",
    note: "## 핵심\nSelf-attention으로 장거리 의존성을 직접 모델링한다.\n\n## 연결\n스케일링 관점은 [[Scaling Laws for Neural Language Models]]에서 더 구체화된다.",
    favorite: true,
    updatedAt: "2026-06-27T08:20:00.000Z"
  },
  {
    id: "scaling-laws-for-neural-language-models",
    title: "Scaling Laws for Neural Language Models",
    authors: "Jared Kaplan et al.",
    year: 2020,
    venue: "arXiv",
    doi: "arXiv:2001.08361",
    collection: "Language models",
    status: "on-going",
    tags: ["Scaling", "LLM"],
    url: "https://arxiv.org/abs/2001.08361",
    abstract: "모델 크기, 데이터 크기, 연산량에 따른 언어 모델 성능의 멱법칙 관계를 분석한다.",
    note: "모델과 데이터, compute 사이의 균형이 중요하다. [[Attention Is All You Need]]가 구조의 전환점이라면 이 논문은 규모의 원칙을 설명한다.",
    favorite: false,
    updatedAt: "2026-06-26T13:10:00.000Z"
  },
  {
    id: "chain-of-thought-prompting",
    title: "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models",
    authors: "Jason Wei et al.",
    year: 2022,
    venue: "NeurIPS",
    doi: "arXiv:2201.11903",
    collection: "Reasoning",
    status: "not-yet",
    tags: ["Prompting", "Reasoning"],
    url: "https://arxiv.org/abs/2201.11903",
    abstract: "중간 추론 단계를 예시로 제공하면 대규모 언어 모델의 복잡한 추론 능력이 향상됨을 보인다.",
    note: "",
    favorite: false,
    updatedAt: "2026-06-25T10:00:00.000Z"
  }
];

function inferCatalogKeywords(title) {
  const rules = [
    [/vision-language-action|\bVLA\b/i, "VLA"],
    [/reinforcement learning|\bRL\b|actor-critic|policy gradients/i, "Reinforcement Learning"],
    [/world model|world-action|generative interactive/i, "World Model"],
    [/causal/i, "Causality"],
    [/skill discovery|learning skills/i, "Skill Discovery"],
    [/latent action/i, "Latent Action"],
    [/simulation/i, "Simulation"],
    [/humanoid|human-centric/i, "Humanoid"],
    [/dexterous|bimanual/i, "Dexterous Manipulation"],
    [/locomotion|loco-manipulation|whole-body/i, "Locomotion"],
    [/spatial/i, "Spatial Reasoning"],
    [/diffusion policy/i, "Diffusion Policy"],
    [/uncertainty|risk-aware|risk and uncertainty/i, "Risk & Uncertainty"],
    [/video/i, "Video Learning"]
  ];
  return rules.filter(([pattern]) => pattern.test(title)).map(([, keyword]) => keyword);
}

function inferCatalogCategory(title, tags) {
  if (/jailbreak|adversarial examples/i.test(title)) return "VLM Safety";
  if (tags.includes("Causality")) return "Causal RL";
  if (tags.includes("Skill Discovery")) return "Skill Discovery";
  if (tags.includes("World Model") || tags.includes("Latent Action")) return "World Models";
  if (tags.includes("VLA")) return "Vision-Language-Action";
  if (tags.includes("Locomotion")) return "Loco-Manipulation";
  if (tags.includes("Reinforcement Learning")) return "Reinforcement Learning";
  return "Robot Learning";
}

function buildCuratedCatalog() {
  const now = Date.now();
  return curatedPaperCatalog.map((paper, index) => {
    const tags = inferCatalogKeywords(paper.title);
    return {
    id: `paper-${String(index + 1).padStart(2, "0")}`,
    type: "paper",
    ...paper,
    authors: paper.authors.join(", "),
    collection: inferCatalogCategory(paper.title, tags),
    status: "done",
    tags,
    abstract: "",
    note: "",
    favorite: false,
    updatedAt: new Date(now - index * 1000).toISOString()
  }});
}

const NOT_YET_TOPICS = new Set(["GR00T-N1.6", "Cosmos 3", "PI0.6", "Diffusion Model"]);

function buildStudyTopics() {
  const now = Date.now();
  return studyTopicCatalog.map((topic, index) => ({
    id: `topic-${String(index + 1).padStart(2, "0")}`,
    type: "topic",
    title: topic.title,
    authors: "",
    year: null,
    venue: "",
    doi: "",
    collection: topic.collection,
    status: NOT_YET_TOPICS.has(topic.title) ? "not-yet" : "done",
    tags: topic.tags,
    url: "",
    abstract: "",
    note: "",
    favorite: false,
    updatedAt: new Date(now - index * 1000).toISOString()
  }));
}

function normalizeStudyTitle(value) {
  return String(value || "").toLowerCase()
    .replace("theroem", "theorem")
    .replace(/[^a-z0-9가-힣]+/g, "");
}

function applyImportedStudyNotes(items) {
  const topicTemplates = buildStudyTopics();
  const existingTitles = new Set(items.filter(isTopic).map(item => normalizeStudyTitle(item.title)));
  topicTemplates.forEach(topic => {
    if (!existingTitles.has(normalizeStudyTitle(topic.title))) items.push(topic);
  });

  Object.entries(importedStudyNotes).forEach(([sourceTitle, imported]) => {
    const sourceKey = normalizeStudyTitle(sourceTitle);
    const topic = items.find(item => {
      if (!isTopic(item)) return false;
      const itemKey = normalizeStudyTitle(item.title);
      return itemKey === sourceKey || itemKey.startsWith(sourceKey) || sourceKey.startsWith(itemKey);
    });
    if (!topic) return;
    const categories = imported.category.split(",").map(value => value.trim()).filter(Boolean);
    topic.note = imported.note;
    topic.collection = categories[0] || topic.collection;
    topic.tags = [...new Set([...(topic.tags || []), ...categories])];
    topic.abstract = `${topic.collection}에 관한 개념, 수식, 구현 내용을 정리한 학습 노트입니다.`;
    topic.updatedAt = new Date().toISOString();
  });
  return items;
}

function applyImportedPaperNotes(items) {
  if (typeof importedPaperNotes === "undefined") return items;
  const lookup = new Map();
  items.forEach(item => { if (!isTopic(item)) lookup.set(normalizeStudyTitle(item.title), item); });
  Object.entries(importedPaperNotes).forEach(([title, imported]) => {
    const target = items.find(item => !isTopic(item) && item.title === title)
      || lookup.get(normalizeStudyTitle(title));
    if (!target) return;
    target.note = imported.note;
    if (imported.status) target.status = imported.status;
    target.updatedAt = new Date().toISOString();
  });
  return items;
}

let papers = loadPapers();
let state = {
  view: "home", status: "all", collection: "all", search: "", layout: "table", currentId: null,
  sortRules: [{ key: "updated", direction: "desc" }]
};
let saveTimer;
let mathTimer;
let mathQueue = Promise.resolve();
let mathRetryCount = 0;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const statusNames = { "not-yet": "Not Yet", "on-going": "On-Going", "done": "Done" };
const CATEGORY_PALETTE = ["#b45a41","#6c7f66","#78809b","#a98655","#826c82","#5e8a7a","#7a6c4f","#6b7a8d","#8f6b44","#5e6a7a"];
const colors = CATEGORY_PALETTE;
function categoryColor(name) {
  if (!name) return CATEGORY_PALETTE[0];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0x7fffffff;
  return CATEGORY_PALETTE[h % CATEGORY_PALETTE.length];
}
const sortFields = [
  ["category", "카테고리"], ["year", "발행 연도"], ["authors", "저자"],
  ["title", "제목"], ["venue", "발표처"], ["updated", "최근 수정"], ["status", "진행 상태"]
];

function loadPapers() {
  try {
    let current;
    if (!localStorage.getItem(CATALOG_VERSION_KEY)) {
      current = buildCuratedCatalog();
      localStorage.setItem(CATALOG_VERSION_KEY, "applied");
    } else {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      current = Array.isArray(saved) ? saved : buildCuratedCatalog();
    }
    if (!localStorage.getItem(TOPIC_CATALOG_KEY)) {
      current = [...current, ...buildStudyTopics()];
      localStorage.setItem(TOPIC_CATALOG_KEY, "applied");
    }
    if (!localStorage.getItem(STUDY_CONTENT_KEY)) {
      current = applyImportedStudyNotes(current);
      localStorage.setItem(STUDY_CONTENT_KEY, "applied");
    }
    if (!localStorage.getItem(PAPER_CONTENT_KEY)) {
      current = applyImportedPaperNotes(current);
      localStorage.setItem(PAPER_CONTENT_KEY, "applied");
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    return current;
  } catch { return [...buildCuratedCatalog(), ...buildStudyTopics()]; }
}

function isTopic(item) { return item?.type === "topic"; }
function statusName(item) {
  return statusNames[item.status] || "—";
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(papers));
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}

function slugify(value) {
  const base = value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9가-힣]+/g, "-").replace(/^-|-$/g, "");
  let slug = base || `paper-${Date.now()}`;
  if (papers.some(p => p.id === slug)) slug += `-${Date.now().toString().slice(-5)}`;
  return slug;
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1800);
}

function render() {
  renderSidebar();
  renderFilters();
  renderSortControls();
  renderPapers();
  renderDashboard();
}

function renderSortControls() {
  const rules = state.sortRules;
  $("#sort-summary").textContent = rules.length
    ? rules.map(rule => sortFields.find(([key]) => key === rule.key)?.[1]).join(" → ")
    : "정렬 없음";
  $("#sort-rules").innerHTML = rules.map((rule, index) => {
    const usedByOthers = new Set(rules.filter((_, i) => i !== index).map(item => item.key));
    const options = sortFields.filter(([key]) => !usedByOthers.has(key)).map(([key, label]) => `<option value="${key}" ${rule.key === key ? "selected" : ""}>${label}</option>`).join("");
    return `<div class="sort-rule" data-sort-index="${index}">
      <span class="sort-rank">${index + 1}</span>
      <select class="sort-field" aria-label="${index + 1}순위 정렬 기준">${options}</select>
      <select class="sort-direction" aria-label="정렬 방향">
        <option value="asc" ${rule.direction === "asc" ? "selected" : ""}>오름차순 ↑</option>
        <option value="desc" ${rule.direction === "desc" ? "selected" : ""}>내림차순 ↓</option>
      </select>
      <button class="sort-move" data-sort-move="up" ${index === 0 ? "disabled" : ""} aria-label="우선순위 올리기">↑</button>
      <button class="sort-move" data-sort-move="down" ${index === rules.length - 1 ? "disabled" : ""} aria-label="우선순위 내리기">↓</button>
      <button class="sort-remove" data-sort-remove aria-label="정렬 기준 삭제">×</button>
    </div>`;
  }).join("");
  $$(".sort-rule").forEach(row => {
    const index = Number(row.dataset.sortIndex);
    row.querySelector(".sort-field").addEventListener("change", event => {
      state.sortRules[index].key = event.target.value;
      state.sortRules[index].direction = ["year", "updated"].includes(event.target.value) ? "desc" : "asc";
      renderSortControls(); renderPapers();
    });
    row.querySelector(".sort-direction").addEventListener("change", event => { state.sortRules[index].direction = event.target.value; renderPapers(); });
    row.querySelectorAll("[data-sort-move]").forEach(button => button.addEventListener("click", () => {
      const target = button.dataset.sortMove === "up" ? index - 1 : index + 1;
      [state.sortRules[index], state.sortRules[target]] = [state.sortRules[target], state.sortRules[index]];
      renderSortControls(); renderPapers();
    }));
    row.querySelector("[data-sort-remove]").addEventListener("click", () => {
      state.sortRules.splice(index, 1); renderSortControls(); renderPapers();
    });
  });
  $("#add-sort-rule").disabled = rules.length >= sortFields.length;
}

function renderDashboard() {
  const paperItems = papers.filter(p => !isTopic(p));
  const topicItems = papers.filter(isTopic);
  const read = papers.filter(p => p.status === "done").length;
  const reading = papers.filter(p => p.status === "on-going").length;
  const categories = new Set(papers.map(p => p.collection).filter(Boolean)).size;
  const mentions = papers.reduce((sum, p) => sum + ((p.note || "").match(/\[\[[^\]]+\]\]/g) || []).length, 0);
  const stats = [[paperItems.length, "논문"], [topicItems.length, "학습 주제"], [reading, "진행 중"], [mentions, "노트 연결"]];
  $("#stats-row").innerHTML = stats.map(([value, label]) => `<div class="stat-item"><strong class="stat-value">${value}</strong><span class="stat-label">${label}</span></div>`).join("");

  const featured = papers.filter(p => p.status === "on-going").slice(0, 2);
  const fallback = papers.filter(p => p.status !== "done").slice(0, 2);
  const shown = featured.length ? featured : fallback;
  $("#featured-papers").innerHTML = shown.length ? shown.map((paper, index) => `
    <article class="featured-card" data-dashboard-paper="${paper.id}">
      <div class="progress-rail" style="--progress:${paper.status === "on-going" ? 55 + index * 15 : 15}%"></div>
      <div><div class="featured-meta"><span>${escapeHtml(paper.collection || "Unsorted")}</span><span>${paper.year || "—"}</span></div>
      <h3>${escapeHtml(paper.title)}</h3><p>${escapeHtml(paper.authors || "저자 미상")} · ${escapeHtml(paper.venue || "출간처 미상")}</p></div>
    </article>`).join("") : `<p class="no-backlinks">읽을 예정인 논문을 추가해 보세요.</p>`;

  const recent = [...papers].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 4);
  $("#recent-list").innerHTML = recent.map(paper => {
    const date = new Date(paper.updatedAt);
    const label = Number.isNaN(date.getTime()) ? "—" : `${date.getMonth() + 1}.${String(date.getDate()).padStart(2, "0")}`;
    return `<button class="recent-item" data-dashboard-paper="${paper.id}"><span class="recent-date">${label}</span><span><strong>${escapeHtml(paper.title)}</strong><small>${escapeHtml(paper.venue || paper.collection || "미분류")}</small></span></button>`;
  }).join("");

  const categoryCounts = papers.reduce((acc, paper) => { const key = paper.collection || "Unsorted"; acc[key] = (acc[key] || 0) + 1; return acc; }, {});
  const max = Math.max(...Object.values(categoryCounts), 1);
  $("#category-overview-list").innerHTML = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).map(([name, count]) => `
    <div class="category-line" data-dashboard-category="${escapeHtml(name)}"><div class="category-line-heading"><span>${escapeHtml(name)}</span><span>${count}</span></div><div class="category-bar"><span style="--width:${count / max * 100}%;--bar-color:${categoryColor(name)}"></span></div></div>`).join("");

  $$('[data-dashboard-paper]').forEach(item => item.addEventListener("click", () => openPaper(item.dataset.dashboardPaper)));
  $$('[data-dashboard-category]').forEach(item => item.addEventListener("click", () => {
    state.collection = item.dataset.dashboardCategory;
    state.view = papers.some(p => isTopic(p) && p.collection === state.collection) ? "topics" : "library";
    setActiveNav(); showLibrary(); render();
  }));
}

function renderSidebar() {
  $("#library-count").textContent = papers.filter(p => !isTopic(p)).length;
  $("#topic-count").textContent = papers.filter(isTopic).length;
  const scopedItems = state.view === "topics" ? papers.filter(isTopic) : state.view === "library" ? papers.filter(p => !isTopic(p)) : papers;
  const counts = scopedItems.reduce((acc, paper) => {
    const name = paper.collection || "Unsorted";
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});
  $("#collection-list").innerHTML = Object.entries(counts).sort().map(([name, count]) => `
    <button class="collection-button ${state.collection === name ? "active" : ""}" data-collection="${escapeHtml(name)}" title="${escapeHtml(name)}">
      <span class="collection-dot" style="--dot:${categoryColor(name)}"></span>
      <span class="collection-name">${escapeHtml(name)}</span>
      <span class="collection-count">${count}</span>
    </button>`).join("");
  $$(".collection-button").forEach(button => button.addEventListener("click", () => {
    state.collection = state.collection === button.dataset.collection ? "all" : button.dataset.collection;
    if (state.view !== "topics") state.view = "library";
    setActiveNav();
    showLibrary();
    render();
  }));
}

function renderFilters() {
  const scoped = state.view === "topics" ? papers.filter(isTopic) : state.view === "favorites" ? papers : papers.filter(p => !isTopic(p));
  const filters = [
    ["all", "전체", scoped.length],
    ["not-yet", "Not Yet", scoped.filter(p => p.status === "not-yet").length],
    ["on-going", "On-Going", scoped.filter(p => p.status === "on-going").length],
    ["done", "Done", scoped.filter(p => p.status === "done").length]
  ];
  $("#filter-chips").innerHTML = filters.map(([key, label, count]) => `<button class="filter-chip ${state.status === key ? "active" : ""}" data-status="${key}">${label}<span>${count}</span></button>`).join("");
  $$(".filter-chip").forEach(button => button.addEventListener("click", () => { state.status = button.dataset.status; render(); }));
}

function filteredPapers() {
  const query = state.search.trim().toLowerCase();
  return papers.filter(paper => {
    const matchesView = state.view === "topics" ? isTopic(paper) : state.view === "favorites" ? paper.favorite : !isTopic(paper);
    const matchesStatus = state.status === "all" || paper.status === state.status;
    const matchesCollection = state.collection === "all" || paper.collection === state.collection;
    const haystack = [paper.title, paper.authors, paper.collection, paper.venue, paper.doi, paper.abstract, ...(paper.tags || [])].join(" ").toLowerCase();
    return matchesView && matchesStatus && matchesCollection && (!query || haystack.includes(query));
  }).sort((a, b) => {
    const valueFor = (item, key) => ({
      category: item.collection,
      year: item.year,
      authors: item.authors,
      title: item.title,
      venue: item.venue,
      updated: new Date(item.updatedAt).getTime(),
      status: { "on-going": 1, "not-yet": 2, "done": 3 }[item.status]
    })[key];
    for (const rule of state.sortRules) {
      const aValue = valueFor(a, rule.key);
      const bValue = valueFor(b, rule.key);
      const aMissing = aValue === null || aValue === undefined || aValue === "" || Number.isNaN(aValue);
      const bMissing = bValue === null || bValue === undefined || bValue === "" || Number.isNaN(bValue);
      if (aMissing !== bMissing) return aMissing ? 1 : -1;
      if (aMissing) continue;
      const comparison = typeof aValue === "string"
        ? aValue.localeCompare(bValue, ["ko", "en"], { sensitivity: "base", numeric: true })
        : aValue - bValue;
      if (comparison !== 0) return rule.direction === "desc" ? -comparison : comparison;
    }
    return a.title.localeCompare(b.title, ["ko", "en"], { sensitivity: "base" });
  });
}

function renderPapers() {
  const visible = filteredPapers();
  const grid = $("#paper-grid");
  grid.className = `paper-grid ${state.layout}`;
  const cardMarkup = visible.map(paper => `
    <article class="paper-card" data-id="${paper.id}" tabindex="0">
      <div class="card-top">
        <span class="status-badge ${paper.status}">${statusName(paper)}</span>
        <button class="favorite-button ${paper.favorite ? "active" : ""}" data-favorite="${paper.id}" aria-label="즐겨찾기">${paper.favorite ? "★" : "☆"}</button>
      </div>
      <h2>${escapeHtml(paper.title)}</h2>
      <p class="card-authors">${isTopic(paper) ? `Study note · ${escapeHtml(paper.collection)}` : `${escapeHtml(paper.authors || "저자 미상")}${paper.venue ? ` · ${escapeHtml(paper.venue)}` : ""}`}</p>
      <p class="card-note">${escapeHtml(paper.abstract || paper.note || "아직 작성된 메모가 없습니다.")}</p>
      <footer class="card-footer">
        ${(paper.tags || []).slice(0, 3).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
        <span class="card-year">${isTopic(paper) ? "NOTE" : paper.year || "—"}</span>
      </footer>
    </article>`).join("");
  const topicTableMarkup = `
    <table class="paper-table">
      <thead><tr><th>학습 주제</th><th>카테고리</th><th>키워드</th><th>상태</th><th>최근 수정</th><th></th></tr></thead>
      <tbody>${visible.map(topic => `
        <tr class="paper-row" data-id="${topic.id}" tabindex="0">
          <td class="table-title">${escapeHtml(topic.title)}</td>
          <td><span class="cat-cell" style="--cat:${categoryColor(topic.collection)}">${escapeHtml(topic.collection || "—")}</span></td>
          <td><div class="table-keywords">${(topic.tags || []).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join("") || "—"}</div></td>
          <td><span class="status-badge ${topic.status}">${statusName(topic)}</span></td>
          <td>${new Date(topic.updatedAt).toLocaleDateString("ko-KR")}</td>
          <td><button class="favorite-button ${topic.favorite ? "active" : ""}" data-favorite="${topic.id}" aria-label="즐겨찾기">${topic.favorite ? "★" : "☆"}</button></td>
        </tr>`).join("")}
      </tbody>
    </table>`;
  const paperTableMarkup = `
    <table class="paper-table">
      <thead><tr><th>논문</th><th>저자</th><th>연도</th><th>발표처</th><th>카테고리</th><th>키워드</th><th>상태</th><th></th></tr></thead>
      <tbody>${visible.map(paper => `
        <tr class="paper-row" data-id="${paper.id}" tabindex="0">
          <td class="table-title">${escapeHtml(paper.title)}</td>
          <td class="table-authors" title="${escapeHtml(paper.authors || "")}">${escapeHtml(paper.authors || "—")}</td>
          <td>${paper.year || "—"}</td>
          <td>${escapeHtml(paper.venue || "—")}</td>
          <td><span class="cat-cell" style="--cat:${categoryColor(paper.collection)}">${escapeHtml(paper.collection || "—")}</span></td>
          <td><div class="table-keywords">${(paper.tags || []).slice(0, 2).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join("") || "—"}</div></td>
          <td><span class="status-badge ${paper.status}">${statusName(paper)}</span></td>
          <td><button class="favorite-button ${paper.favorite ? "active" : ""}" data-favorite="${paper.id}" aria-label="즐겨찾기">${paper.favorite ? "★" : "☆"}</button></td>
        </tr>`).join("")}
      </tbody>
    </table>`;
  grid.innerHTML = state.layout === "table" ? (state.view === "topics" ? topicTableMarkup : paperTableMarkup) : cardMarkup;
  $("#empty-state").hidden = visible.length > 0;

  $$(".paper-card, .paper-row").forEach(card => {
    card.addEventListener("click", event => { if (!event.target.closest("[data-favorite]")) openPaper(card.dataset.id); });
    card.addEventListener("keydown", event => { if (event.key === "Enter") openPaper(card.dataset.id); });
  });
  $$('[data-favorite]').forEach(button => button.addEventListener("click", () => toggleFavorite(button.dataset.favorite)));
}

function toggleFavorite(id) {
  const paper = papers.find(p => p.id === id);
  if (!paper) return;
  paper.favorite = !paper.favorite;
  paper.updatedAt = new Date().toISOString();
  persist();
  render();
  if (state.currentId === id && !$("#reader-view").hidden) renderReader(paper);
}

function showLibrary() {
  $("#dashboard-view").hidden = true;
  $("#library-view").hidden = false;
  $("#reader-view").hidden = true;
  history.replaceState(null, "", location.pathname);
  if (state.view === "topics") {
    $("#view-eyebrow").textContent = "Concepts & methods";
    $("#view-title").textContent = "Study notes";
    $("#view-subtitle").textContent = "";
  } else if (state.view === "favorites") {
    $("#view-eyebrow").textContent = "Saved for later";
    $("#view-title").textContent = "Favorites";
    $("#view-subtitle").textContent = "";
  } else {
    $("#view-eyebrow").textContent = state.collection === "all" ? "Your research space" : "Collection";
    $("#view-title").textContent = state.collection === "all" ? "Paper library" : state.collection;
    $("#view-subtitle").textContent = "";
  }
  const addingTopic = state.view === "topics";
  $("#add-paper-button").innerHTML = addingTopic ? "<span>＋</span> 새 학습 노트" : "<span>＋</span> 새 논문";
  $("#search-input").placeholder = addingTopic ? "학습 주제, 카테고리, 키워드 검색..." : "논문, 저자, 태그 검색...";
  $("#empty-state h2").textContent = addingTopic ? "찾은 학습 주제가 없습니다" : "찾은 논문이 없습니다";
}

function showHome() {
  state.view = "home";
  $("#dashboard-view").hidden = false;
  $("#library-view").hidden = true;
  $("#reader-view").hidden = true;
  history.replaceState(null, "", location.pathname);
  setActiveNav();
  renderDashboard();
  window.scrollTo(0, 0);
}

function openPaper(id) {
  const paper = papers.find(p => p.id === id);
  if (!paper) return;
  state.view = isTopic(paper) ? "topics" : "library";
  setActiveNav();
  state.currentId = id;
  $("#dashboard-view").hidden = true;
  $("#library-view").hidden = true;
  $("#reader-view").hidden = false;
  history.replaceState(null, "", `#paper=${encodeURIComponent(id)}`);
  renderReader(paper);
  window.scrollTo(0, 0);
}

function renderReader(paper) {
  $("#back-button").textContent = isTopic(paper) ? "← Study Notes" : "← Library";
  $("#mentions-title").textContent = isTopic(paper) ? "이 주제를 언급한 노트" : "이 논문을 언급한 노트";
  $("#delete-paper-button").textContent = isTopic(paper) ? "이 학습 노트 삭제" : "이 논문 삭제";
  $("#reader-meta").innerHTML = `<span>${isTopic(paper) ? "Study note" : escapeHtml(paper.collection || "Unsorted")}</span><span>·</span><span>${statusName(paper)}</span>`;
  $("#reader-title").textContent = paper.title;
  $("#reader-authors").textContent = isTopic(paper) ? `${paper.collection} · ${(paper.tags || []).join(" · ")}` : paper.authors || "저자 미상";
  $("#reader-abstract").textContent = paper.abstract || (isTopic(paper) ? "이 주제의 정의와 학습 목표를 기록해 보세요." : "아직 작성된 요약이 없습니다.");
  const link = $("#paper-link");
  link.href = paper.url || "#";
  link.style.display = !isTopic(paper) && paper.url ? "inline-flex" : "none";
  $("#reader-favorite").textContent = paper.favorite ? "★" : "☆";
  $("#reader-favorite").classList.toggle("active", paper.favorite);
  $("#note-editor").value = paper.note || "";
  $("#note-editor").placeholder = isTopic(paper)
    ? "# 핵심 정의\n\n## 왜 필요한가\n이 개념이 해결하는 문제를 기록하세요.\n\n## 핵심 원리\n수식, 직관, 예제를 정리하세요.\n\n다른 항목은 [[제목]]처럼 연결할 수 있습니다."
    : "# 한 줄 요약\n\n## 핵심 아이디어\n논문의 주장과 실험 결과를 기록하세요.\n\n다른 논문은 [[논문 제목]]처럼 연결할 수 있습니다.";
  $("#note-editor-wrap").hidden = true;
  $("#note-preview").hidden = false;
  $("#edit-note-button").textContent = "노트 편집";
  renderNotePreview(paper.note || "");
  $("#paper-details").innerHTML = isTopic(paper) ? `
    <div class="detail-row"><dt>Type</dt><dd>Study note</dd></div>
    <div class="detail-row"><dt>Category</dt><dd>${escapeHtml(paper.collection || "Unsorted")}</dd></div>
    <div class="detail-row"><dt>Status</dt><dd>${statusName(paper)}</dd></div>
    <div class="detail-row"><dt>Keywords</dt><dd>${(paper.tags || []).map(escapeHtml).join(", ") || "—"}</dd></div>` : `
    <div class="detail-row"><dt>Year</dt><dd>${paper.year || "—"}</dd></div>
    <div class="detail-row"><dt>Venue</dt><dd>${escapeHtml(paper.venue || "—")}</dd></div>
    <div class="detail-row"><dt>Category</dt><dd>${escapeHtml(paper.collection || "Unsorted")}</dd></div>
    <div class="detail-row"><dt>Status</dt><dd>${statusName(paper)}</dd></div>
    <div class="detail-row"><dt>Keywords</dt><dd>${(paper.tags || []).map(escapeHtml).join(", ") || "—"}</dd></div>
    <div class="detail-row"><dt>Identifier</dt><dd>${escapeHtml(paper.doi || "—")}</dd></div>`;
  renderBacklinks(paper);
}

function renderNotePreview(note) {
  const preview = $("#note-preview");
  if (window.MathJax?.typesetClear) window.MathJax.typesetClear([preview]);
  const renderInline = value => {
    const tokens = [];
    const reserve = html => { const token = `\uE000${tokens.length}\uE001`; tokens.push(html); return token; };
    let source = String(value).replace(/`([^`]+)`/g, (_, code) => reserve(`<code class="inline-code">${escapeHtml(code)}</code>`));
    source = source.replace(/\[\[([^\]]+)\]\]/g, (_, title) => {
      const linked = papers.find(p => p.title.toLowerCase() === title.trim().toLowerCase());
      return reserve(linked
        ? `<button class="paper-mention" data-mention="${linked.id}">${escapeHtml(title)}</button>`
        : `<span class="paper-mention">${escapeHtml(title)} · 찾을 수 없음</span>`);
    });
    source = source.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, (_, label, url) => reserve(
      `<a class="note-link" href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(label)} ↗</a>`
    ));
    source = source.replace(/(^|\s)(https?:\/\/[^\s<]+)/g, (_, prefix, url) => `${prefix}${reserve(
      `<a class="note-link" href="${escapeHtml(url)}" target="_blank" rel="noreferrer">원문 열기 ↗</a>`
    )}`);
    let html = escapeHtml(source).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    tokens.forEach((token, index) => { html = html.replace(`\uE000${index}\uE001`, token); });
    return html;
  };
  const codeMarkup = (lines, language) => {
    const safeLanguage = (language || "text").replace(/[^a-zA-Z0-9_+#.-]/g, "") || "text";
    return `<div class="code-block"><div class="code-header"><span>${escapeHtml(safeLanguage)}</span><button class="copy-code" type="button">복사</button></div><pre><code class="language-${escapeHtml(safeLanguage)}">${escapeHtml(lines.join("\n"))}</code></pre></div>`;
  };
  const imageMarkup = line => {
    const match = line.match(/^!\[([^\]]*)\]\((.+)\)$/);
    if (!match) return null;
    const alt = match[1].trim();
    const url = match[2].trim().replace(/^<|>$/g, "");
    if (!/^(https?:\/\/|\.\.?\/|\/)/i.test(url)) return `<p class="image-error">지원하지 않는 이미지 주소입니다: ${escapeHtml(url)}</p>`;
    return `<figure class="note-image"><img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" loading="lazy" referrerpolicy="no-referrer">${alt ? `<figcaption>${escapeHtml(alt)}</figcaption>` : ""}</figure>`;
  };
  if (!note.trim()) {
    preview.innerHTML = `<div class="empty-note">아직 작성한 노트가 없습니다.<br>핵심 아이디어와 내 생각을 기록해 보세요.</div>`;
    $("#toc-card").hidden = true;
    return;
  }
  const lines = note.split("\n");
  // Parse into a real block tree so lists nest by indentation and ":"/"⇒"
  // detail lines become children of their parent list item.
  const root = [];
  let containers = [root];
  const levelOf = raw => Math.floor(raw.match(/^\s*/)[0].replace(/\t/g, "    ").length / 4);
  const placeBlock = (level, node) => {
    const depth = Math.min(level, containers.length - 1);
    containers[depth].push(node);
    containers.length = depth + 1;
  };
  const addItem = (level, ordered, text) => {
    const depth = Math.min(level, containers.length - 1);
    const container = containers[depth];
    let last = container[container.length - 1];
    if (!last || last.t !== "list" || last.ordered !== ordered) {
      last = { t: "list", ordered, items: [] };
      container.push(last);
    }
    const item = { text, children: [] };
    last.items.push(item);
    containers.length = depth + 1;
    containers[depth + 1] = item.children;
  };
  let inCode = false, codeLanguage = "", codeLines = [], codeLevel = 0;
  for (let index = 0; index < lines.length; index++) {
    const raw = lines[index];
    const line = raw.trim();
    const fence = line.match(/^```\s*([^`]*)$/);
    if (inCode) {
      if (fence) { placeBlock(codeLevel, { t: "code", lang: codeLanguage, lines: codeLines }); inCode = false; codeLines = []; codeLanguage = ""; }
      else codeLines.push(raw);
      continue;
    }
    if (fence) { inCode = true; codeLanguage = fence[1].trim(); codeLevel = levelOf(raw); continue; }
    if (!line) continue;
    const level = levelOf(raw);
    if (line === "$$" || line === "\\[") {
      const closing = line === "$$" ? "$$" : "\\]";
      const equation = [];
      while (++index < lines.length && lines[index].trim() !== closing) equation.push(lines[index]);
      placeBlock(level, { t: "math", tex: `${line}${escapeHtml(equation.join("\n"))}${closing}` });
      continue;
    }
    // Markdown table: collect all consecutive | lines, confirm separator on row 2
    if (line.startsWith("|")) {
      const tableLines = [line];
      while (index + 1 < lines.length && lines[index + 1].trim().startsWith("|")) tableLines.push(lines[++index].trim());
      if (tableLines.length >= 2 && /^\|[-:| ]+\|$/.test(tableLines[1])) {
        const sepCells = tableLines[1].split("|").slice(1, -1).map(c => c.trim());
        const aligns = sepCells.map(c => c.startsWith(":") && c.endsWith(":") ? "center" : c.endsWith(":") ? "right" : "left");
        const parseRow = row => row.split("|").slice(1, -1).map(c => c.trim());
        placeBlock(level, { t: "table", headers: parseRow(tableLines[0]), aligns, rows: tableLines.slice(2).map(parseRow) });
      } else {
        tableLines.forEach(tl => placeBlock(level, { t: "para", variant: "", text: tl }));
      }
      continue;
    }
    const image = imageMarkup(line);
    if (image) { placeBlock(level, { t: "image", html: image }); continue; }
    if ((line.match(/\$/g) || []).length === 2 && /^\$[^$]+\$$/.test(line)) {
      placeBlock(level, { t: "math", tex: `$$${escapeHtml(line.slice(1, -1))}$$` }); continue;
    }
    const unordered = line.match(/^[-*]\s+(.+)$/);
    const ordered = line.match(/^\d+[.)]\s+(.+)$/);
    if (unordered || ordered) { addItem(level, !!ordered, (unordered || ordered)[1]); continue; }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) { placeBlock(0, { t: "hr" }); continue; }
    if (line.startsWith("#### ")) { placeBlock(0, { t: "heading", level: 4, text: line.slice(5) }); continue; }
    if (line.startsWith("### ")) { placeBlock(0, { t: "heading", level: 3, text: line.slice(4) }); continue; }
    if (line.startsWith("## ")) { placeBlock(0, { t: "heading", level: 2, text: line.slice(3) }); continue; }
    if (line.startsWith("# ")) { placeBlock(0, { t: "heading", level: 1, text: line.slice(2) }); continue; }
    if (line.startsWith("> ")) { placeBlock(level, { t: "quote", text: line.slice(2) }); continue; }
    if (line.startsWith("⇒")) { placeBlock(level, { t: "para", variant: "consequence", text: line.replace(/^⇒\s*/, "") }); continue; }
    if (/^:\s/.test(line) || line === ":") { placeBlock(level, { t: "para", variant: "definition", text: line.replace(/^:\s*/, "") }); continue; }
    placeBlock(level, { t: "para", variant: "", text: line });
  }
  if (inCode) placeBlock(codeLevel, { t: "code", lang: codeLanguage, lines: codeLines });

  const renderBlocks = nodes => nodes.map(node => {
    if (node.t === "heading") return `<h${node.level}>${renderInline(node.text)}</h${node.level}>`;
    if (node.t === "hr") return "<hr>";
    if (node.t === "image") return node.html;
    if (node.t === "math") return `<div class="math-block">${node.tex}</div>`;
    if (node.t === "code") return codeMarkup(node.lines, node.lang);
    if (node.t === "quote") return `<blockquote><p>${renderInline(node.text)}</p></blockquote>`;
    if (node.t === "table") {
      const th = node.headers.map((h, i) => `<th style="text-align:${node.aligns[i]}">${renderInline(h)}</th>`).join("");
      const tb = node.rows.map(row => `<tr>${row.map((cell, i) => `<td style="text-align:${node.aligns[i] || "left"}">${renderInline(cell)}</td>`).join("")}</tr>`).join("");
      return `<div class="table-wrap"><table class="note-table"><thead><tr>${th}</tr></thead><tbody>${tb}</tbody></table></div>`;
    }
    if (node.t === "list") {
      const tag = node.ordered ? "ol" : "ul";
      return `<${tag}>${node.items.map(item => `<li>${renderInline(item.text)}${renderBlocks(item.children)}</li>`).join("")}</${tag}>`;
    }
    const variantClass = node.variant ? ` class="${node.variant}"` : "";
    return `<p${variantClass}>${renderInline(node.text)}</p>`;
  }).join("");
  preview.innerHTML = renderBlocks(root);
  renderNoteToc(preview);
  $$('[data-mention]').forEach(button => button.addEventListener("click", () => openPaper(button.dataset.mention)));
  $$(".copy-code").forEach(button => button.addEventListener("click", async () => {
    const code = button.closest(".code-block").querySelector("code").textContent;
    try { await navigator.clipboard.writeText(code); button.textContent = "복사됨"; setTimeout(() => { button.textContent = "복사"; }, 1200); }
    catch { showToast("코드를 복사하지 못했습니다."); }
  }));
  scheduleMathTypeset();
}

function renderNoteToc(preview) {
  const headings = [...preview.querySelectorAll("h1, h2, h3, h4")];
  $("#toc-card").hidden = headings.length === 0;
  $("#note-toc").innerHTML = headings.map((heading, index) => {
    const id = `note-section-${index + 1}`;
    heading.id = id;
    const level = Number(heading.tagName.slice(1));
    return `<button class="toc-link level-${level}" data-toc-target="${id}">${escapeHtml(heading.textContent)}</button>`;
  }).join("");
  $$('[data-toc-target]').forEach(button => button.addEventListener("click", () => {
    document.getElementById(button.dataset.tocTarget)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }));
}

function scheduleMathTypeset() {
  clearTimeout(mathTimer);
  mathTimer = setTimeout(() => {
    if (!window.MathJax?.typesetPromise) {
      if (mathRetryCount++ < 15) scheduleMathTypeset();
      return;
    }
    mathRetryCount = 0;
    const preview = $("#note-preview");
    mathQueue = mathQueue.catch(() => {}).then(() => window.MathJax.typesetPromise([preview])).catch(() => showToast("수식 렌더링 중 오류가 발생했습니다."));
  }, 120);
}

function renderBacklinks(target) {
  const backlinks = papers.filter(p => p.id !== target.id && (p.note || "").toLowerCase().includes(`[[${target.title.toLowerCase()}]]`));
  $("#backlinks").innerHTML = backlinks.length ? backlinks.map(p => `<button class="backlink" data-backlink="${p.id}"><strong>${escapeHtml(p.title)}</strong><span>${isTopic(p) ? "학습 노트" : p.year || "연도 미상"} · 노트에서 언급</span></button>`).join("") : `<p class="no-backlinks">아직 이 항목을 언급한 노트가 없습니다.</p>`;
  $$('[data-backlink]').forEach(button => button.addEventListener("click", () => openPaper(button.dataset.backlink)));
}

function openDialog(paper = null) {
  const type = paper?.type || (state.view === "topics" ? "topic" : "paper");
  const topicMode = type === "topic";
  $("#paper-form").reset();
  $("#paper-id").value = paper?.id || "";
  $("#content-type").value = type;
  $("#dialog-title").textContent = paper ? (topicMode ? "학습 주제 수정" : "논문 정보 수정") : (topicMode ? "새 학습 노트" : "새 논문 추가");
  $("#title-field-label").textContent = topicMode ? "학습 주제" : "논문 제목";
  $("#paper-title-input").placeholder = topicMode ? "예: Bayesian Inference" : "Attention Is All You Need";
  $$(".paper-only").forEach(field => field.hidden = topicMode);
  // status labels are always English; no need to change per mode
  if (paper) {
    $("#paper-title-input").value = paper.title;
    $("#paper-authors-input").value = paper.authors || "";
    $("#paper-year-input").value = paper.year || "";
    $("#paper-venue-input").value = paper.venue || "";
    $("#paper-doi-input").value = paper.doi || "";
    $("#paper-collection-input").value = paper.collection || "";
    $("#paper-status-input").value = paper.status || "not-yet";
    $("#paper-tags-input").value = (paper.tags || []).join(", ");
    $("#paper-url-input").value = paper.url || "";
    $("#paper-abstract-input").value = paper.abstract || "";
  }
  $("#paper-dialog").showModal();
  setTimeout(() => $("#paper-title-input").focus(), 50);
}

function saveForm(event) {
  event.preventDefault();
  const existingId = $("#paper-id").value;
  const existing = papers.find(p => p.id === existingId);
  const type = existing?.type || $("#content-type").value || "paper";
  const title = $("#paper-title-input").value.trim();
  const data = {
    id: existing?.id || slugify(title), type, title,
    authors: $("#paper-authors-input").value.trim(),
    year: Number($("#paper-year-input").value) || null,
    venue: $("#paper-venue-input").value.trim(),
    doi: $("#paper-doi-input").value.trim(),
    collection: $("#paper-collection-input").value.trim() || "Unsorted",
    status: $("#paper-status-input").value,
    tags: $("#paper-tags-input").value.split(",").map(tag => tag.trim()).filter(Boolean),
    url: $("#paper-url-input").value.trim(),
    abstract: $("#paper-abstract-input").value.trim(),
    note: existing?.note || "", favorite: existing?.favorite || false,
    updatedAt: new Date().toISOString()
  };
  if (existing) Object.assign(existing, data); else papers.unshift(data);
  persist();
  $("#paper-dialog").close();
  render();
  showToast(existing ? "정보를 수정했습니다." : (type === "topic" ? "새 학습 노트를 추가했습니다." : "새 논문을 추가했습니다."));
  if (existing) openPaper(existing.id); else openPaper(data.id);
}

function exportData() {
  const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), papers }, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `paper-notes-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
  showToast("노트 데이터를 내보냈습니다.");
}

async function importData(file) {
  try {
    const data = JSON.parse(await file.text());
    const imported = Array.isArray(data) ? data : data.papers;
    if (!Array.isArray(imported) || imported.some(p => !p.id || !p.title)) throw new Error("invalid");
    if (!confirm(`현재 데이터를 바꾸고 ${imported.length}개의 항목을 가져올까요?`)) return;
    papers = imported;
    persist(); render(); showLibrary();
    showToast("데이터를 가져왔습니다.");
  } catch { alert("올바른 Paper Notes JSON 파일이 아닙니다."); }
}

function setActiveNav() {
  $$(".nav-item").forEach(item => item.classList.toggle("active", item.dataset.view === state.view));
}

$("#add-paper-button").addEventListener("click", () => openDialog());
$("#hero-add-button").addEventListener("click", () => openDialog());
$(".brand").addEventListener("click", event => { event.preventDefault(); showHome(); });
$$('[data-go-library]').forEach(button => button.addEventListener("click", () => { state.view = "library"; setActiveNav(); showLibrary(); render(); }));
$("#edit-paper-button").addEventListener("click", () => openDialog(papers.find(p => p.id === state.currentId)));
$("#dialog-close").addEventListener("click", () => $("#paper-dialog").close());
$("#dialog-cancel").addEventListener("click", () => $("#paper-dialog").close());
$("#paper-form").addEventListener("submit", saveForm);
$("#back-button").addEventListener("click", () => { showLibrary(); render(); });
$("#reader-favorite").addEventListener("click", () => toggleFavorite(state.currentId));
$("#edit-note-button").addEventListener("click", () => {
  const editing = !$("#note-editor-wrap").hidden;
  $("#note-editor-wrap").hidden = editing;
  $("#note-preview").hidden = !editing;
  $("#edit-note-button").textContent = editing ? "노트 편집" : "미리보기";
  if (!editing) $("#note-editor").focus();
});
$("#finish-note-button").addEventListener("click", () => {
  $("#note-editor-wrap").hidden = true;
  $("#note-preview").hidden = false;
  $("#edit-note-button").textContent = "노트 편집";
});
$("#insert-template-button").addEventListener("click", () => {
  const editor = $("#note-editor");
  const current = papers.find(p => p.id === state.currentId);
  const template = isTopic(current)
    ? "# 핵심 정의\n\n이 개념을 한 문장으로 설명합니다.\n\n## 왜 필요한가\n- 해결하려는 문제\n- 기존 접근의 한계\n\n## 핵심 원리\n- 주요 수식과 직관\n- 동작 과정\n\n## 간단한 예제\n- 직접 계산하거나 구현한 예제\n\n## 관련 개념\n- [[관련 학습 주제]]\n\n## 헷갈리는 점\n- 추가로 확인할 질문\n"
    : "# 한 줄 요약\n\n이 논문의 핵심을 한 문장으로 정리합니다.\n\n## 연구 질문\n- 저자가 해결하려는 문제\n\n## 핵심 아이디어\n- 가장 중요한 주장과 기여\n\n## 방법론\n- 데이터셋, 모델, 실험 설계\n\n## 주요 결과\n- 정량적·정성적 결과\n\n## 한계와 질문\n- 논문의 한계\n- 더 확인할 점\n\n## 내 연구와의 연결\n- [[관련 논문 제목]]\n";
  if (editor.value.trim() && !confirm("현재 노트를 템플릿으로 바꿀까요?")) return;
  editor.value = template;
  editor.dispatchEvent(new Event("input"));
  editor.focus();
});
$("#delete-paper-button").addEventListener("click", () => {
  const paper = papers.find(p => p.id === state.currentId);
  if (paper && confirm(`“${paper.title}”을(를) 삭제할까요?`)) {
    papers = papers.filter(p => p.id !== paper.id); persist(); showLibrary(); render(); showToast(isTopic(paper) ? "학습 노트를 삭제했습니다." : "논문을 삭제했습니다.");
  }
});
$("#note-editor").addEventListener("input", event => {
  const paper = papers.find(p => p.id === state.currentId);
  if (!paper) return;
  paper.note = event.target.value; paper.updatedAt = new Date().toISOString();
  $("#save-status").textContent = "저장 중…";
  renderNotePreview(paper.note);
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { persist(); $("#save-status").textContent = "저장됨"; renderBacklinks(paper); }, 450);
});
$("#search-input").addEventListener("input", event => {
  state.search = event.target.value;
  if (state.view === "home" && state.search) { state.view = "library"; setActiveNav(); showLibrary(); }
  renderPapers();
});
$("#sort-trigger").addEventListener("click", event => {
  event.stopPropagation();
  const panel = $("#sort-panel");
  panel.hidden = !panel.hidden;
  $("#sort-trigger").setAttribute("aria-expanded", String(!panel.hidden));
});
$("#sort-panel").addEventListener("click", event => event.stopPropagation());
$("#add-sort-rule").addEventListener("click", () => {
  const used = new Set(state.sortRules.map(rule => rule.key));
  const next = sortFields.find(([key]) => !used.has(key));
  if (!next) return;
  state.sortRules.push({ key: next[0], direction: ["year", "updated"].includes(next[0]) ? "desc" : "asc" });
  renderSortControls(); renderPapers();
});
$("#reset-sort-rules").addEventListener("click", () => {
  state.sortRules = [{ key: "updated", direction: "desc" }];
  renderSortControls(); renderPapers();
});
$$(".view-toggle button").forEach(button => button.addEventListener("click", () => {
  state.layout = button.dataset.layout;
  $$(".view-toggle button").forEach(b => b.classList.toggle("active", b === button));
  renderPapers();
}));
$$(".nav-item").forEach(item => item.addEventListener("click", () => {
  state.view = item.dataset.view; state.collection = "all"; setActiveNav();
  if (state.view === "home") showHome(); else { showLibrary(); render(); }
  $(".sidebar").classList.remove("open");
}));
function toggleSidebar() {
  if (window.innerWidth <= 760) {
    $(".sidebar").classList.toggle("open");
  } else {
    const collapsed = $(".app-shell").classList.toggle("sidebar-collapsed");
    localStorage.setItem("sidebar-pref", collapsed ? "collapsed" : "open");
  }
}
$("#mobile-menu").addEventListener("click", toggleSidebar);
$("#sidebar-close").addEventListener("click", () => {
  if (window.innerWidth <= 760) $(".sidebar").classList.remove("open");
  else toggleSidebar();
});
if (localStorage.getItem("sidebar-pref") === "collapsed") $(".app-shell").classList.add("sidebar-collapsed");

function toggleAside() {
  const layout = $("#reader-layout");
  const collapsed = layout.classList.toggle("aside-collapsed");
  localStorage.setItem("aside-pref", collapsed ? "collapsed" : "open");
}
$("#aside-toggle").addEventListener("click", toggleAside);
$("#aside-reopen").addEventListener("click", toggleAside);
if (localStorage.getItem("aside-pref") === "collapsed") $("#reader-layout").classList.add("aside-collapsed");
$("#export-button").addEventListener("click", exportData);
$("#import-button").addEventListener("click", () => $("#import-input").click());
$("#import-input").addEventListener("change", event => { if (event.target.files[0]) importData(event.target.files[0]); event.target.value = ""; });
document.addEventListener("keydown", event => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); $("#search-input").focus(); }
  if (event.key === "Escape") $(".sidebar").classList.remove("open");
});
document.addEventListener("click", () => {
  $("#sort-panel").hidden = true;
  $("#sort-trigger").setAttribute("aria-expanded", "false");
});

render();
const initialId = new URLSearchParams(location.hash.replace(/^#/, "")).get("paper");
if (initialId && papers.some(p => p.id === initialId)) openPaper(initialId); else showHome();
