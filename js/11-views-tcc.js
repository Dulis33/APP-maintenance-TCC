function ensureElementCommentState(store, key) {
  ensureCommentRows(store, key);

  if (!Array.isArray(store[key])) {
    store[key] = [];
  }

  if (store[key].length === 0) {
    store[key].push(createDefaultCommentItemForTable());
  }

  const first = store[key][0] || createDefaultCommentItemForTable();
  store[key][0] = first;

  first.text = "";
  first.elementConcerne = "";
  first.date = "";
  first.critique = first.critique === true;
  first.aPrevoir = first.aPrevoir === true;
  first.aControler = first.aControler === true;
  first.celluleDefaut = first.celluleDefaut === true;
  first.celluleInhibee = first.celluleInhibee === true;
  first.controlePreventif = first.controlePreventif === true;

  return first;
}

function createElementStateToggleButton(config) {
  const { target, prop, label, title, activeClass } = config;

  const button = document.createElement("button");
  button.type = "button";

  function refreshVisual() {
    button.className = target[prop]
      ? `toggle-flag-button ${activeClass} active`
      : `toggle-flag-button ${activeClass}`;
    button.textContent = label;
    button.title = title;
  }

  button.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    target[prop] = target[prop] !== true;

    refreshVisual();
    saveAll();
    renderCurrentState();
  };

  refreshVisual();
  return button;
}

function createElementStateToolbar(title, buttons = []) {
  const wrap = document.createElement("div");
  wrap.className = "element-state-toolbar";

  const left = document.createElement("div");
  left.className = "element-state-toolbar-left";

  const heading = document.createElement("div");
  heading.className = "element-state-toolbar-title";
  heading.textContent = title;

  left.appendChild(heading);

  const right = document.createElement("div");
  right.className = "element-state-toolbar-right";

  buttons.forEach((btn) => {
    right.appendChild(btn);
  });

  wrap.appendChild(left);
  wrap.appendChild(right);

  return wrap;
}

function createCelluleHeaderStates(celluleNumber) {
  const key = getCelluleKey(celluleNumber);
  const stateItem = ensureElementCommentState(COMMENTS_CELLULES, key);

  const controlBtn = createElementStateToggleButton({
    target: stateItem,
    prop: "aControler",
    label: "À contrôler J+1",
    title: "Cellule à contrôler après suivi défaut/inhibition",
    activeClass: "control"
  });

  const defautBtn = createElementStateToggleButton({
    target: stateItem,
    prop: "celluleDefaut",
    label: "En défaut",
    title: "Cellule en défaut",
    activeClass: "defaut"
  });

  const inhibeeBtn = createElementStateToggleButton({
    target: stateItem,
    prop: "celluleInhibee",
    label: "Inhibée",
    title: "Cellule inhibée",
    activeClass: "inhibee"
  });

  const preventiveBtn = createElementStateToggleButton({
    target: stateItem,
    prop: "controlePreventif",
    label: "Contrôle préventif",
    title: "Contrôle préventif demandé",
    activeClass: "preventif"
  });

  return createElementStateToolbar("", [inhibeeBtn, defautBtn, controlBtn, preventiveBtn]);
}

function createStandardHeaderControl(title, store, key, planContext) {
  const stateItem = ensureElementCommentState(store, key);

  // Migration : l'ancien état À contrôler devient Contrôle préventif
  // puis on le remet à false pour ne plus afficher le bouton
  if (stateItem.aControler === true) {
    stateItem.aControler = false;
    if (stateItem.controlePreventif !== false) {
      stateItem.controlePreventif = false;
    }
    saveAll();
  }

  // Le bouton "Contrôle préventif" est supprimé — les plans s'affichent
  // directement dans le bloc "Préventifs programmés" du tableau de pièces
  return document.createDocumentFragment();
}

function createViewGrid(className = "grid") {
  const grid = document.createElement("div");
  grid.className = className;
  return grid;
}

function createSchemaActionsCard(buttonLabel, imagePath, popupTitle) {
  const actions = document.createElement("div");
  actions.className = "schema-actions";
  actions.appendChild(createSchemaButton(buttonLabel, imagePath, popupTitle));
  return actions;
}

function renderTccView() {
  clearView();
  appView.appendChild(createBackButton());

  appView.appendChild(
    createButton(
      "Trieur",
      () => setState("trieur"),
      "big",
      "primary",
      countTrieurCountersWithPlans(),
      "Train 1 • Train 2 • Groupe moteur"
    )
  );

  appView.appendChild(
    createButton(
      "Injecteurs",
      () => setState("injecteurs"),
      "big",
      "primary",
      countAllInjecteursCountersWithPlans(),
      "530 • 531 • 532 • 533"
    )
  );

  appView.appendChild(
    createButton(
      "Sorties",
      () => setState("sorties"),
      "big",
      "primary",
      countAllSortiesCountersWithPlans(),
      "39 à 51"
    )
  );
}

function renderTrieurView() {
  clearView();
  appView.appendChild(createBackButton());

  appView.appendChild(
    createButton(
      "Train 1",
      () => setState("train1"),
      "big",
      "primary",
      countTrain1Counters(),
      "Chariots 1 à 77 • EnergyBox 1 à 6"
    )
  );

  appView.appendChild(
    createButton(
      "Train 2",
      () => setState("train2"),
      "big",
      "primary",
      countTrain2Counters(),
      "Chariots 78 à 155 • EnergyBox 7 à 12"
    )
  );

  appView.appendChild(
    createButton(
      "Groupe moteur",
      () => setState("groupeMoteur"),
      "big",
      "primary",
      countAllGroupesMoteurCountersWithPlans(),
      "Groupes 1-2 à 13-14"
    )
  );
}

function renderTrain1View() {
  clearView();
  appView.appendChild(createBackButton());

  appView.appendChild(
    createButton(
      "EnergyBox / Pickup",
      () => setState("energyTrain1"),
      "big",
      "primary",
      countEnergyTrain1Counters(),
      "EnergyBox 1 à 6 + Pickup"
    )
  );

  appView.appendChild(createSectionTitle("Chariots 1 à 77"));

  const grid = createViewGrid("grid grid-chariots");

  for (let i = CONFIG_APP.TRAIN_1_START; i <= CONFIG_APP.TRAIN_1_END; i++) {
    const [cell1, cell2] = getCellulesForChariot(i);

    grid.appendChild(
      createButton(
        `Chariot ${i}`,
        () => setState("chariot", { chariotNumber: i }),
        "medium",
        `chariot-compact ${getChariotButtonClasses(i)}`,
        countChariotTotalCountersWithPlans(i),
        `Cellules ${cell1} / ${cell2}`
      )
    );
  }

  appView.appendChild(grid);
}

function renderTrain2View() {
  clearView();
  appView.appendChild(createBackButton());

  appView.appendChild(
    createButton(
      "EnergyBox / Pickup",
      () => setState("energyTrain2"),
      "big",
      "primary",
      countEnergyTrain2Counters(),
      "EnergyBox 7 à 12 + Pickup"
    )
  );

  appView.appendChild(createSectionTitle("Chariots 78 à 155"));

  const grid = createViewGrid("grid grid-chariots");

  for (let i = CONFIG_APP.TRAIN_2_START; i <= CONFIG_APP.TRAIN_2_END; i++) {
    const [cell1, cell2] = getCellulesForChariot(i);

    grid.appendChild(
      createButton(
        `Chariot ${i}`,
        () => setState("chariot", { chariotNumber: i }),
        "medium",
        `chariot-compact ${getChariotButtonClasses(i)}`,
        countChariotTotalCountersWithPlans(i),
        `Cellules ${cell1} / ${cell2}`
      )
    );
  }

  appView.appendChild(grid);
}

function renderEnergyTrain1View() {
  clearView();
  appView.appendChild(createBackButton());

  const grid = createViewGrid();

  for (
    let i = CONFIG_APP.ENERGYBOX_TRAIN_1_START;
    i <= CONFIG_APP.ENERGYBOX_TRAIN_1_END;
    i++
  ) {
    grid.appendChild(
      createButton(
        `n°${i}`,
        () => setState("energyCase", { boxNumber: i }),
        "medium",
        getEnergyBoxState(i) === "red" ? "state-red" : "",
        countEnergyBoxSingleCounters(i),
        "EnergyBox • Pickup1 • Pickup2"
      )
    );
  }

  appView.appendChild(grid);
}

