function createCounterBadge(className, value) {
  const badge = document.createElement("span");
  badge.className = `button-counter-mini ${className}`;
  badge.textContent = String(value);
  return badge;
}

function toPositiveCounter(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function normalizeCountersObject(counters = {}) {
  return {
    critical: toPositiveCounter(counters.hs ?? counters.critical),
    warning: toPositiveCounter(counters.use ?? counters.warning),
    control: toPositiveCounter(counters.aControler ?? counters.control),
    comments: 0,
    openProblems: toPositiveCounter(counters.openProblems),
    celluleDefaut: toPositiveCounter(counters.defaut ?? counters.celluleDefaut),
    celluleInhibee: toPositiveCounter(counters.inhibee ?? counters.celluleInhibee),
    controlePreventif: toPositiveCounter(counters.preventif ?? counters.controlePreventif)
  };
}

function buildGlobalNavigationCounters() {
  const tcc = normalizeCountersObject(countTccRawCounters());
  const transitique = normalizeCountersObject(countTransitiqueRawCounters());
  const cellStatesRaw = countCelluleStatesGlobal();

  return normalizeCountersObject({
    critical: tcc.critical + transitique.critical,
    warning: tcc.warning + transitique.warning,
    control: tcc.control + transitique.control,
    comments: 0,
    openProblems: countGlobalProblems(),
    celluleDefaut: Number(cellStatesRaw?.defaut) || 0,
    celluleInhibee: Number(cellStatesRaw?.inhibee) || 0,
    controlePreventif: Number(cellStatesRaw?.controlePreventif) || 0
  });
}

function buildInterventionNavigationCounters() {
  const globalCounters = buildGlobalNavigationCounters();

  return normalizeCountersObject({
    critical: globalCounters.critical,
    warning: globalCounters.warning,
    control: globalCounters.control,
    comments: 0,
    celluleDefaut: globalCounters.celluleDefaut,
    celluleInhibee: globalCounters.celluleInhibee,
    controlePreventif: globalCounters.controlePreventif
  });
}

function createButton(
  text,
  onClick,
  type = "big",
  extraClass = "",
  counters = null,
  subtext = ""
) {
  const button = document.createElement("button");
  button.type = "button";
  button.onclick = onClick;
  button.className = `${type}-button`;

  if (extraClass) {
    extraClass.split(" ").forEach((cls) => {
      if (cls.trim()) {
        button.classList.add(cls.trim());
      }
    });
  }

  const content = document.createElement("div");
  content.className = "button-content";

  const topRow = document.createElement("div");
  topRow.className = "button-top-row";

  const labelWrap = document.createElement("div");
  labelWrap.className = "button-label-wrap";

  const label = document.createElement("span");
  label.className = "button-label";
  label.textContent = text;
  labelWrap.appendChild(label);

  if (subtext) {
    const sub = document.createElement("div");
    sub.className = "button-subtext";
    sub.textContent = subtext;
    labelWrap.appendChild(sub);
  }

  topRow.appendChild(labelWrap);

  if (counters) {
    const normalized = normalizeCountersObject(counters);

    const badgeConfigs = [
      { value: normalized.critical, className: "counter-critical" },
      { value: normalized.warning, className: "counter-warning" },
      { value: normalized.control, className: "counter-control" },
      { value: normalized.celluleDefaut, className: "counter-cellule-defaut" },
      { value: normalized.celluleInhibee, className: "counter-cellule-inhibee" },
      { value: normalized.controlePreventif, className: "counter-preventif" },
      { value: normalized.openProblems, className: "counter-problem-open" }
    ];

    const visibleBadges = badgeConfigs.filter((item) => item.value > 0);

    if (visibleBadges.length > 0) {
      const countersWrap = document.createElement("div");
      countersWrap.className = "button-counters-triple";

      visibleBadges.forEach((item) => {
        countersWrap.appendChild(createCounterBadge(item.className, item.value));
      });

      topRow.appendChild(countersWrap);
    }
  }

  content.appendChild(topRow);
  button.appendChild(content);

  return button;
}

function createLegendItem(id, pillClass, value, label, withDot = true) {
  const item = document.createElement("div");
  item.className = "legend-item";
  item.id = id;

  const pill = document.createElement("div");
  pill.className = `legend-pill ${pillClass}`;

  if (withDot) {
    const dot = document.createElement("span");
    dot.className = "legend-pill-dot";
    pill.appendChild(dot);
  }

  const count = document.createElement("span");
  count.textContent = String(value);
  pill.appendChild(count);

  const labelEl = document.createElement("span");
  labelEl.className = "legend-label";
  labelEl.textContent = label;

  item.appendChild(pill);
  item.appendChild(labelEl);

  return item;
}

function attachLegendNavigation(elementId, targetState, targetData = {}) {
  const el = document.getElementById(elementId);
  if (!el) {
    return;
  }

  el.onclick = () => {
    setState(targetState, targetData);
  };
}

function createLegendGrid(className, items) {
  const grid = document.createElement("div");
  grid.className = `legend-grid ${className}`;

  items.forEach((item) => {
    grid.appendChild(item);
  });

  return grid;
}


function getHomeDetailEtatFilters() {
  return ["critical", "warning", "control", "defaut", "inhibee", "preventif"];
}

function getHomeDetailFamilleFilters() {
  if (typeof getInterventionDetailedFamilleFilters === "function") {
    return getInterventionDetailedFamilleFilters();
  }
  return ["cellule", "chariot", "groupeMoteur", "energybox", "injecteur", "sortie", "manuel"];
}

function createCountersFromInterventionRows(rows = []) {
  const counters = createEmptyCounters();

  rows.forEach((row) => {
    const flags = row?._flags || {};
    if (flags.critique) counters.critical += 1;
    if (flags.aPrevoir) counters.warning += 1;
    if (flags.aControler) counters.control += 1;
    if (flags.celluleDefaut) counters.celluleDefaut += 1;
    if (flags.celluleInhibee) counters.celluleInhibee += 1;
    if (flags.controlePreventif) counters.controlePreventif += 1;
  });

  return counters;
}

function buildHomeDetailFamilyCounters() {
  const result = {};

  getHomeDetailFamilleFilters().forEach((famille) => {
    result[famille] = createEmptyCounters();
  });

  const safeCount = (fn, fallback = createEmptyCounters()) => {
    try {
      return typeof fn === "function" ? normalizeCountersObject(fn()) : normalizeCountersObject(fallback);
    } catch (error) {
      console.warn("Compteur accueil indisponible", error);
      return normalizeCountersObject(fallback);
    }
  };

  const sumDirectCounters = (start, end, fn) => {
    let total = createEmptyCounters();
    if (typeof fn !== "function") return total;

    for (let i = Number(start); i <= Number(end); i++) {
      try {
        total = addCounters(total, fn(i));
      } catch (error) {
        console.warn("Erreur compteur famille accueil", i, error);
      }
    }

    return normalizeCountersObject(total);
  };

  const cellStates = typeof countCelluleStatesGlobal === "function"
    ? countCelluleStatesGlobal()
    : { defaut: 0, inhibee: 0, aControler: 0, controlePreventif: 0 };

  result.cellule = normalizeCountersObject({
    celluleDefaut: Number(cellStates.defaut) || 0,
    celluleInhibee: Number(cellStates.inhibee) || 0,
    control: Number(cellStates.aControler) || 0,
    controlePreventif: Number(cellStates.controlePreventif) || 0
  });

  result.chariot = sumDirectCounters(
    CONFIG_APP.CHARIOT_MIN,
    CONFIG_APP.CHARIOT_MAX,
    typeof countChariotDirectCounters === "function" ? countChariotDirectCounters : null
  );

  result.groupeMoteur = safeCount(
    typeof countAllGroupesMoteurCounters === "function" ? countAllGroupesMoteurCounters : null
  );

  let energyCounters = createEmptyCounters();
  if (typeof countEnergyTrain1Counters === "function") {
    energyCounters = addCounters(energyCounters, countEnergyTrain1Counters());
  }
  if (typeof countEnergyTrain2Counters === "function") {
    energyCounters = addCounters(energyCounters, countEnergyTrain2Counters());
  }
  result.energybox = normalizeCountersObject(energyCounters);

  result.injecteur = safeCount(
    typeof countAllInjecteursCounters === "function" ? countAllInjecteursCounters : null
  );

  result.sortie = safeCount(
    typeof countAllSortiesCounters === "function" ? countAllSortiesCounters : null
  );

  // Sécurité : on complète avec les lignes collectées du détail des anomalies.
  // Cela évite qu'une donnée ancienne ou manuelle échappe aux compteurs par famille.
  if (typeof collectInterventionRows === "function") {
    try {
      const familles = getHomeDetailFamilleFilters();
      const rows = collectInterventionRows(getHomeDetailEtatFilters(), familles);

      familles.forEach((famille) => {
        const familyRows = rows.filter((row) => (row?._familleDetail || row?._famille) === famille);
        const collected = normalizeCountersObject(createCountersFromInterventionRows(familyRows));
        const current = normalizeCountersObject(result[famille] || createEmptyCounters());

        result[famille] = normalizeCountersObject({
          critical: Math.max(current.critical, collected.critical),
          warning: Math.max(current.warning, collected.warning),
          control: Math.max(current.control, collected.control),
          celluleDefaut: Math.max(current.celluleDefaut, collected.celluleDefaut),
          celluleInhibee: Math.max(current.celluleInhibee, collected.celluleInhibee),
          controlePreventif: Math.max(current.controlePreventif, collected.controlePreventif)
        });
      });
    } catch (error) {
      console.warn("Collecte détail anomalies indisponible pour l'accueil", error);
    }
  }

  return result;
}

function createHomeSectionTitle(title, subtitle = "") {
  const header = document.createElement("div");
  header.className = "home-section-header";

  const titleEl = document.createElement("h2");
  titleEl.textContent = title;
  header.appendChild(titleEl);

  if (subtitle) {
    const sub = document.createElement("p");
    sub.textContent = subtitle;
    header.appendChild(sub);
  }

  return header;
}



const HOME_STATE_VISIBILITY_STORAGE_KEY = "TCC_HOME_STATE_VISIBILITY_V2";

function getDefaultHomeStateVisibility() {
  // V2 : aucune ligne n'est forcée visible par défaut.
  // Si tous les compteurs d'une ligne sont à 0, elle est masquée automatiquement.
  // Si au moins un compteur est > 0, elle est affichée automatiquement.
  // Le bouton Afficher/Masquer crée ensuite un choix manuel mémorisé.
  return {};
}

function getHomeStateVisibility() {
  const defaults = getDefaultHomeStateVisibility();

  try {
    const raw = localStorage.getItem(HOME_STATE_VISIBILITY_STORAGE_KEY);
    if (!raw) return defaults;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return defaults;

    return {
      ...defaults,
      ...parsed
    };
  } catch (error) {
    console.warn("Impossible de lire les lignes d'état accueil", error);
    return defaults;
  }
}

function saveHomeStateVisibility(nextVisibility) {
  try {
    localStorage.setItem(
      HOME_STATE_VISIBILITY_STORAGE_KEY,
      JSON.stringify(nextVisibility || {})
    );
  } catch (error) {
    console.warn("Impossible d'enregistrer les lignes d'état accueil", error);
  }
}

function hasManualHomeStateVisibility(key) {
  const visibility = getHomeStateVisibility();
  return Object.prototype.hasOwnProperty.call(visibility, key);
}

function isHomeStateSectionVisible(key, hasActiveCounter = false) {
  const visibility = getHomeStateVisibility();

  if (hasManualHomeStateVisibility(key)) {
    return visibility[key] !== false;
  }

  return !!hasActiveCounter;
}

function toggleHomeStateSection(key, hasActiveCounter = false) {
  const visibility = getHomeStateVisibility();
  const currentlyVisible = isHomeStateSectionVisible(key, hasActiveCounter);
  visibility[key] = !currentlyVisible;
  saveHomeStateVisibility(visibility);
  updateHomeLegendBar();
  fitHomeDashboardToViewport();
}

function hasAnyPositiveCounter(values) {
  return (values || []).some((value) => Number(value || 0) > 0);
}

function fitHomeDashboardToViewport() {
  if (!currentState || currentState.type !== "home") return;

  document.body.classList.add("home-screen-fit");

  const root = document.documentElement;
  const shell = document.querySelector(".app-shell");
  if (!shell) return;

  document.body.classList.remove("home-fit-normal", "home-fit-tight", "home-fit-ultra", "home-fit-emergency");
  shell.classList.remove("home-fit-normal", "home-fit-tight", "home-fit-ultra", "home-fit-emergency");

  const availableHeight = window.visualViewport?.height || window.innerHeight || root.clientHeight || 0;
  if (availableHeight <= 690) {
    document.body.classList.add("home-fit-ultra");
    shell.classList.add("home-fit-ultra");
  } else if (availableHeight <= 820) {
    document.body.classList.add("home-fit-tight");
    shell.classList.add("home-fit-tight");
  } else {
    document.body.classList.add("home-fit-normal");
    shell.classList.add("home-fit-normal");
  }

  fitHomeActionButtonsToViewport();
}

function fitHomeActionButtonsToViewport() {
  if (!currentState || currentState.type !== "home") return;

  const root = document.documentElement;
  const shell = document.querySelector(".app-shell");
  const topbar = document.querySelector(".topbar");
  const mainContent = document.querySelector(".main-content");
  const printZone = document.getElementById("printZone");

  const viewportHeight =
    window.visualViewport?.height ||
    window.innerHeight ||
    root.clientHeight ||
    0;

  if (!viewportHeight) return;

  root.style.setProperty("--home-viewport-h", `${Math.floor(viewportHeight)}px`);
  root.style.setProperty("--home-content-zoom", "1");

  document.body.classList.remove("home-fit-emergency");
  if (shell) shell.classList.remove("home-fit-emergency");

  const isUltra = viewportHeight <= 690;
  const isTight = viewportHeight <= 820;

  // On ne compresse plus les textes jusqu'à les rendre illisibles.
  // Si tout ne rentre pas, la page d'accueil garde un petit scroll de secours.
  const actionHeight = isUltra ? 58 : isTight ? 64 : 72;
  const importHeight = isUltra ? 54 : isTight ? 58 : 64;
  const adminHeight = isUltra ? 50 : isTight ? 54 : 60;

  root.style.setProperty("--home-app-gap", isUltra ? "5px" : "7px");
  root.style.setProperty("--home-action-button-h", `${actionHeight}px`);
  root.style.setProperty("--home-import-button-h", `${importHeight}px`);
  root.style.setProperty("--home-admin-button-h", `${adminHeight}px`);
  root.style.setProperty("--home-action-title-size", isUltra ? "14px" : "16px");
  root.style.setProperty("--home-action-sub-size", isUltra ? "10px" : "11px");
  root.style.setProperty("--home-import-title-size", isUltra ? "13px" : "14px");
  root.style.setProperty("--home-import-sub-size", isUltra ? "9px" : "10px");
  root.style.setProperty("--home-admin-title-size", isUltra ? "13px" : "14px");
  root.style.setProperty("--home-admin-sub-size", isUltra ? "9px" : "10px");

  // Fallback propre : s'il manque encore quelques pixels, on autorise le scroll,
  // au lieu d'écraser les boutons et de couper les libellés.
  requestAnimationFrame(() => {
    if (!mainContent || !printZone || !topbar) return;
    const used = topbar.getBoundingClientRect().height + printZone.scrollHeight + 8;
    document.body.classList.toggle("home-needs-scroll", used > viewportHeight);
  });
}

window.addEventListener("resize", fitHomeDashboardToViewport);
window.addEventListener("orientationchange", () => setTimeout(fitHomeDashboardToViewport, 250));

function getHomeDashboardFamilyConfigs() {
  return [
    {
      key: "cellule",
      label: "État cellules",
      filters: ["cellule"],
      type: "cellule"
    },
    {
      key: "chariot",
      label: "État chariots",
      filters: ["chariot"],
      type: "equipement"
    },
    {
      key: "groupeMoteur",
      label: "État groupes moteurs",
      filters: ["groupeMoteur"],
      type: "equipement"
    },
    {
      key: "energybox",
      label: "État EnergyBox / Pickups",
      filters: ["energybox"],
      type: "equipement"
    },
    {
      key: "injecteur",
      label: "État injecteurs",
      filters: ["injecteur"],
      type: "equipement"
    },
    {
      key: "sortie",
      label: "État sorties",
      filters: ["sortie"],
      type: "equipement"
    }
  ];
}

function createHomeStatePill(config) {
  const item = createLegendItem(
    config.id,
    config.pillClass,
    config.value,
    config.label,
    config.withDot !== false
  );

  item.classList.add("cellule-item", "home-state-item");

  item.onclick = () => {
    setState("intervention", {
      etatFilters: config.etatFilters,
      familleFilters: config.familleFilters,
      showManualForm: false
    });
  };

  return item;
}

function createEquipmentStateSection(config, counters) {
  const normalized = normalizeCountersObject(counters);
  const cellStates = config.type === "cellule" ? countCelluleStatesGlobal() : null;
  const hasActiveCounter = config.type === "cellule"
    ? hasAnyPositiveCounter([
        cellStates.inhibee,
        cellStates.defaut,
        cellStates.aControler,
        cellStates.controlePreventif
      ])
    : hasAnyPositiveCounter([
        normalized.critical,
        normalized.warning,
        normalized.controlePreventif
      ]);
  const isVisible = isHomeStateSectionVisible(config.key, hasActiveCounter);

  const section = document.createElement("div");
  section.className = "dashboard-equipment-state-section";
  section.dataset.stateKey = config.key;
  section.dataset.hasActiveCounter = hasActiveCounter ? "1" : "0";

  if (!isVisible) {
    section.classList.add("is-collapsed");
  }

  const titleRow = document.createElement("div");
  titleRow.className = "dashboard-state-title-row";

  const title = document.createElement("div");
  title.className = "legend-title dashboard-state-title";
  title.textContent = config.label;
  titleRow.appendChild(title);

  const toggleBtn = document.createElement("button");
  toggleBtn.type = "button";
  toggleBtn.className = "dashboard-state-toggle-btn";
  toggleBtn.textContent = isVisible ? "Masquer" : "Afficher";
  toggleBtn.setAttribute(
    "aria-label",
    `${isVisible ? "Masquer" : "Afficher"} ${config.label}`
  );
  toggleBtn.onclick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleHomeStateSection(config.key, hasActiveCounter);
  };
  titleRow.appendChild(toggleBtn);
  section.appendChild(titleRow);

  if (!isVisible) {
    return section;
  }

  let pillConfigs;

  if (config.type === "cellule") {
    pillConfigs = [
      {
        id: "legendCelluleInhibeePill",
        pillClass: "legend-pill-cellule-inhibee",
        value: cellStates.inhibee,
        label: "Inhibée",
        etatFilters: ["inhibee"],
        familleFilters: ["cellule"],
        withDot: false
      },
      {
        id: "legendCelluleDefautPill",
        pillClass: "legend-pill-cellule-defaut",
        value: cellStates.defaut,
        label: "En défaut",
        etatFilters: ["defaut"],
        familleFilters: ["cellule"],
        withDot: false
      },
      {
        id: "legendCelluleControlPill",
        pillClass: "legend-pill-control",
        value: cellStates.aControler,
        label: "À contrôler J+1",
        etatFilters: ["control"],
        familleFilters: ["cellule"],
        withDot: true
      },
      {
        id: "legendCellulePreventifPill",
        pillClass: "legend-pill-preventif",
        value: cellStates.controlePreventif,
        label: "Préventif",
        etatFilters: ["preventif"],
        familleFilters: ["cellule"],
        withDot: true
      }
    ];
  } else {
    pillConfigs = [
      {
        id: `legend${config.key}CriticalPill`,
        pillClass: "legend-pill-red",
        value: normalized.critical,
        label: "Critique",
        etatFilters: ["critical"],
        familleFilters: config.filters,
        withDot: true
      },
      {
        id: `legend${config.key}WarningPill`,
        pillClass: "legend-pill-orange",
        value: normalized.warning,
        label: "À prévoir",
        etatFilters: ["warning"],
        familleFilters: config.filters,
        withDot: true
      },
      {
        id: `legend${config.key}PreventifPill`,
        pillClass: "legend-pill-preventif",
        value: normalized.controlePreventif,
        label: "Préventif",
        etatFilters: ["preventif"],
        familleFilters: config.filters,
        withDot: true
      }
    ];
  }

  const gridClass = config.type === "cellule" ? "cellule-grid" : "equipment-state-grid";
  const grid = createLegendGrid(gridClass, pillConfigs.map(createHomeStatePill));
  section.appendChild(grid);

  return section;
}

