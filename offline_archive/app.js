(() => {
  "use strict";

  const archiveElement = document.getElementById("archive-data");
  const archive = JSON.parse(archiveElement.textContent);
  const rows = archive.sheets.flatMap((sheet) => sheet.rows);
  const storageKey = "striver-revision-ledger-progress-v1";
  const sectionColors = ["#2864dc", "#16805f", "#8a55ad", "#a85a14", "#1b7c91", "#b64040"];

  const elements = {
    list: document.getElementById("problem-list"),
    empty: document.getElementById("empty-state"),
    search: document.getElementById("search-input"),
    difficulty: document.getElementById("difficulty-filter"),
    platform: document.getElementById("platform-filter"),
    video: document.getElementById("video-filter"),
    status: document.getElementById("status-filter"),
    visibleCount: document.getElementById("visible-count"),
    visibleDone: document.getElementById("visible-done"),
    visibleReview: document.getElementById("visible-review"),
    resultContext: document.getElementById("result-context"),
    overallPercent: document.getElementById("overall-percent"),
    overallProgress: document.getElementById("overall-progress"),
    sdeDone: document.getElementById("sde-done"),
    a2zDone: document.getElementById("a2z-done"),
    sdeProgress: document.getElementById("sde-progress"),
    a2zProgress: document.getElementById("a2z-progress"),
    importFile: document.getElementById("import-file"),
    toast: document.getElementById("toast"),
  };

  const state = {
    sheet: "ALL",
    search: "",
    difficulty: "ALL",
    platform: "ALL",
    video: "ALL",
    status: "ALL",
    progress: loadProgress(),
  };

  let toastTimer = 0;

  rows.forEach((row) => {
    row._key = `${row.sheet}:${row.problem_id}`;
    row._search = normalize([
      row.problem_name,
      row.problem_id,
      row.section_name,
      row.subtopic_name,
      row.difficulty,
      row.platform,
      row.sheet,
    ].join(" "));
  });

  function normalize(value) {
    return String(value || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function trustedUrl(value) {
    if (!value) return "";
    try {
      const url = new URL(value);
      return url.protocol === "https:" ? url.href : "";
    } catch {
      return "";
    }
  }

  function loadProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
      return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
    } catch {
      return {};
    }
  }

  function saveProgress() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state.progress));
      return true;
    } catch {
      showToast("Progress could not be saved in this browser. Export it after this session.");
      return false;
    }
  }

  function entryFor(row) {
    return state.progress[row._key] || { done: false, review: false };
  }

  function filtersAreActive() {
    return Boolean(
      state.search
      || state.sheet !== "ALL"
      || state.difficulty !== "ALL"
      || state.platform !== "ALL"
      || state.video !== "ALL"
      || state.status !== "ALL"
    );
  }

  function filteredRows() {
    const searchTerms = normalize(state.search).split(/\s+/).filter(Boolean);
    return rows.filter((row) => {
      const progress = entryFor(row);
      if (state.sheet !== "ALL" && row.sheet !== state.sheet) return false;
      if (state.difficulty !== "ALL" && row.difficulty !== state.difficulty) return false;
      if (state.platform !== "ALL" && row.platform !== state.platform) return false;
      if (state.video === "WITH" && !row.youtube_url) return false;
      if (state.video === "WITHOUT" && row.youtube_url) return false;
      if (state.status === "DONE" && !progress.done) return false;
      if (state.status === "OPEN" && progress.done) return false;
      if (state.status === "REVIEW" && !progress.review) return false;
      return searchTerms.every((term) => row._search.includes(term));
    });
  }

  function groupRows(list) {
    const sheets = [];
    const sheetMap = new Map();

    list.forEach((row) => {
      let sheetGroup = sheetMap.get(row.sheet);
      if (!sheetGroup) {
        const sourceSheet = archive.sheets.find((sheet) => sheet.key === row.sheet);
        sheetGroup = {
          key: row.sheet,
          title: sourceSheet.metadata.title,
          lastUpdated: sourceSheet.metadata.lastUpdated,
          sections: [],
          sectionMap: new Map(),
        };
        sheetMap.set(row.sheet, sheetGroup);
        sheets.push(sheetGroup);
      }

      const sectionKey = `${row.sheet}:${row.section_id || row.section_number}`;
      let section = sheetGroup.sectionMap.get(sectionKey);
      if (!section) {
        section = {
          key: sectionKey,
          number: row.section_number,
          name: row.section_name,
          rows: [],
          subtopics: [],
          subtopicMap: new Map(),
        };
        sheetGroup.sectionMap.set(sectionKey, section);
        sheetGroup.sections.push(section);
      }
      section.rows.push(row);

      const subtopicKey = `${sectionKey}:${row.subtopic_id || row.subtopic_number}`;
      let subtopic = section.subtopicMap.get(subtopicKey);
      if (!subtopic) {
        subtopic = {
          key: subtopicKey,
          number: row.subtopic_number,
          name: row.subtopic_name,
          rows: [],
        };
        section.subtopicMap.set(subtopicKey, subtopic);
        section.subtopics.push(subtopic);
      }
      subtopic.rows.push(row);
    });

    return sheets;
  }

  function actionLink(url, label, modifier = "") {
    const safe = trustedUrl(url);
    if (!safe) return "";
    const className = modifier ? `action-link ${modifier}` : "action-link";
    return `<a class="${className}" href="${escapeHtml(safe)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`;
  }

  function renderProblem(row) {
    const progress = entryFor(row);
    const difficultyClass = `difficulty--${normalize(row.difficulty)}`;
    const missingPlatform = row.platform === "No official practice link";
    const practice = row.practice_url
      ? actionLink(row.practice_url, "Practice")
      : '<span class="unavailable-link" title="The official sheet did not provide a practice URL">No practice link</span>';
    const video = row.youtube_url
      ? actionLink(row.youtube_url, "Video", "action-link--video")
      : '<span class="unavailable-link">No video</span>';
    const article = row.article_url ? actionLink(row.article_url, "Article") : "";
    const plus = row.tuf_plus_url && row.tuf_plus_url !== row.practice_url
      ? actionLink(row.tuf_plus_url, "TUF+")
      : "";

    return `
      <article class="problem-row${progress.done ? " is-done" : ""}" data-row-key="${escapeHtml(row._key)}">
        <input
          class="done-control"
          type="checkbox"
          data-action="done"
          data-key="${escapeHtml(row._key)}"
          aria-label="Mark ${escapeHtml(row.problem_name)} complete"
          ${progress.done ? "checked" : ""}
        >
        <span class="problem-index">${String(row.number).padStart(3, "0")}</span>
        <div class="problem-main">
          <span class="problem-name">${escapeHtml(row.problem_name)}</span>
          <span class="problem-meta">
            <span>ID ${escapeHtml(row.problem_id)}</span>
            <span>${escapeHtml(row.sheet)} � ${escapeHtml(row.section_name)}</span>
          </span>
        </div>
        <span class="difficulty ${difficultyClass}">${escapeHtml(row.difficulty)}</span>
        <span class="platform${missingPlatform ? " platform--missing" : ""}">${escapeHtml(missingPlatform ? "No link" : row.platform)}</span>
        <div class="problem-actions">
          ${practice}
          ${video}
          ${article}
          ${plus}
          <button
            class="review-button"
            type="button"
            data-action="review"
            data-key="${escapeHtml(row._key)}"
            aria-label="${progress.review ? "Remove" : "Mark"} ${escapeHtml(row.problem_name)} ${progress.review ? "from" : "for"} review"
            aria-pressed="${progress.review ? "true" : "false"}"
            title="${progress.review ? "Remove review mark" : "Mark for review"}"
          >Review</button>
        </div>
      </article>
    `;
  }

  function renderSubtopic(subtopic, section, sheetKey) {
    const showHeading = sheetKey === "A2Z" || subtopic.name !== section.name;
    return `
      <div class="subtopic">
        ${showHeading ? `<h3 class="subtopic-heading">${escapeHtml(subtopic.name)} <span>${subtopic.rows.length} questions</span></h3>` : ""}
        <div class="problem-table-head" aria-hidden="true">
          <span>Done</span>
          <span>No.</span>
          <span>Question</span>
          <span>Level</span>
          <span>Platform</span>
          <span>Links and review</span>
        </div>
        ${subtopic.rows.map(renderProblem).join("")}
      </div>
    `;
  }

  function renderSection(section, sheetKey, forceOpen, rememberedOpen) {
    const done = section.rows.filter((row) => entryFor(row).done).length;
    const open = forceOpen || rememberedOpen.has(section.key);
    const rail = sectionColors[(section.number - 1) % sectionColors.length];
    return `
      <details class="section-group" data-group-key="${escapeHtml(section.key)}" style="--rail:${rail}" ${open ? "open" : ""}>
        <summary>
          <span class="section-number">S${String(section.number).padStart(2, "0")}</span>
          <span class="section-title">
            <strong>${escapeHtml(section.name)}</strong>
            <span>${section.rows.length} questions in this view</span>
          </span>
          <span class="section-progress">${done} / ${section.rows.length} done</span>
        </summary>
        <div class="section-content">
          ${section.subtopics.map((subtopic) => renderSubtopic(subtopic, section, sheetKey)).join("")}
        </div>
      </details>
    `;
  }

  function captureOpenGroups() {
    return new Set(
      Array.from(elements.list.querySelectorAll("details[open][data-group-key]"))
        .map((details) => details.dataset.groupKey),
    );
  }

  function render(options = {}) {
    const rememberedOpen = options.preserveOpen ? captureOpenGroups() : new Set();
    const visibleRows = filteredRows();
    const grouped = groupRows(visibleRows);
    const forceAllOpen = Boolean(state.search) || visibleRows.length <= 40;

    elements.list.innerHTML = grouped.map((sheetGroup) => {
      const sourceSheet = archive.sheets.find((sheet) => sheet.key === sheetGroup.key);
      const sectionsHtml = sheetGroup.sections.map((section, sectionIndex) => {
        const defaultOpen = forceAllOpen
          || sectionIndex === 0
          || (state.sheet !== "ALL" && sectionIndex === 1);
        return renderSection(section, sheetGroup.key, defaultOpen, rememberedOpen);
      }).join("");

      return `
        <section class="sheet-block" aria-labelledby="sheet-${escapeHtml(sheetGroup.key)}">
          <header class="sheet-break">
            <span class="sheet-break__tag">${escapeHtml(sheetGroup.key)}</span>
            <h2 id="sheet-${escapeHtml(sheetGroup.key)}">${escapeHtml(sheetGroup.title)}</h2>
            <p>${sourceSheet.row_count} archived problems � official data last updated ${escapeHtml(sheetGroup.lastUpdated)}</p>
          </header>
          ${sectionsHtml}
        </section>
      `;
    }).join("");

    elements.empty.hidden = visibleRows.length !== 0;
    elements.list.hidden = visibleRows.length === 0;
    updateStats(visibleRows);
  }

  function updateStats(visibleRows) {
    const visibleDone = visibleRows.filter((row) => entryFor(row).done).length;
    const visibleReview = visibleRows.filter((row) => entryFor(row).review).length;
    const allDone = rows.filter((row) => entryFor(row).done).length;
    const sdeDone = rows.filter((row) => row.sheet === "SDE" && entryFor(row).done).length;
    const a2zDone = rows.filter((row) => row.sheet === "A2Z" && entryFor(row).done).length;
    const overallPercent = Math.round((allDone / rows.length) * 100);

    elements.visibleCount.textContent = String(visibleRows.length);
    elements.visibleDone.textContent = String(visibleDone);
    elements.visibleReview.textContent = String(visibleReview);
    elements.overallPercent.textContent = `${overallPercent}%`;
    elements.overallProgress.style.width = `${overallPercent}%`;
    elements.sdeDone.textContent = String(sdeDone);
    elements.a2zDone.textContent = String(a2zDone);
    elements.sdeProgress.style.width = `${Math.round((sdeDone / 191) * 100)}%`;
    elements.a2zProgress.style.width = `${Math.round((a2zDone / 474) * 100)}%`;

    const context = [];
    context.push(state.sheet === "ALL" ? "Both sheets" : `${state.sheet} sheet`);
    context.push(state.difficulty === "ALL" ? "all difficulties" : state.difficulty);
    context.push(state.platform === "ALL" ? "all platforms" : state.platform);
    if (state.video === "WITH") context.push("video available");
    if (state.video === "WITHOUT") context.push("without video");
    if (state.status === "DONE") context.push("completed");
    if (state.status === "OPEN") context.push("not completed");
    if (state.status === "REVIEW") context.push("marked for review");
    if (state.search) context.push(`matching  ${state.search} `);
    elements.resultContext.textContent = context.join(" � ");
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => {
      elements.toast.classList.remove("is-visible");
    }, 3200);
  }

  function setSheet(sheet) {
    state.sheet = sheet;
    document.querySelectorAll("[data-sheet]").forEach((button) => {
      const active = button.dataset.sheet === sheet;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    render();
  }

  function clearFilters() {
    state.sheet = "ALL";
    state.search = "";
    state.difficulty = "ALL";
    state.platform = "ALL";
    state.video = "ALL";
    state.status = "ALL";
    elements.search.value = "";
    elements.difficulty.value = "ALL";
    elements.platform.value = "ALL";
    elements.video.value = "ALL";
    elements.status.value = "ALL";
    document.querySelectorAll("[data-sheet]").forEach((button) => {
      const active = button.dataset.sheet === "ALL";
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    render();
  }

  function updateProgress(key, property, value) {
    const current = state.progress[key] || { done: false, review: false };
    const next = {
      done: Boolean(current.done),
      review: Boolean(current.review),
      [property]: Boolean(value),
      updatedAt: new Date().toISOString(),
    };
    if (!next.done && !next.review) {
      delete state.progress[key];
    } else {
      state.progress[key] = next;
    }
    saveProgress();
    render({ preserveOpen: true });
  }

  function exportProgress() {
    const payload = {
      format: "striver-revision-ledger-progress",
      version: 1,
      exported_at: new Date().toISOString(),
      archive_scraped_at: archive.scraped_at,
      progress: state.progress,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = `striver-progress-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(href);
    showToast("Progress file exported.");
  }

  async function importProgress(file) {
    try {
      const imported = JSON.parse(await file.text());
      if (
        imported.format !== "striver-revision-ledger-progress"
        || imported.version !== 1
        || !imported.progress
        || typeof imported.progress !== "object"
      ) {
        throw new Error("unrecognized format");
      }

      const validKeys = new Set(rows.map((row) => row._key));
      const cleaned = {};
      Object.entries(imported.progress).forEach(([key, value]) => {
        if (!validKeys.has(key) || !value || typeof value !== "object") return;
        const done = Boolean(value.done);
        const review = Boolean(value.review);
        if (done || review) {
          cleaned[key] = {
            done,
            review,
            updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : new Date().toISOString(),
          };
        }
      });

      const approved = window.confirm(
        `Replace this browser s saved progress with ${Object.keys(cleaned).length} imported entries?`,
      );
      if (!approved) return;
      state.progress = cleaned;
      saveProgress();
      render();
      showToast("Progress imported.");
    } catch {
      showToast("That file is not a valid Striver Revision Ledger progress export.");
    } finally {
      elements.importFile.value = "";
    }
  }

  document.querySelectorAll("[data-sheet]").forEach((button) => {
    button.addEventListener("click", () => setSheet(button.dataset.sheet));
  });

  elements.search.addEventListener("input", () => {
    state.search = elements.search.value.trim();
    render();
  });

  [
    ["difficulty", "difficulty"],
    ["platform", "platform"],
    ["video", "video"],
    ["status", "status"],
  ].forEach(([elementKey, stateKey]) => {
    elements[elementKey].addEventListener("change", () => {
      state[stateKey] = elements[elementKey].value;
      render();
    });
  });

  elements.list.addEventListener("change", (event) => {
    const control = event.target.closest('[data-action="done"]');
    if (!control) return;
    updateProgress(control.dataset.key, "done", control.checked);
  });

  elements.list.addEventListener("click", (event) => {
    const control = event.target.closest('[data-action="review"]');
    if (!control) return;
    const current = state.progress[control.dataset.key] || {};
    updateProgress(control.dataset.key, "review", !current.review);
  });

  document.getElementById("clear-filters").addEventListener("click", clearFilters);
  document.getElementById("empty-clear").addEventListener("click", clearFilters);
  document.getElementById("print-button").addEventListener("click", () => window.print());
  document.getElementById("export-button").addEventListener("click", exportProgress);
  document.getElementById("import-button").addEventListener("click", () => elements.importFile.click());
  elements.importFile.addEventListener("change", () => {
    const [file] = elements.importFile.files;
    if (file) importProgress(file);
  });

  document.getElementById("reset-progress").addEventListener("click", () => {
    if (Object.keys(state.progress).length === 0) {
      showToast("There is no saved progress to reset.");
      return;
    }
    const approved = window.confirm("Reset every completion and review mark in this browser?");
    if (!approved) return;
    state.progress = {};
    saveProgress();
    render();
    showToast("All progress was reset.");
  });

  document.addEventListener("keydown", (event) => {
    const typing = /input|select|textarea/i.test(document.activeElement?.tagName || "");
    if (event.key === "/" && !typing && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      elements.search.focus();
    }
    if (event.key === "Escape" && document.activeElement === elements.search && elements.search.value) {
      elements.search.value = "";
      state.search = "";
      render();
    }
  });

  let printOpenState = [];
  window.addEventListener("beforeprint", () => {
    printOpenState = Array.from(elements.list.querySelectorAll("details")).map((details) => details.open);
    elements.list.querySelectorAll("details").forEach((details) => {
      details.open = true;
    });
  });
  window.addEventListener("afterprint", () => {
    elements.list.querySelectorAll("details").forEach((details, index) => {
      details.open = Boolean(printOpenState[index]);
    });
  });

  render();
})();