function renderEnergyTrain2View() {
  clearView();
  appView.appendChild(createBackButton());

  const grid = createViewGrid();

  for (
    let i = CONFIG_APP.ENERGYBOX_TRAIN_2_START;
    i <= CONFIG_APP.ENERGYBOX_TRAIN_2_END;
    i++
  ) {
    grid.appendChild(
      createButton(
        `n°${i}`,
        () => setState("energyCase", { boxNumber: i }),
        "medium",
        getEnergyBoxState(i) === "red" ? "state-red" : "",
        countEnergyBoxSingleCounters(i),
        "EnergyBox • Pickup1 • Pickup2"
      )
    );
  }

  appView.appendChild(grid);
}

function renderEnergyCaseView(boxNumber) {
  clearView();
  appView.appendChild(createBackButton());

  ensureEnergyBoxData(boxNumber);
  const key = getEnergyBoxKey(boxNumber);
  const data = DATA_ENERGYBOX[key];

  const trainLabel =
    boxNumber <= CONFIG_APP.ENERGYBOX_TRAIN_1_END ? "Train 1" : "Train 2";

  const card = createDataCard(`EnergyBox / Pickup n°${boxNumber}`, trainLabel);

  const container = document.createElement("div");
  container.className = "energy-container";

  container.appendChild(createEnergyBlock(boxNumber, data.energyBox));
  container.appendChild(createPickupBlock("Pickup1", data.pickup1));
  container.appendChild(createPickupBlock("Pickup2", data.pickup2));

  card.appendChild(container);
  appView.appendChild(card);
}

function renderGroupeMoteurView() {
  clearView();
  appView.appendChild(createBackButton());

  const grid = createViewGrid();

  for (
    let i = CONFIG_APP.GROUPE_MOTEUR_MIN;
    i <= CONFIG_APP.GROUPE_MOTEUR_MAX;
    i++
  ) {
    grid.appendChild(
      createButton(
        `Groupe moteur ${getGroupeMoteurRange(i)}`,
        () => setState("groupeMoteurDetail", { groupNumber: i }),
        "medium",
        getGroupeMoteurButtonClasses(i),
        countGroupeMoteurCountersWithPlans(i),
        "Pièces + commentaires"
      )
    );
  }

  appView.appendChild(grid);
}

function renderGroupeMoteurDetailView(groupNumber) {
  clearView();
  appView.appendChild(createBackButton());

  const key = getGroupeMoteurKey(groupNumber);
  const state = getGroupeMoteurState(groupNumber);
  const groupeLabel = getGroupeMoteurRange(groupNumber);

  const card = createDataCard(`Groupe moteur ${groupeLabel}`, "Trieur");

  card.appendChild(
    createStandardHeaderControl(
      `Groupe moteur ${groupeLabel}`,
      COMMENTS_GROUPE_MOTEUR,
      key,
      { type: "groupeMoteur", id: groupNumber }
    )
  );

  card.appendChild(
    createSchemaActionsCard(
      "Voir schéma",
      SCHEMA_PATHS.groupeMoteur,
      `Schéma du groupe moteur ${groupeLabel}`
    )
  );

  card.appendChild(createStatusLight(state === "off" ? false : true));
  card.appendChild(createTable(MODELE_GROUPE_MOTEUR, DATA_GROUPE_MOTEUR, key));

  appView.appendChild(card);

  appView.appendChild(
    createCommentsCard(
      `Commentaires du groupe moteur ${groupeLabel}`,
      COMMENTS_GROUPE_MOTEUR,
      key
    )
  );
}

function renderChariotView(chariotNumber) {
  clearView();
  appView.appendChild(createBackButton());

  const [cell1, cell2] = getCellulesForChariot(chariotNumber);
  const key = getChariotKey(chariotNumber);
  const state = getChariotDirectState(chariotNumber);
  const parts = getChariotParts(chariotNumber);

  const card = createDataCard(
    `Chariot ${chariotNumber}`,
    getTrainLabelForChariot(chariotNumber)
  );

  card.appendChild(
    createStandardHeaderControl(
      `Chariot ${chariotNumber}`,
      COMMENTS_CHARIOTS,
      key
    )
  );

  const toolbar = document.createElement("div");
  toolbar.className = "toolbar-grid";

  toolbar.appendChild(
    createButton(
      `Cellule ${cell1}`,
      () => setState("cellule", { celluleNumber: cell1, chariotNumber }),
      "action",
      getCelluleButtonClasses(cell1),
      countCelluleCounters(cell1)
    )
  );

  toolbar.appendChild(
    createButton(
      `Cellule ${cell2}`,
      () => setState("cellule", { celluleNumber: cell2, chariotNumber }),
      "action",
      getCelluleButtonClasses(cell2),
      countCelluleCounters(cell2)
    )
  );

  card.appendChild(toolbar);

  card.appendChild(
    createSchemaActionsCard(
      "Voir schéma",
      SCHEMA_PATHS.chariot,
      `Schéma du chariot ${chariotNumber}`
    )
  );

  card.appendChild(createStatusLight(state === "off" ? false : true));
  card.appendChild(createTable(parts, DATA_CHARIOTS, key));

  appView.appendChild(card);

  appView.appendChild(
    createCommentsCard(
      `Commentaires du chariot ${chariotNumber}`,
      COMMENTS_CHARIOTS,
      key
    )
  );
}

function renderChariotPiecesView(chariotNumber) {
  clearView();
  appView.appendChild(createBackButton());

  const key = getChariotKey(chariotNumber);
  const state = getChariotDirectState(chariotNumber);
  const parts = getChariotParts(chariotNumber);

  const card = createDataCard(
    `Pièces du chariot ${chariotNumber}`,
    getTrainLabelForChariot(chariotNumber)
  );

  card.appendChild(
    createStandardHeaderControl(
      `Chariot ${chariotNumber}`,
      COMMENTS_CHARIOTS,
      key
    )
  );

  card.appendChild(
    createSchemaActionsCard(
      "Voir schéma",
      SCHEMA_PATHS.chariot,
      `Schéma du chariot ${chariotNumber}`
    )
  );

  card.appendChild(createStatusLight(state === "off" ? false : true));
  card.appendChild(createTable(parts, DATA_CHARIOTS, key));

  appView.appendChild(card);

  appView.appendChild(
    createCommentsCard(
      `Commentaires du chariot ${chariotNumber}`,
      COMMENTS_CHARIOTS,
      key
    )
  );
}

function getTodayInputDateValue() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function getCelluleHeaderStateItem(celluleNumber) {
  const key = getCelluleKey(celluleNumber);
  return ensureElementCommentState(COMMENTS_CELLULES, key);
}

function getCelluleDefautRecords(celluleNumber) {
  const key = getCelluleKey(celluleNumber);
  ensureCommentRows(COMMENTS_CELLULES, key);

  return COMMENTS_CELLULES[key]
    .slice(1)
    .filter((item) => item && item.suiviType === "cellule_defaut")
    .sort((a, b) => {
      const cycleA = getCelluleDefautCycleId(a);
      const cycleB = getCelluleDefautCycleId(b);

      if (cycleA !== cycleB) {
        return cycleA - cycleB;
      }

      const dayA = Number.isFinite(Number(a.jour)) ? Number(a.jour) : 0;
      const dayB = Number.isFinite(Number(b.jour)) ? Number(b.jour) : 0;
      return dayA - dayB;
    });
}

function getCelluleInhibeeRecords(celluleNumber) {
  const key = getCelluleKey(celluleNumber);
  ensureCommentRows(COMMENTS_CELLULES, key);

  return COMMENTS_CELLULES[key]
    .slice(1)
    .filter((item) => item && item.suiviType === "cellule_inhibee")
    .sort((a, b) => {
      const dateA = a.validatedAt || a.date || "";
      const dateB = b.validatedAt || b.date || "";
      return dateA.localeCompare(dateB);
    });
}

function getCelluleDefautCycleId(record) {
  const cycleId = Number(record?.cycleId);
  return Number.isFinite(cycleId) && cycleId > 0 ? cycleId : 1;
}

function isCelluleDefautOkRecord(record) {
  return record?.ok === true || record?.issue === "ok";
}

function isCelluleDefautInhibitionRecord(record) {
  return record?.inhibition === true || record?.issue === "inhibition";
}

function isCelluleDefautClosedRecord(record) {
  return isCelluleDefautOkRecord(record) || isCelluleDefautInhibitionRecord(record);
}