function createDashboardEquipmentStateSections() {
  const countersByFamily = buildHomeDetailFamilyCounters();
  const wrap = document.createElement("div");
  wrap.className = "dashboard-equipment-state-grid";

  getHomeDashboardFamilyConfigs().forEach((config) => {
    const counters = config.type === "cellule"
      ? normalizeCountersObject({})
      : countersByFamily[config.key] || createEmptyCounters();

    wrap.appendChild(createEquipmentStateSection(config, counters));
  });

  return wrap;
}

function createHomeDetailFamiliesBlock() {
  const block = document.createElement("div");
  block.className = "home-detail-family-card";

  block.appendChild(
    createHomeSectionTitle(
      "Détail des anomalies",
      "Accès direct par famille d’équipement"
    )
  );

  const countersByFamily = buildHomeDetailFamilyCounters();
  const grid = document.createElement("div");
  grid.className = "home-detail-family-grid";

  const configs = [
    {
      key: "cellule",
      label: "Cellules",
      subtext: "Défaut • Inhibée • J+1 • Préventif",
      filters: ["cellule"]
    },
    {
      key: "chariot",
      label: "Chariots",
      subtext: "Pièces chariot",
      filters: ["chariot"]
    },
    {
      key: "groupeMoteur",
      label: "Groupes moteur",
      subtext: "Motorisations trieur",
      filters: ["groupeMoteur"]
    },
    {
      key: "energybox",
      label: "EnergyBox / Pickups",
      subtext: "Trains 1 et 2",
      filters: ["energybox"]
    },
    {
      key: "injecteur",
      label: "Injecteurs",
      subtext: "Convoyeurs • Motorisations",
      filters: ["injecteur"]
    },
    {
      key: "sortie",
      label: "Sorties",
      subtext: "Sorties TCC",
      filters: ["sortie"]
    },
    {
      key: "manuel",
      label: "Lignes manuelles",
      subtext: "Ajouts libres",
      filters: ["manuel"]
    }
  ];

  configs.forEach((item) => {
    const counters = countersByFamily[item.key] || createEmptyCounters();
    const btn = createButton(
      item.label,
      () =>
        setState("intervention", {
          etatFilters: getHomeDetailEtatFilters(),
          familleFilters: item.filters,
          showManualForm: false
        }),
      "big",
      "home-detail-anomalies-button home-detail-family-button",
      counters,
      item.subtext
    );
    grid.appendChild(btn);
  });

  block.appendChild(grid);
  return block;
}