function getLatestCelluleDefautCycleId(celluleNumber) {
  const records = getCelluleDefautRecords(celluleNumber);

  if (records.length === 0) {
    return 1;
  }

  return records.reduce((max, item) => Math.max(max, getCelluleDefautCycleId(item)), 1);
}

function getCelluleDefautRecordsForCycle(celluleNumber, cycleId) {
  return getCelluleDefautRecords(celluleNumber).filter(
    (item) => getCelluleDefautCycleId(item) === cycleId
  );
}

function getLatestCelluleDefautCycleRecords(celluleNumber) {
  const cycleId = getLatestCelluleDefautCycleId(celluleNumber);
  return getCelluleDefautRecordsForCycle(celluleNumber, cycleId);
}

function getLastRecordFromList(records) {
  return Array.isArray(records) && records.length > 0
    ? records[records.length - 1]
    : null;
}

function getActiveCelluleDefautCycleRecords(celluleNumber) {
  const records = getLatestCelluleDefautCycleRecords(celluleNumber);
  const lastRecord = getLastRecordFromList(records);

  if (!lastRecord || isCelluleDefautClosedRecord(lastRecord)) {
    return [];
  }

  return records;
}

function getNextCelluleDefautCycleId(celluleNumber, jour = 0) {
  const records = getCelluleDefautRecords(celluleNumber);

  if (records.length === 0) {
    return 1;
  }

  const activeRecords = getActiveCelluleDefautCycleRecords(celluleNumber);

  if (activeRecords.length > 0) {
    return getCelluleDefautCycleId(activeRecords[0]);
  }

  const safeDay = Number.isFinite(Number(jour)) ? Number(jour) : 0;
  const latestCycleId = getLatestCelluleDefautCycleId(celluleNumber);
  return safeDay <= 0 ? latestCycleId + 1 : latestCycleId;
}

function getNextCelluleDefautDay(celluleNumber) {
  const activeRecords = getActiveCelluleDefautCycleRecords(celluleNumber);

  if (activeRecords.length === 0) {
    return 0;
  }

  const maxDay = activeRecords.reduce((max, item) => {
    const day = Number.isFinite(Number(item.jour)) ? Number(item.jour) : 0;
    return Math.max(max, day);
  }, 0);

  return maxDay + 1;
}

function getLastCelluleDefautRecord(celluleNumber) {
  const activeRecords = getActiveCelluleDefautCycleRecords(celluleNumber);
  return getLastRecordFromList(activeRecords);
}

function getCelluleInhibeeIssue(recordOrValues = {}) {
  if (recordOrValues.issue) {
    return recordOrValues.issue;
  }

  if (recordOrValues.ok === true) {
    return "ok";
  }

  if (recordOrValues.deinhibee === true) {
    return "deinhibee";
  }

  if (recordOrValues.acquittee === true) {
    return "acquittement";
  }

  if (recordOrValues.celluleInhibee === true || recordOrValues.inhibee === true) {
    return "inhibee";
  }

  if (recordOrValues.suiviType === "cellule_inhibee" && recordOrValues.celluleInhibee === false) {
    return "ok";
  }

  return "inhibee";
}

function isCelluleInhibeeOkRecord(record) {
  return getCelluleInhibeeIssue(record) === "ok";
}

function getOpenCelluleInhibitionRecords(celluleNumber) {
  const records = getCelluleInhibeeRecords(celluleNumber);
  let lastClosedIndex = -1;

  records.forEach((record, index) => {
    if (isCelluleInhibeeOkRecord(record)) {
      lastClosedIndex = index;
    }
  });

  return records.slice(lastClosedIndex + 1);
}

function getNextCelluleInhibitionControlDay(celluleNumber) {
  const records = getOpenCelluleInhibitionRecords(celluleNumber);

  if (records.length === 0) {
    return 1;
  }

  const maxDay = records.reduce((max, item) => {
    const issue = getCelluleInhibeeIssue(item);
    const day = Number.isFinite(Number(item.jour)) ? Number(item.jour) : 0;

    if (issue === "deinhibee" || issue === "acquittement") {
      return Math.max(max, day);
    }

    return max;
  }, 0);

  return maxDay + 1;
}

function getCelluleInhibitionWorkflowStatus(celluleNumber) {
  const stateItem = getCelluleHeaderStateItem(celluleNumber);
  const openRecords = getOpenCelluleInhibitionRecords(celluleNumber);
  const lastOpenRecord = getLastRecordFromList(openRecords);
  const lastIssue = lastOpenRecord ? getCelluleInhibeeIssue(lastOpenRecord) : "";

  if (stateItem.celluleInhibee === true || lastIssue === "inhibee") {
    return {
      active: true,
      phase: "inhibee",
      type: "inhibee",
      label: "Cellule inhibée",
      controlLabel: "Inhibée",
      nextInhibitionDay: 0,
      buttonLabel: "Suivi cellule inhibée",
      buttonSubtext: "Déclarer la cellule toujours inhibée ou déinhibée"
    };
  }

  if (lastIssue === "deinhibee" || lastIssue === "acquittement") {
    const nextDay = getNextCelluleInhibitionControlDay(celluleNumber);

    return {
      active: true,
      phase: "deinhibee-control",
      type: "deinhibee",
      label: `Cellule déinhibée • contrôle J+${nextDay}`,
      controlLabel: `Contrôle déinhibition J+${nextDay}`,
      nextInhibitionDay: nextDay,
      buttonLabel: `Contrôle déinhibition J+${nextDay}`,
      buttonSubtext: "Valider cellule acquittée ou cellule OK"
    };
  }

  return {
    active: false,
    phase: "inactive",
    type: "normal",
    label: "Aucun suivi inhibition ouvert",
    controlLabel: "À contrôler",
    nextInhibitionDay: 0,
    buttonLabel: "Suivi cellule inhibée",
    buttonSubtext: "Disponible après validation d’une inhibition"
  };
}

function isCelluleInhibitionClosed(celluleNumber) {
  const inhibitionWorkflow = getCelluleInhibitionWorkflowStatus(celluleNumber);
  return inhibitionWorkflow.active !== true;
}