function updateHomeLegendBar() {
  const legendBar = document.getElementById("homeLegendBar");
  if (!legendBar) {
    return;
  }

  const isHome = currentState && currentState.type === "home";
  if (!isHome) {
    document.body.classList.remove("home-screen-fit", "home-fit-normal", "home-fit-tight", "home-fit-ultra");
    const shell = document.querySelector(".app-shell");
    if (shell) {
      shell.classList.remove("home-fit-normal", "home-fit-tight", "home-fit-ultra");
    }
    legendBar.classList.add("hidden");
    legendBar.replaceChildren();
    return;
  }

  document.body.classList.add("home-screen-fit");

  const summaryCard = document.createElement("div");
  summaryCard.className = "dashboard-summary-card";

  const anomaliesSection = document.createElement("div");
  anomaliesSection.className = "dashboard-summary-section";

  const anomaliesTitle = document.createElement("div");
  anomaliesTitle.className = "legend-title dashboard-main-title";
  anomaliesTitle.textContent = "Total anomalies TCC + Transitique";

  anomaliesSection.appendChild(anomaliesTitle);
  anomaliesSection.appendChild(createDashboardEquipmentStateSections());

  summaryCard.appendChild(anomaliesSection);
  legendBar.replaceChildren(summaryCard);
  legendBar.classList.remove("hidden");
  requestAnimationFrame(fitHomeDashboardToViewport);
}

function updateHomeCelluleBar() {
  const celluleBar = document.getElementById("homeCelluleBar");
  if (!celluleBar) {
    return;
  }

  celluleBar.classList.add("hidden");
  celluleBar.replaceChildren();
}


function getHomeExportButtonClassName() {
  const pending = typeof hasPendingExportChanges === "function" && hasPendingExportChanges();
  return pending
    ? "home-export-button export-pending"
    : "home-export-button export-clean";
}

function getHomeExportSubtext() {
  if (typeof getExportStatusSubtext === "function") {
    return getExportStatusSubtext();
  }

  return "Sauvegarde JSON";
}

function refreshHomeExportButtonStatus() {
  const button = document.getElementById("homeExportButton");
  if (!button) {
    return;
  }

  button.classList.remove("export-pending", "export-clean");
  button.classList.add(
    typeof hasPendingExportChanges === "function" && hasPendingExportChanges()
      ? "export-pending"
      : "export-clean"
  );

  const subtext = button.querySelector(".button-subtext");
  if (subtext) {
    subtext.textContent = getHomeExportSubtext();
  }
}

function getHomeImportButtonClassName() {
  const pending =
    typeof isImportRequiredThisSession === "function" && isImportRequiredThisSession();
  return pending
    ? "home-import-button import-pending"
    : "home-import-button import-clean";
}