function getCelluleWorkflowStatus(celluleNumber) {
  const stateItem = getCelluleHeaderStateItem(celluleNumber);
  const activeRecords = getActiveCelluleDefautCycleRecords(celluleNumber);
  const lastRecord = getLastRecordFromList(activeRecords);
  const nextDay = getNextCelluleDefautDay(celluleNumber);
  const latestClosedRecords = getLatestCelluleDefautCycleRecords(celluleNumber);
  const latestClosedRecord = getLastRecordFromList(latestClosedRecords);
  const inhibitionWorkflow = getCelluleInhibitionWorkflowStatus(celluleNumber);

  if (inhibitionWorkflow.active === true) {
    const type = inhibitionWorkflow.type;
    const label = inhibitionWorkflow.label;

    return {
      type,
      label,
      controlLabel: inhibitionWorkflow.controlLabel,
      nextDefautDay: 0,
      nextInhibitionDay: inhibitionWorkflow.nextInhibitionDay || 0,
      defautCycleId: getNextCelluleDefautCycleId(celluleNumber, 0),
      canOpenDefaut: false,
      canOpenInhibition: true,
      inhibitionPhase: inhibitionWorkflow.phase,
      inhibitionButtonLabel: inhibitionWorkflow.buttonLabel,
      inhibitionButtonSubtext: inhibitionWorkflow.buttonSubtext,
      defautDisabledLabel: type === "deinhibee" ? "Défaut en contrôle après déinhibition" : "Défaut passé en inhibition",
      defautDisabledSubtext: type === "deinhibee" ? "Le suivi continue dans le contrôle déinhibition" : "Le suivi continue dans la fiche cellule inhibée"
    };
  }

  if (!lastRecord) {
    if (stateItem.celluleDefaut === true) {
      return {
        type: "defaut",
        label: "Cellule en défaut",
        controlLabel: "À contrôler",
        nextDefautDay: 0,
        nextInhibitionDay: 0,
        defautCycleId: getNextCelluleDefautCycleId(celluleNumber, 0),
        canOpenDefaut: true,
        canOpenInhibition: false,
        inhibitionPhase: "inactive",
        inhibitionButtonLabel: "Suivi cellule inhibée",
        inhibitionButtonSubtext: "Disponible après validation d’une inhibition"
      };
    }

    if (stateItem.aControler === true) {
      return {
        type: "control",
        label: "Cellule à contrôler",
        controlLabel: "À contrôler",
        nextDefautDay: 0,
        nextInhibitionDay: 0,
        defautCycleId: getNextCelluleDefautCycleId(celluleNumber, 0),
        canOpenDefaut: true,
        canOpenInhibition: false,
        inhibitionPhase: "inactive",
        inhibitionButtonLabel: "Suivi cellule inhibée",
        inhibitionButtonSubtext: "Disponible après validation d’une inhibition"
      };
    }

    if (stateItem.controlePreventif === true) {
      return {
        type: "preventif",
        label: "Contrôle préventif actif",
        controlLabel: "Contrôle préventif",
        nextDefautDay: 0,
        nextInhibitionDay: 0,
        defautCycleId: getNextCelluleDefautCycleId(celluleNumber, 0),
        canOpenDefaut: true,
        canOpenInhibition: false,
        inhibitionPhase: "inactive",
        inhibitionButtonLabel: "Suivi cellule inhibée",
        inhibitionButtonSubtext: "Disponible après validation d’une inhibition"
      };
    }

    return {
      type: "normal",
      label: "Cellule OK • aucun défaut ouvert",
      controlLabel: "À contrôler",
      nextDefautDay: 0,
      nextInhibitionDay: 0,
      defautCycleId: getNextCelluleDefautCycleId(celluleNumber, 0),
      canOpenDefaut: true,
      canOpenInhibition: false,
      inhibitionPhase: "inactive",
      inhibitionButtonLabel: "Suivi cellule inhibée",
      inhibitionButtonSubtext: "Disponible après validation d’une inhibition"
    };
  }

  if (lastRecord.acquittee === true || lastRecord.issue === "acquittement") {
    return {
      type: "control",
      label: `État de contrôle J+${nextDay}`,
      controlLabel: `Contrôle J+${nextDay}`,
      nextDefautDay: nextDay,
      nextInhibitionDay: 0,
      defautCycleId: getNextCelluleDefautCycleId(celluleNumber, nextDay),
      canOpenDefaut: true,
      canOpenInhibition: false,
      inhibitionPhase: "inactive",
      inhibitionButtonLabel: "Suivi cellule inhibée",
      inhibitionButtonSubtext: "Disponible après validation d’une inhibition"
    };
  }

  return {
    type: "defaut",
    label: "Défaut ouvert à compléter",
    controlLabel: "À contrôler",
    nextDefautDay: nextDay,
    nextInhibitionDay: 0,
    defautCycleId: getNextCelluleDefautCycleId(celluleNumber, nextDay),
    canOpenDefaut: true,
    canOpenInhibition: false,
    inhibitionPhase: "inactive",
    inhibitionButtonLabel: "Suivi cellule inhibée",
    inhibitionButtonSubtext: "Disponible après validation d’une inhibition"
  };
}

function getCelluleDefautLabel(day) {
  const safeDay = Number.isFinite(Number(day)) ? Number(day) : 0;
  return safeDay <= 0 ? "Ouverture du défaut" : `Défaut J+${safeDay}`;
}

function toggleCelluleStateFlag(celluleNumber, prop) {
  const stateItem = getCelluleHeaderStateItem(celluleNumber);

  if (!stateItem || !(prop in stateItem)) {
    return;
  }

  const nextValue = stateItem[prop] !== true;

  if (prop === "celluleDefaut" && nextValue) {
    stateItem.celluleInhibee = false;
  }

  if (prop === "celluleInhibee" && nextValue) {
    stateItem.celluleDefaut = false;
  }

  stateItem[prop] = nextValue;
  saveAll();
  renderCurrentState();
}

function toggleCellulePreventiveControl(celluleNumber) {
  toggleCelluleStateFlag(celluleNumber, "controlePreventif");
}

function createCelluleStatePill(label, active, className, onClick = null) {
  const pill = typeof onClick === "function"
    ? document.createElement("button")
    : document.createElement("span");

  if (typeof onClick === "function") {
    pill.type = "button";
    pill.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    };
    pill.setAttribute("aria-pressed", active ? "true" : "false");
    pill.title = active
      ? "Actif — cliquer pour retirer"
      : "Cliquer pour activer";
  }

  pill.className = active
    ? `cellule-state-pill ${className} active${typeof onClick === "function" ? " clickable" : ""}`
    : `cellule-state-pill ${className}${typeof onClick === "function" ? " clickable" : ""}`;
  pill.textContent = label;
  return pill;
}

function createCelluleStateSummary(celluleNumber) {
  const stateItem = getCelluleHeaderStateItem(celluleNumber);
  const workflow = getCelluleWorkflowStatus(celluleNumber);
  const wrap = document.createElement("div");
  wrap.className = "cellule-state-summary";

  const title = document.createElement("div");
  title.className = "cellule-state-summary-title";
  title.textContent = "État de la cellule";
  wrap.appendChild(title);

  const current = document.createElement("div");
  current.className = `cellule-state-current ${workflow.type}`;
  current.textContent = workflow.label;
  wrap.appendChild(current);

  const pills = document.createElement("div");
  pills.className = "cellule-state-pill-row";

  pills.appendChild(
    createCelluleStatePill(
      "Inhibée",
      workflow.type === "inhibee" || stateItem.celluleInhibee === true,
      "inhibee",
      () => toggleCelluleStateFlag(celluleNumber, "celluleInhibee")
    )
  );

  pills.appendChild(
    createCelluleStatePill(
      "En défaut",
      workflow.type === "defaut" || stateItem.celluleDefaut === true,
      "defaut",
      () => toggleCelluleStateFlag(celluleNumber, "celluleDefaut")
    )
  );

  pills.appendChild(
    createCelluleStatePill(
      workflow.type === "control" || workflow.type === "deinhibee" ? workflow.controlLabel : "À contrôler J+1",
      workflow.type === "control" || workflow.type === "deinhibee" || stateItem.aControler === true,
      "control",
      () => toggleCelluleStateFlag(celluleNumber, "aControler")
    )
  );

  pills.appendChild(
    createCelluleStatePill(
      "Contrôle préventif",
      stateItem.controlePreventif === true,
      "preventif",
      () => toggleCellulePreventiveControl(celluleNumber)
    )
  );

  wrap.appendChild(pills);
  return wrap;
}

function createCelluleTextarea(value = "", placeholder = "") {
  const textarea = document.createElement("textarea");
  textarea.className = "model-input cellule-form-textarea";
  textarea.value = value || "";
  textarea.placeholder = placeholder;
  textarea.rows = 4;
  return textarea;
}

function createCelluleFormField(labelText, input) {
  const field = document.createElement("label");
  field.className = "cellule-form-field";

  const label = document.createElement("span");
  label.textContent = labelText;

  field.appendChild(label);
  field.appendChild(input);
  return field;
}

function createCelluleDateInput(value = "") {
  const input = document.createElement("input");
  input.type = "date";
  input.className = "date-input";
  input.value = value || getTodayInputDateValue();
  return input;
}

function createCelluleTextInput(value = "", placeholder = "") {
  const input = document.createElement("input");
  input.type = "text";
  input.className = "model-input";
  input.value = value || "";
  input.placeholder = placeholder;
  return input;
}

function createCelluleCheckbox(labelText, checked = false) {
  const label = document.createElement("label");
  label.className = "cellule-checkbox-row";

  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = checked === true;

  const span = document.createElement("span");
  span.textContent = labelText;

  label.appendChild(input);
  label.appendChild(span);

  return { label, input };
}

function createCelluleExclusiveCheckboxGroup(items) {
  const safeItems = Array.isArray(items) ? items : [];

  safeItems.forEach((item) => {
    if (!item || !item.input) {
      return;
    }

    item.input.onchange = () => {
      if (item.input.checked !== true) {
        return;
      }

      safeItems.forEach((other) => {
        if (other !== item && other?.input) {
          other.input.checked = false;
        }
      });
    };
  });

  return safeItems;
}

function getSelectedCelluleIssue(items) {
  const found = (Array.isArray(items) ? items : []).find((item) => item?.input?.checked === true);
  return found ? found.issue : "";
}