function getHomeImportSubtext() {
  if (typeof getImportStatusSubtext === "function") {
    return getImportStatusSubtext();
  }

  return "Charger une sauvegarde JSON";
}

function refreshHomeImportButtonStatus() {
  const button = document.getElementById("homeImportButton");
  if (!button) {
    return;
  }

  button.classList.remove("import-pending", "import-clean");
  button.classList.add(
    typeof isImportRequiredThisSession === "function" && isImportRequiredThisSession()
      ? "import-pending"
      : "import-clean"
  );

  const subtext = button.querySelector(".button-subtext");
  if (subtext) {
    subtext.textContent = getHomeImportSubtext();
  }
}

function createHomeImportExportBlock() {
  const block = document.createElement("div");
  block.className = "home-import-export-block";

  const exportBtn = createButton(
    "📤 Exporter",
    exportData,
    "big",
    getHomeExportButtonClassName(),
    null,
    getHomeExportSubtext()
  );
  exportBtn.id = "homeExportButton";

  const importBtn = createButton(
    "📥 Importer",
    () => {
      if (typeof openImportWorkflow === "function") {
        openImportWorkflow();
        return;
      }

      alert("Import indisponible : fonction openImportWorkflow introuvable.");
    },
    "big",
    getHomeImportButtonClassName(),
    null,
    getHomeImportSubtext()
  );
  importBtn.id = "homeImportButton";

  block.appendChild(exportBtn);
  block.appendChild(importBtn);

  return block;
}