function updateCelluleHeaderStateAfterHistoryChange(celluleNumber) {
  const headerRow = getCelluleHeaderStateItem(celluleNumber);
  const defautRecords = getCelluleDefautRecords(celluleNumber);
  const latestDefautCycleId = defautRecords.length > 0
    ? defautRecords.reduce((max, item) => Math.max(max, getCelluleDefautCycleId(item)), 1)
    : 0;
  const latestDefautRecords = latestDefautCycleId > 0
    ? defautRecords.filter((item) => getCelluleDefautCycleId(item) === latestDefautCycleId)
    : [];
  const latestDefautRecord = getLastRecordFromList(latestDefautRecords);
  const defautOpen = latestDefautRecord && !isCelluleDefautClosedRecord(latestDefautRecord);

  const inhibitionRecords = getCelluleInhibeeRecords(celluleNumber);
  let lastInhibitionCloseIndex = -1;
  inhibitionRecords.forEach((record, index) => {
    if (isCelluleInhibeeOkRecord(record)) {
      lastInhibitionCloseIndex = index;
    }
  });

  const openInhibitionRecords = inhibitionRecords.slice(lastInhibitionCloseIndex + 1);
  const lastInhibitionRecord = getLastRecordFromList(openInhibitionRecords);
  const lastInhibitionIssue = lastInhibitionRecord ? getCelluleInhibeeIssue(lastInhibitionRecord) : "";

  headerRow.celluleDefaut = false;
  headerRow.celluleInhibee = lastInhibitionIssue === "inhibee";
  headerRow.aControler = Boolean(
    defautOpen ||
    lastInhibitionIssue === "deinhibee" ||
    lastInhibitionIssue === "acquittement"
  );

  if (latestDefautRecord && isCelluleDefautInhibitionRecord(latestDefautRecord) && openInhibitionRecords.length === 0) {
    headerRow.celluleInhibee = true;
    headerRow.aControler = false;
  }
}

function getCelluleHistorySourceIndex(celluleNumber, record) {
  const key = getCelluleKey(celluleNumber);
  ensureCommentRows(COMMENTS_CELLULES, key);
  return COMMENTS_CELLULES[key].indexOf(record);
}

function deleteCelluleHistoryRecord(celluleNumber, record, label = "cette ligne") {
  if (!record) {
    return;
  }

  if (!confirm(`Supprimer définitivement ${label} de l’historique ?`)) {
    return;
  }

  const key = getCelluleKey(celluleNumber);
  const sourceIndex = getCelluleHistorySourceIndex(celluleNumber, record);

  if (sourceIndex <= 0) {
    alert("Impossible de supprimer cette ligne d’historique.");
    return;
  }

  COMMENTS_CELLULES[key].splice(sourceIndex, 1);
  updateCelluleHeaderStateAfterHistoryChange(celluleNumber);
  saveAll();
  renderCurrentState();
}

function deleteAllCelluleHistoryByType(celluleNumber, suiviType, label) {
  const key = getCelluleKey(celluleNumber);
  ensureCommentRows(COMMENTS_CELLULES, key);

  const before = COMMENTS_CELLULES[key].length;
  const count = COMMENTS_CELLULES[key].filter((item, index) => index > 0 && item?.suiviType === suiviType).length;

  if (count === 0) {
    alert(`Aucune ligne à supprimer dans ${label}.`);
    return;
  }

  if (!confirm(`Supprimer définitivement les ${count} ligne(s) de ${label} ?`)) {
    return;
  }

  COMMENTS_CELLULES[key] = COMMENTS_CELLULES[key].filter(
    (item, index) => index === 0 || item?.suiviType !== suiviType
  );

  if (COMMENTS_CELLULES[key].length !== before) {
    updateCelluleHeaderStateAfterHistoryChange(celluleNumber);
    saveAll();
    renderCurrentState();
  }
}

function createCelluleHistoryHeader(titleText, subtitleText, actions = []) {
  const header = document.createElement("div");
  header.className = "cellule-history-header";

  const textWrap = document.createElement("div");
  textWrap.className = "cellule-history-header-text";

  const h2 = document.createElement("h2");
  h2.textContent = titleText;
  textWrap.appendChild(h2);

  if (subtitleText) {
    const p = document.createElement("p");
    p.textContent = subtitleText;
    textWrap.appendChild(p);
  }

  const actionWrap = document.createElement("div");
  actionWrap.className = "cellule-history-actions";

  actions.forEach((action) => {
    if (action) {
      actionWrap.appendChild(action);
    }
  });

  header.appendChild(textWrap);
  if (actions.length > 0) {
    header.appendChild(actionWrap);
  }

  return header;
}

function createCelluleHistoryActionButton(label, className, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `cellule-history-action ${className || ""}`.trim();
  button.textContent = label;
  button.onclick = onClick;
  return button;
}

function closeCelluleHistoryLargeOverlay() {
  document.querySelectorAll(".cellule-history-large-overlay").forEach((overlay) => overlay.remove());
}

function createCelluleHistoryLargeOverlay(titleText, tableNode, clearButton = null) {
  closeCelluleHistoryLargeOverlay();

  const overlay = document.createElement("div");
  overlay.className = "history-overlay cellule-history-large-overlay";

  const box = document.createElement("div");
  box.className = "history-box cellule-history-large-box";

  const header = document.createElement("div");
  header.className = "cellule-history-large-header";

  const h3 = document.createElement("h3");
  h3.textContent = titleText;
  header.appendChild(h3);

  const closeTop = document.createElement("button");
  closeTop.type = "button";
  closeTop.className = "cellule-history-large-close";
  closeTop.textContent = "×";
  closeTop.onclick = closeCelluleHistoryLargeOverlay;
  header.appendChild(closeTop);

  box.appendChild(header);

  const wrapper = document.createElement("div");
  wrapper.className = "table-wrapper cellule-history-large-table-wrapper";
  wrapper.appendChild(tableNode);
  box.appendChild(wrapper);

  const footer = document.createElement("div");
  footer.className = "cellule-history-large-footer";

  if (clearButton) {
    footer.appendChild(clearButton);
  }

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "history-close cellule-history-large-bottom-close";
  closeBtn.textContent = "Fermer";
  closeBtn.onclick = closeCelluleHistoryLargeOverlay;
  footer.appendChild(closeBtn);

  box.appendChild(footer);
  overlay.appendChild(box);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closeCelluleHistoryLargeOverlay();
    }
  });

  document.body.appendChild(overlay);
}

function createCellulePreventiveControlToggle(celluleNumber) {
  const stateItem = getCelluleHeaderStateItem(celluleNumber);
  const button = createButton(
    "Contrôle préventif",
    () => {
      stateItem.controlePreventif = stateItem.controlePreventif !== true;
      saveAll();
      renderCurrentState();
    },
    "action",
    stateItem.controlePreventif === true ? "state-preventive-active" : "state-preventive",
    null,
    stateItem.controlePreventif === true
      ? "Actif — recliquer pour retirer"
      : "Marquer cette cellule en contrôle préventif"
  );

  button.setAttribute("aria-pressed", stateItem.controlePreventif === true ? "true" : "false");
  return button;
}


function createDisabledCelluleActionButton(text, subtext = "") {
  const button = createButton(text, () => {}, "action", "state-disabled", null, subtext);
  button.disabled = true;
  button.setAttribute("aria-disabled", "true");
  return button;
}

function buildCelluleDefautCommentText(defautLabel, constat, action, issueLabel = "") {
  const parts = [defautLabel];

  if ((issueLabel || "").trim()) {
    parts.push(`Issue : ${(issueLabel || "").trim()}`);
  }

  if ((constat || "").trim()) {
    parts.push(`Infos : ${(constat || "").trim()}`);
  }

  if ((action || "").trim()) {
    parts.push(`Action / suite : ${(action || "").trim()}`);
  }

  return parts.join(" — ");
}

function getCelluleDefautIssueLabel(recordOrValues = {}) {
  if (recordOrValues.ok === true || recordOrValues.issue === "ok") {
    return "Cellule OK";
  }

  if (recordOrValues.inhibition === true || recordOrValues.issue === "inhibition") {
    return "Cellule inhibée";
  }

  if (recordOrValues.acquittee === true || recordOrValues.issue === "acquittement") {
    return "Défaut acquitté";
  }

  return "Non renseignée";
}