window.addEventListener("export-status-changed", refreshHomeExportButtonStatus);
window.addEventListener("import-status-changed", refreshHomeImportButtonStatus);


function renderHomeView() {
  document.body.classList.add("home-screen-fit");
  clearView();

  const suiviCounters = buildGlobalNavigationCounters();
  const openProblemsCount = countGlobalProblems();

  appView.appendChild(
    createButton(
      "Détail des anomalies",
      () =>
        setState("intervention", {
          etatFilters: getHomeDetailEtatFilters(),
          familleFilters: getHomeDetailFamilleFilters(),
          showManualForm: false
        }),
      "big",
      "home-detail-anomalies-button",
      null,
      "Vue globale des anomalies"
    )
  );

  appView.appendChild(
    createButton(
      "Problématiques / Actions",
      () => setState("problematiquesActions"),
      "big",
      "problem-home-button",
      null,
      `Problématiques ouvertes : ${openProblemsCount}`
    )
  );

  // Préventif total = cellules + toutes pièces TCC (countTccRawCounters inclut
  // chariots directs via countTrieurCounters → countTrain1/2 → countChariotDirectCounters)
  const cellStatesForPreventif = typeof countCelluleStatesGlobal === "function"
    ? countCelluleStatesGlobal()
    : { controlePreventif: 0 };
  const tccForPreventif = normalizeCountersObject(
    typeof countTccRawCounters === "function" ? countTccRawCounters() : {}
  );

  const suiviCountersSansProblem = {
    critical: suiviCounters.critical,
    warning: suiviCounters.warning,
    control: suiviCounters.control,
    celluleDefaut: suiviCounters.celluleDefaut,
    celluleInhibee: suiviCounters.celluleInhibee,
    controlePreventif: (Number(cellStatesForPreventif?.controlePreventif) || 0)
      + (tccForPreventif.controlePreventif || 0)
  };

  appView.appendChild(
    createButton(
      "Suivi TCC - Transitique",
      () => setState("suiviHub"),
      "big",
      "secondary",
      suiviCountersSansProblem,
      "Accès aux équipements"
    )
  );

  appView.appendChild(createHomeImportExportBlock());

  // Bouton "Planifier un préventif" — visible uniquement en mode admin
  if (typeof adminUnlocked !== "undefined" && adminUnlocked === true) {
    const btnPlanif = document.createElement("button");
    btnPlanif.type = "button";
    btnPlanif.className = "admin-button planif-home-btn";
    btnPlanif.onclick = () => {
      if (typeof openPlanificationPopup === "function") {
        openPlanificationPopup();
      }
    };

    const btnContent = document.createElement("div");
    btnContent.className = "button-content";

    const btnLabel = document.createElement("span");
    btnLabel.className = "button-label";
    btnLabel.textContent = "📋 Planifier un préventif";

    const btnSub = document.createElement("span");
    btnSub.className = "button-subtext";
    btnSub.textContent = "Programmer des contrôles préventifs";

    btnContent.appendChild(btnLabel);
    btnContent.appendChild(btnSub);
    btnPlanif.appendChild(btnContent);
    appView.appendChild(btnPlanif);
  }

  appView.appendChild(
    createButton(
      "Admin modèles",
      askAdminPassword,
      "admin",
      "",
      null,
      "Modèles • Schémas • Sauvegarde"
    )
  );

  requestAnimationFrame(fitHomeDashboardToViewport);
}