function saveCelluleDefautRecord(celluleNumber, jour, values) {
  const key = getCelluleKey(celluleNumber);
  const headerRow = getCelluleHeaderStateItem(celluleNumber);
  const safeDay = Number.isFinite(Number(jour)) ? Number(jour) : 0;
  const cycleId = Number.isFinite(Number(values.cycleId)) && Number(values.cycleId) > 0
    ? Number(values.cycleId)
    : getNextCelluleDefautCycleId(celluleNumber, safeDay);
  const defautLabel = getCelluleDefautLabel(safeDay);
  const date = values.date || getTodayInputDateValue();
  const technicien = (values.technicien || "").trim();
  const constat = (values.constat || "").trim();
  const action = (values.action || "").trim();
  const isOk = values.ok === true;
  const isAcquittee = values.acquittee === true && !isOk;
  const isInhibition = values.inhibition === true && !isOk;
  const issue = isOk ? "ok" : isInhibition ? "inhibition" : "acquittement";
  const issueLabel = getCelluleDefautIssueLabel({ issue });

  ensureCommentRows(COMMENTS_CELLULES, key);

  if (isOk) {
    headerRow.celluleDefaut = false;
    headerRow.celluleInhibee = false;
    headerRow.aControler = false;
  } else if (isInhibition) {
    headerRow.celluleDefaut = false;
    headerRow.celluleInhibee = true;
    headerRow.aControler = false;
  } else {
    headerRow.celluleDefaut = false;
    headerRow.celluleInhibee = false;
    headerRow.aControler = true;
  }

  const existing = COMMENTS_CELLULES[key].find(
    (item, index) =>
      index > 0 &&
      item &&
      item.suiviType === "cellule_defaut" &&
      getCelluleDefautCycleId(item) === cycleId &&
      Number(item.jour) === safeDay
  );

  const record = existing || createDefaultCommentItemForTable();

  record.suiviType = "cellule_defaut";
  record.cycleId = cycleId;
  record.jour = safeDay;
  record.label = defautLabel;
  record.date = date;
  record.technicien = technicien;
  record.constat = constat;
  record.action = action;
  record.acquittee = isAcquittee;
  record.inhibition = isInhibition;
  record.ok = isOk;
  record.issue = issue;
  record.archivee = isOk || isInhibition;
  record.validatedAt = new Date().toISOString();
  record.elementConcerne = `Cellule ${celluleNumber}`;
  record.text = buildCelluleDefautCommentText(defautLabel, constat, action, issueLabel);
  record.celluleDefaut = false;
  record.celluleInhibee = isInhibition;
  record.critique = false;
  record.aPrevoir = false;
  record.aControler = isAcquittee;

  if (!existing) {
    COMMENTS_CELLULES[key].push(record);
  }

  saveAll();
}