function renderTransitiqueView() {
  clearView();
  appView.appendChild(createBackButton());

  const transitiqueCounters =
    typeof countTransitiqueCounters === "function"
      ? normalizeCountersObject(countTransitiqueCounters())
      : normalizeCountersObject();

  appView.appendChild(
    createButton(
      "Secteur PF",
      () => setState("secteurPF"),
      "big",
      "transitique",
      transitiqueCounters,
      "Zone PF"
    )
  );

  appView.appendChild(
    createButton(
      "Secteur GF",
      () => setState("secteurGF"),
      "big",
      "transitique",
      transitiqueCounters,
      "Zone GF"
    )
  );
}

function renderSecteurPFView() {
  clearView();
  appView.appendChild(createBackButton());
  appView.appendChild(createInfoCard("Secteur PF", "Contenu à définir"));
}

function renderSecteurGFView() {
  clearView();
  appView.appendChild(createBackButton());
  appView.appendChild(createInfoCard("Secteur GF", "Contenu à définir"));
}

function renderSuiviHubView() {
  clearView();
  appView.appendChild(createBackButton());

  const tccCounters = normalizeCountersObject(countTccCounters());
  const transitiqueCounters =
    typeof countTransitiqueCounters === "function"
      ? normalizeCountersObject(countTransitiqueCounters())
      : normalizeCountersObject();

  appView.appendChild(
    createButton(
      "TCC",
      () => setState("tcc"),
      "big",
      "primary",
      tccCounters,
      "Trieur • Injecteurs • Sorties"
    )
  );

  appView.appendChild(
    createButton(
      "TRANSITIQUE",
      () => setState("transitique"),
      "big",
      "transitique",
      transitiqueCounters,
      "Contenu à définir"
    )
  );
}