function createCelluleDefautHistoryTable(celluleNumber, records, options = {}) {
  const safeRecords = Array.isArray(records) ? records : [];
  const withActions = options.withActions === true;

  const table = document.createElement("table");
  table.className = `comments-table cellule-defaut-history-table${withActions ? " cellule-history-manage-table" : ""}`;
  table.appendChild(
    createTableHead(
      withActions
        ? ["Étape", "Date", "Issue", "Infos", "Action / suite", "Suppression"]
        : ["Étape", "Date", "Issue", "Infos", "Action / suite"]
    )
  );

  const tbody = document.createElement("tbody");

  safeRecords.forEach((record) => {
    const tr = document.createElement("tr");
    tr.className = "row-cellule-defaut";

    const tdStep = document.createElement("td");
    tdStep.textContent = getCelluleDefautLabel(record.jour);

    const tdDate = document.createElement("td");
    tdDate.textContent = record.date || "";

    const tdIssue = document.createElement("td");
    tdIssue.textContent = record.ok === true || record.issue === "ok"
      ? "Cellule OK"
      : record.inhibition === true || record.issue === "inhibition"
        ? "Inhibition"
        : record.acquittee === true || record.issue === "acquittement"
          ? "Acquittement"
          : "Non renseignée";

    const tdConstat = document.createElement("td");
    tdConstat.textContent = record.constat || "";

    const tdAction = document.createElement("td");
    tdAction.textContent = record.action || "";

    tr.appendChild(tdStep);
    tr.appendChild(tdDate);
    tr.appendChild(tdIssue);
    tr.appendChild(tdConstat);
    tr.appendChild(tdAction);

    if (withActions) {
      const tdDelete = document.createElement("td");
      const deleteBtn = createCelluleHistoryActionButton("Supprimer", "danger", () =>
        deleteCelluleHistoryRecord(
          celluleNumber,
          record,
          `${getCelluleDefautLabel(record.jour)} du ${record.date || "sans date"}`
        )
      );
      tdDelete.appendChild(deleteBtn);
      tr.appendChild(tdDelete);
    }

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  return table;
}

function openCelluleDefautHistoryLarge(celluleNumber) {
  const records = getCelluleDefautRecords(celluleNumber);

  if (records.length === 0) {
    alert("Aucun défaut ouvert pour cette cellule.");
    return;
  }

  const table = createCelluleDefautHistoryTable(celluleNumber, records, { withActions: true });
  const clearButton = createCelluleHistoryActionButton("Vider historique défaut", "danger", () =>
    deleteAllCelluleHistoryByType(celluleNumber, "cellule_defaut", "l’historique défaut")
  );

  createCelluleHistoryLargeOverlay(
    `Historique défaut cellule ${celluleNumber}`,
    table,
    clearButton
  );
}

function createCelluleDefautHistory(celluleNumber) {
  const records = getCelluleDefautRecords(celluleNumber);
  const card = document.createElement("div");
  card.className = "comments-card cellule-defaut-history";

  const actions = records.length > 0
    ? [
        createCelluleHistoryActionButton("Afficher en grand", "primary", () =>
          openCelluleDefautHistoryLarge(celluleNumber)
        )
      ]
    : [];

  card.appendChild(
    createCelluleHistoryHeader(
      "Historique défaut cellule",
      records.length > 0 ? "Ouvre l’historique en grand pour supprimer une ligne ou vider l’historique." : "",
      actions
    )
  );

  if (records.length === 0) {
    const p = document.createElement("p");
    p.textContent = "Aucun défaut ouvert pour cette cellule.";
    card.appendChild(p);
    return card;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "table-wrapper";
  wrapper.appendChild(createCelluleDefautHistoryTable(celluleNumber, records));

  card.appendChild(wrapper);
  return card;
}


function getCelluleInhibeeIssueLabel(recordOrValues = {}) {
  const issue = getCelluleInhibeeIssue(recordOrValues);

  if (issue === "ok") {
    return "Cellule OK";
  }

  if (issue === "deinhibee") {
    return "Cellule déinhibée";
  }

  if (issue === "acquittement") {
    return "Cellule acquittée";
  }

  if (issue === "inhibee") {
    return "Cellule toujours inhibée";
  }

  return "Non renseignée";
}

function getCelluleInhibeeStepLabel(recordOrValues = {}) {
  const issue = getCelluleInhibeeIssue(recordOrValues);
  const day = Number.isFinite(Number(recordOrValues.jour)) ? Number(recordOrValues.jour) : 0;

  if (issue === "deinhibee") {
    return "Déinhibition";
  }

  if (issue === "acquittement" || issue === "ok") {
    return `Contrôle déinhibition J+${day}`;
  }

  return "Suivi inhibition";
}

function createCelluleInhibeeHistoryTable(celluleNumber, records, options = {}) {
  const safeRecords = Array.isArray(records) ? records : [];
  const withActions = options.withActions === true;

  const table = document.createElement("table");
  table.className = `comments-table cellule-defaut-history-table cellule-inhibee-history-table${withActions ? " cellule-history-manage-table" : ""}`;
  table.appendChild(
    createTableHead(
      withActions
        ? ["Étape", "Date", "Issue", "Observation", "Suppression"]
        : ["Étape", "Date", "Issue", "Observation"]
    )
  );

  const tbody = document.createElement("tbody");

  safeRecords.forEach((record) => {
    const tr = document.createElement("tr");
    tr.className = "row-cellule-inhibee";

    const tdStep = document.createElement("td");
    tdStep.textContent = getCelluleInhibeeStepLabel(record);

    const tdDate = document.createElement("td");
    tdDate.textContent = record.date || "";

    const tdIssue = document.createElement("td");
    tdIssue.textContent = getCelluleInhibeeIssueLabel(record);

    const tdObservation = document.createElement("td");
    tdObservation.textContent = record.observation || record.text || "";

    tr.appendChild(tdStep);
    tr.appendChild(tdDate);
    tr.appendChild(tdIssue);
    tr.appendChild(tdObservation);

    if (withActions) {
      const tdDelete = document.createElement("td");
      const deleteBtn = createCelluleHistoryActionButton("Supprimer", "danger", () =>
        deleteCelluleHistoryRecord(
          celluleNumber,
          record,
          `${getCelluleInhibeeStepLabel(record)} du ${record.date || "sans date"}`
        )
      );
      tdDelete.appendChild(deleteBtn);
      tr.appendChild(tdDelete);
    }

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  return table;
}

function openCelluleInhibeeHistoryLarge(celluleNumber) {
  const records = getCelluleInhibeeRecords(celluleNumber);

  if (records.length === 0) {
    alert("Aucun suivi inhibition pour cette cellule.");
    return;
  }

  const table = createCelluleInhibeeHistoryTable(celluleNumber, records, { withActions: true });
  const clearButton = createCelluleHistoryActionButton("Vider historique inhibition", "danger", () =>
    deleteAllCelluleHistoryByType(celluleNumber, "cellule_inhibee", "l’historique inhibition")
  );

  createCelluleHistoryLargeOverlay(
    `Historique cellule inhibée ${celluleNumber}`,
    table,
    clearButton
  );
}

function createCelluleInhibeeHistory(celluleNumber) {
  const records = getCelluleInhibeeRecords(celluleNumber);
  const card = document.createElement("div");
  card.className = "comments-card cellule-defaut-history cellule-inhibee-history";

  const actions = records.length > 0
    ? [
        createCelluleHistoryActionButton("Afficher en grand", "primary", () =>
          openCelluleInhibeeHistoryLarge(celluleNumber)
        )
      ]
    : [];

  card.appendChild(
    createCelluleHistoryHeader(
      "Historique cellule inhibée",
      records.length > 0 ? "Ouvre l’historique en grand pour supprimer une ligne ou vider l’historique." : "",
      actions
    )
  );

  if (records.length === 0) {
    const p = document.createElement("p");
    p.textContent = "Aucun suivi inhibition pour cette cellule.";
    card.appendChild(p);
    return card;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "table-wrapper";
  wrapper.appendChild(createCelluleInhibeeHistoryTable(celluleNumber, records));

  card.appendChild(wrapper);
  return card;
}


function renderCelluleView(celluleNumber, chariotNumber = null) {
  clearView();
  appView.appendChild(createBackButton());

  const workflow = getCelluleWorkflowStatus(celluleNumber);
  const nextDefautDay = workflow.nextDefautDay;
  const subtitle =
    chariotNumber !== null
      ? `Chariot ${chariotNumber} • ${getTrainLabelForCellule(celluleNumber)}`
      : getTrainLabelForCellule(celluleNumber);

  const card = createDataCard(`Cellule ${celluleNumber}`, subtitle);
  card.appendChild(createCelluleStateSummary(celluleNumber));

  const actions = document.createElement("div");
  actions.className = "toolbar-grid cellule-menu-actions";

  actions.appendChild(
    createButton(
      "Contrôle préventif",
      () => setState("celluleControleRoutine", { celluleNumber, chariotNumber }),
      "action",
      "",
      null,
      "Pièces • contrôle • commentaires préventifs"
    )
  );

  if (workflow.canOpenDefaut) {
    actions.appendChild(
      createButton(
        nextDefautDay === 0 ? "Ouverture d'un défaut" : `Défaut J+${nextDefautDay}`,
        () => setState("celluleDefautForm", { celluleNumber, chariotNumber, jour: nextDefautDay }),
        "action",
        "state-red",
        null,
        nextDefautDay === 0
          ? "Créer une fiche défaut puis valider"
          : "Renseigner le suivi du défaut ouvert"
      )
    );
  } else {
    actions.appendChild(
      createDisabledCelluleActionButton(
        workflow.defautDisabledLabel || "Défaut passé en inhibition",
        workflow.defautDisabledSubtext || "Le suivi continue dans la fiche cellule inhibée"
      )
    );
  }

  if (workflow.canOpenInhibition) {
    actions.appendChild(
      createButton(
        workflow.inhibitionButtonLabel || "Suivi cellule inhibée",
        () => setState("celluleInhibeeForm", { celluleNumber, chariotNumber }),
        "action",
        "state-comment",
        null,
        workflow.inhibitionButtonSubtext || "Fiche de suivi inhibition"
      )
    );
  } else {
    actions.appendChild(
      createDisabledCelluleActionButton(
        workflow.inhibitionButtonLabel || "Suivi cellule inhibée",
        workflow.inhibitionButtonSubtext || "Disponible après validation d’une inhibition"
      )
    );
  }

  card.appendChild(actions);
  appView.appendChild(card);
  appView.appendChild(createCelluleDefautHistory(celluleNumber));
  appView.appendChild(createCelluleInhibeeHistory(celluleNumber));
}

function renderCelluleControleRoutineView(celluleNumber, chariotNumber = null) {
  clearView();
  appView.appendChild(createBackButton());

  const key = getCelluleKey(celluleNumber);
  const state = getCelluleState(celluleNumber);

  const subtitle =
    chariotNumber !== null
      ? `Chariot ${chariotNumber} • ${getTrainLabelForCellule(celluleNumber)}`
      : getTrainLabelForCellule(celluleNumber);

  const card = createDataCard(`Contrôle préventif cellule ${celluleNumber}`, subtitle);

  card.appendChild(createCelluleStateSummary(celluleNumber));

  card.appendChild(
    createSchemaActionsCard(
      "Voir schéma",
      SCHEMA_PATHS.cellule,
      `Schéma de la cellule ${celluleNumber}`
    )
  );

  card.appendChild(createStatusLight(state === "off" ? false : true));
  card.appendChild(createTable(MODELE_CELLULE, DATA_CELLULES, key));

  appView.appendChild(card);

  appView.appendChild(
    createCommentsCard(
      `Commentaires contrôle préventif cellule ${celluleNumber}`,
      COMMENTS_CELLULES,
      key,
      { subtitle: "Commentaires réservés au contrôle préventif. Les suivis défaut et inhibition restent dans leurs historiques dédiés." }
    )
  );
}

function renderCelluleDefautFormView(celluleNumber, chariotNumber = null, jour = null) {
  clearView();
  appView.appendChild(createBackButton());

  const safeJour = Number.isFinite(Number(jour))
    ? Number(jour)
    : getNextCelluleDefautDay(celluleNumber);
  const defautLabel = getCelluleDefautLabel(safeJour);
  const subtitle =
    chariotNumber !== null
      ? `Chariot ${chariotNumber} • ${getTrainLabelForCellule(celluleNumber)}`
      : getTrainLabelForCellule(celluleNumber);

  const card = createDataCard(`${defautLabel} • Cellule ${celluleNumber}`, subtitle);
  card.classList.add("cellule-defaut-form-card");

  const note = document.createElement("p");
  note.className = "cellule-form-note";
  note.textContent = safeJour <= 0
    ? "Remplis la fiche, choisis Défaut acquitté ou Cellule inhibée, puis valide. Le suivi ne s’enregistre qu’au clic sur Valider."
    : "Remplis la fiche, choisis Défaut acquitté, Cellule inhibée ou Cellule OK, puis valide. Cellule OK ferme le suivi et l’archive.";
  card.appendChild(note);

  const form = document.createElement("div");
  form.className = "cellule-defaut-form";

  const dateInput = createCelluleDateInput(getTodayInputDateValue());
  const techInput = createCelluleTextInput("", "Nom ou initiales du technicien");
  const constatInput = createCelluleTextarea("", "Infos constatées sur le défaut");
  const actionInput = createCelluleTextarea("", "Action réalisée, suite à prévoir, remarque J+1, etc.");

  const issueChoices = createCelluleExclusiveCheckboxGroup([
    {
      issue: "acquittement",
      ...createCelluleCheckbox("Défaut acquitté", false)
    },
    {
      issue: "inhibition",
      ...createCelluleCheckbox("Cellule inhibée", false)
    },
    ...(safeJour > 0
      ? [
          {
            issue: "ok",
            ...createCelluleCheckbox("Cellule OK — fermer le suivi", false)
          }
        ]
      : [])
  ]);

  form.appendChild(createCelluleFormField("Date", dateInput));
  form.appendChild(createCelluleFormField("Technicien", techInput));
  form.appendChild(createCelluleFormField("Infos défaut", constatInput));
  form.appendChild(createCelluleFormField("Action / suite", actionInput));
  issueChoices.forEach((choice) => form.appendChild(choice.label));

  const actions = document.createElement("div");
  actions.className = "cellule-form-actions";

  const validateBtn = document.createElement("button");
  validateBtn.type = "button";
  validateBtn.className = "model-save-button";
  validateBtn.textContent = "Valider";
  validateBtn.onclick = () => {
    if (!dateInput.value) {
      alert("Renseigne la date avant de valider.");
      return;
    }

    const selectedIssue = getSelectedCelluleIssue(issueChoices);
    if (!selectedIssue) {
      alert(
        safeJour <= 0
          ? "Choisis une issue avant de valider : défaut acquitté ou cellule inhibée."
          : "Choisis une issue avant de valider : défaut acquitté, cellule inhibée ou cellule OK."
      );
      return;
    }

    saveCelluleDefautRecord(celluleNumber, safeJour, {
      date: dateInput.value,
      technicien: techInput.value,
      constat: constatInput.value,
      action: actionInput.value,
      acquittee: selectedIssue === "acquittement",
      inhibition: selectedIssue === "inhibition",
      ok: selectedIssue === "ok"
    });

    goBack();
  };

  actions.appendChild(validateBtn);
  form.appendChild(actions);
  card.appendChild(form);

  appView.appendChild(card);
}

function saveCelluleInhibeeRecord(celluleNumber, values) {
  const key = getCelluleKey(celluleNumber);
  const headerRow = getCelluleHeaderStateItem(celluleNumber);
  const date = values.date || getTodayInputDateValue();
  const observation = (values.observation || "").trim();
  const issue = getCelluleInhibeeIssue(values);
  const safeDay = Number.isFinite(Number(values.jour)) ? Number(values.jour) : 0;

  ensureCommentRows(COMMENTS_CELLULES, key);

  headerRow.celluleDefaut = false;

  if (issue === "inhibee") {
    headerRow.celluleInhibee = true;
    headerRow.aControler = false;
  } else if (issue === "deinhibee" || issue === "acquittement") {
    headerRow.celluleInhibee = false;
    headerRow.aControler = true;
  } else if (issue === "ok") {
    headerRow.celluleInhibee = false;
    headerRow.aControler = false;
  }

  const issueLabels = {
    inhibee: "Cellule toujours inhibée",
    deinhibee: "Cellule déinhibée",
    acquittement: "Cellule acquittée",
    ok: "Cellule OK"
  };
  const issueLabel = issueLabels[issue] || "Suivi inhibition";

  const record = createDefaultCommentItemForTable();
  record.suiviType = "cellule_inhibee";
  record.date = date;
  record.jour = safeDay;
  record.elementConcerne = `Cellule ${celluleNumber}`;
  record.observation = observation;
  record.issue = issue;
  record.inhibee = issue === "inhibee";
  record.deinhibee = issue === "deinhibee";
  record.acquittee = issue === "acquittement";
  record.ok = issue === "ok";
  record.archivee = issue === "ok";
  record.text = observation
    ? `${issueLabel} — ${observation}`
    : issueLabel;
  record.celluleDefaut = false;
  record.celluleInhibee = issue === "inhibee";
  record.aControler = issue === "deinhibee" || issue === "acquittement";
  record.validatedAt = new Date().toISOString();

  COMMENTS_CELLULES[key].push(record);
  saveAll();
}

function renderCelluleInhibeeFormView(celluleNumber, chariotNumber = null) {
  clearView();
  appView.appendChild(createBackButton());

  const workflow = getCelluleWorkflowStatus(celluleNumber);
  const inhibitionPhase = workflow.inhibitionPhase || "inhibee";
  const controlDay = workflow.nextInhibitionDay || 0;
  const subtitle =
    chariotNumber !== null
      ? `Chariot ${chariotNumber} • ${getTrainLabelForCellule(celluleNumber)}`
      : getTrainLabelForCellule(celluleNumber);

  const title = inhibitionPhase === "deinhibee-control"
    ? `Contrôle déinhibition J+${controlDay} • Cellule ${celluleNumber}`
    : `Suivi cellule inhibée ${celluleNumber}`;

  const card = createDataCard(title, subtitle);
  card.classList.add("cellule-defaut-form-card");

  const note = document.createElement("p");
  note.className = "cellule-form-note";
  note.textContent = inhibitionPhase === "deinhibee-control"
    ? "La cellule a été déinhibée. Au contrôle du lendemain, choisis Cellule acquittée pour continuer le suivi ou Cellule OK pour fermer et archiver."
    : "La cellule est inhibée. Choisis Cellule toujours inhibée ou Cellule déinhibée, puis valide.";
  card.appendChild(note);

  const form = document.createElement("div");
  form.className = "cellule-defaut-form";

  const dateInput = createCelluleDateInput(getTodayInputDateValue());
  const observationInput = createCelluleTextarea("", "Observation / action réalisée / remarque");

  const issueChoices = createCelluleExclusiveCheckboxGroup(
    inhibitionPhase === "deinhibee-control"
      ? [
          {
            issue: "acquittement",
            ...createCelluleCheckbox("Cellule acquittée — contrôle à poursuivre", false)
          },
          {
            issue: "ok",
            ...createCelluleCheckbox("Cellule OK — fermer le suivi", false)
          }
        ]
      : [
          {
            issue: "inhibee",
            ...createCelluleCheckbox("Cellule toujours inhibée", false)
          },
          {
            issue: "deinhibee",
            ...createCelluleCheckbox("Cellule déinhibée", false)
          }
        ]
  );

  form.appendChild(createCelluleFormField("Date", dateInput));
  form.appendChild(createCelluleFormField("Observation", observationInput));
  issueChoices.forEach((choice) => form.appendChild(choice.label));

  const actions = document.createElement("div");
  actions.className = "cellule-form-actions";

  const validateBtn = document.createElement("button");
  validateBtn.type = "button";
  validateBtn.className = "model-save-button";
  validateBtn.textContent = "Valider";
  validateBtn.onclick = () => {
    if (!dateInput.value) {
      alert("Renseigne la date avant de valider.");
      return;
    }

    const selectedIssue = getSelectedCelluleIssue(issueChoices);
    if (!selectedIssue) {
      alert(
        inhibitionPhase === "deinhibee-control"
          ? "Choisis une issue : cellule acquittée ou cellule OK."
          : "Choisis une issue : cellule toujours inhibée ou cellule déinhibée."
      );
      return;
    }

    saveCelluleInhibeeRecord(celluleNumber, {
      date: dateInput.value,
      observation: observationInput.value,
      jour: inhibitionPhase === "deinhibee-control" ? controlDay : 0,
      issue: selectedIssue
    });

    goBack();
  };

  actions.appendChild(validateBtn);
  form.appendChild(actions);
  card.appendChild(form);
  appView.appendChild(card);
}


function renderSortiesView() {
  clearView();
  appView.appendChild(createBackButton());

  const grid = createViewGrid();

  for (let i = CONFIG_APP.SORTIE_MIN; i <= CONFIG_APP.SORTIE_MAX; i++) {
    const sortieLabel = getSortieLabel(i);

    grid.appendChild(
      createButton(
        `Sortie ${i}`,
        () => setState("sortie", { sortieNumber: i }),
        "medium",
        getSortieButtonClasses(i),
        countSortieCountersWithPlans(i),
        sortieLabel
          ? `${sortieLabel} • Pièces + commentaires`
          : "Pièces + commentaires"
      )
    );
  }

  appView.appendChild(grid);
}

function renderSortieView(sortieNumber) {
  clearView();
  appView.appendChild(createBackButton());

  const key = getSortieKey(sortieNumber);
  const state = getSortieState(sortieNumber);
  const sortieLabel = getSortieLabel(sortieNumber);

  const card = createDataCard(
    `Sortie ${sortieNumber}`,
    sortieLabel || "Transitique"
  );

  card.appendChild(
    createStandardHeaderControl(
      `Sortie ${sortieNumber}`,
      COMMENTS_SORTIES,
      key,
      { type: "sortie", id: sortieNumber }
    )
  );

  card.appendChild(
    createSchemaActionsCard(
      "Voir schéma",
      SCHEMA_PATHS.sortie,
      `Schéma de la sortie ${sortieNumber}`
    )
  );

  card.appendChild(createStatusLight(state === "off" ? false : true));
  card.appendChild(createTable(MODELE_SORTIE, DATA_SORTIES, key));

  appView.appendChild(card);

  appView.appendChild(
    createCommentsCard(
      `Commentaires de la sortie ${sortieNumber}`,
      COMMENTS_SORTIES,
      key
    )
  );
}