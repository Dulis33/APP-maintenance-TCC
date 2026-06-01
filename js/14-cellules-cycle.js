/* =========================
   CYCLE TERRAIN CELLULES
   Défaut IHM -> Surveillance J+1 -> Inhibition -> Résolution
========================= */

var CELLULE_DOSSIERS = {};

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function getCelluleCycleStorageKey(celluleNumber) {
  return getCelluleKey(celluleNumber);
}

function isValidCelluleNumber(value) {
  const n = Number(value);
  return (
    Number.isInteger(n) &&
    n >= CONFIG_APP.CELLULE_MIN &&
    n <= CONFIG_APP.CELLULE_MAX
  );
}

function normalizeCycleBoolean(value) {
  return value === true || value === "true" || value === "1" || value === "oui";
}

function createCelluleDossier(celluleNumber) {
  const safeCellule = Number(celluleNumber);
  const now = Date.now();

  return {
    id: `cellule_${safeCellule}_${now}_${Math.random().toString(36).slice(2, 8)}`,
    celluleNumber: safeCellule,
    statut: "defaut_signale",

    dateDefaut: getTodayIsoDate(),
    messageIhm: "",
    controleVisuel: "",
    actionImmediate: "",
    defautAcquitte: false,
    techJ0: "",

    dateConstatJ1: "",
    constatJ1: "",
    techJ1: "",
    decisionJ1: "",

    celluleInhibee: false,
    inhibitionIhm: false,
    plotPose: false,
    dateInhibition: "",

    controleStation: "",
    actionMenee: "",
    causeSuspectee: "",
    actionPrevue: "",
    commentaireInhibition: "",

    dateResolution: "",
    actionFinale: "",
    resultatFinal: "",
    desinhibitionIhm: false,
    plotRetire: false,
    techResolution: ""
  };
}

function normalizeCelluleDossier(raw = {}, fallbackCelluleNumber = null) {
  const safeRaw = raw && typeof raw === "object" ? raw : {};
  const celluleNumber = isValidCelluleNumber(safeRaw.celluleNumber)
    ? Number(safeRaw.celluleNumber)
    : Number(fallbackCelluleNumber);

  const dossier = createCelluleDossier(celluleNumber);

  dossier.id = safeRaw.id || dossier.id;
  dossier.statut = safeRaw.statut || dossier.statut;

  dossier.dateDefaut = safeRaw.dateDefaut || "";
  dossier.messageIhm = safeRaw.messageIhm || "";
  dossier.controleVisuel = safeRaw.controleVisuel || "";
  dossier.actionImmediate = safeRaw.actionImmediate || "";
  dossier.defautAcquitte = normalizeCycleBoolean(safeRaw.defautAcquitte);
  dossier.techJ0 = safeRaw.techJ0 || "";

  dossier.dateConstatJ1 = safeRaw.dateConstatJ1 || "";
  dossier.constatJ1 = safeRaw.constatJ1 || "";
  dossier.techJ1 = safeRaw.techJ1 || "";
  dossier.decisionJ1 = safeRaw.decisionJ1 || "";

  dossier.celluleInhibee = normalizeCycleBoolean(safeRaw.celluleInhibee);
  dossier.inhibitionIhm = normalizeCycleBoolean(safeRaw.inhibitionIhm);
  dossier.plotPose = normalizeCycleBoolean(safeRaw.plotPose);
  dossier.dateInhibition = safeRaw.dateInhibition || "";

  dossier.controleStation = safeRaw.controleStation || "";
  dossier.actionMenee = safeRaw.actionMenee || "";
  dossier.causeSuspectee = safeRaw.causeSuspectee || "";
  dossier.actionPrevue = safeRaw.actionPrevue || "";
  dossier.commentaireInhibition = safeRaw.commentaireInhibition || "";

  dossier.dateResolution = safeRaw.dateResolution || "";
  dossier.actionFinale = safeRaw.actionFinale || "";
  dossier.resultatFinal = safeRaw.resultatFinal || "";
  dossier.desinhibitionIhm = normalizeCycleBoolean(safeRaw.desinhibitionIhm);
  dossier.plotRetire = normalizeCycleBoolean(safeRaw.plotRetire);
  dossier.techResolution = safeRaw.techResolution || "";

  return dossier;
}

function ensureCelluleDossiers(celluleNumber) {
  if (!isValidCelluleNumber(celluleNumber)) {
    return [];
  }

  const key = getCelluleCycleStorageKey(celluleNumber);

  if (!Array.isArray(CELLULE_DOSSIERS[key])) {
    CELLULE_DOSSIERS[key] = [];
  }

  CELLULE_DOSSIERS[key] = CELLULE_DOSSIERS[key].map((item) =>
    normalizeCelluleDossier(item, celluleNumber)
  );

  return CELLULE_DOSSIERS[key];
}

function ensureAllCelluleDossiers() {
  Object.keys(CELLULE_DOSSIERS).forEach((key) => {
    const match = key.match(/^cellule_(\d+)$/);
    const celluleNumber = match ? Number(match[1]) : null;

    if (!isValidCelluleNumber(celluleNumber)) {
      delete CELLULE_DOSSIERS[key];
      return;
    }

    ensureCelluleDossiers(celluleNumber);
  });
}

function isCelluleDossierActive(dossier) {
  return dossier && dossier.statut !== "cloture" && dossier.statut !== "résolu";
}

function getActiveCelluleDossiers(celluleNumber) {
  return ensureCelluleDossiers(celluleNumber).filter(isCelluleDossierActive);
}

function getClosedCelluleDossiers(celluleNumber) {
  return ensureCelluleDossiers(celluleNumber).filter((dossier) => !isCelluleDossierActive(dossier));
}

function getAllCelluleDossiers() {
  ensureAllCelluleDossiers();

  const all = [];
  Object.keys(CELLULE_DOSSIERS).forEach((key) => {
    CELLULE_DOSSIERS[key].forEach((dossier) => {
      all.push(dossier);
    });
  });

  return all.sort((a, b) => {
    if (a.celluleNumber !== b.celluleNumber) {
      return a.celluleNumber - b.celluleNumber;
    }
    return String(b.dateDefaut || "").localeCompare(String(a.dateDefaut || ""));
  });
}

function countCelluleCycleCounters() {
  const active = getAllCelluleDossiers().filter(isCelluleDossierActive);

  return {
    openProblems: active.length,
    celluleDefaut: active.filter((dossier) => !isDossierInhibitionActive(dossier)).length,
    celluleInhibee: active.filter(isDossierInhibitionActive).length,
    control: active.length
  };
}

function isDossierInhibitionActive(dossier) {
  return !!(
    dossier?.celluleInhibee ||
    dossier?.inhibitionIhm ||
    dossier?.plotPose ||
    dossier?.statut === "inhibee"
  );
}

function getCelluleDossierPhaseLabel(dossier) {
  if (!isCelluleDossierActive(dossier)) {
    return "Clôturé";
  }

  if (isDossierInhibitionActive(dossier)) {
    return "Inhibée";
  }

  if (dossier.constatJ1 === "NOK") {
    return "J+1 NOK";
  }

  if (dossier.constatJ1 === "OK") {
    return "J+1 OK à clôturer";
  }

  if (dossier.defautAcquitte) {
    return "Surveillance J+1";
  }

  return "Défaut signalé";
}

function getCelluleDossierPhaseClass(dossier) {
  if (!isCelluleDossierActive(dossier)) return "cycle-phase-closed";
  if (isDossierInhibitionActive(dossier)) return "cycle-phase-inhibee";
  if (dossier.constatJ1 === "NOK") return "cycle-phase-nok";
  if (dossier.constatJ1 === "OK") return "cycle-phase-ok";
  if (dossier.defautAcquitte) return "cycle-phase-watch";
  return "cycle-phase-defaut";
}

function getCelluleHeaderStateItem(celluleNumber) {
  const key = getCelluleKey(celluleNumber);

  if (typeof ensureElementCommentState === "function") {
    return ensureElementCommentState(COMMENTS_CELLULES, key);
  }

  if (typeof ensureCommentHeaderRow === "function") {
    return ensureCommentHeaderRow(COMMENTS_CELLULES, key);
  }

  if (!Array.isArray(COMMENTS_CELLULES[key])) {
    COMMENTS_CELLULES[key] = [createEmptyCommentItem()];
  }

  return COMMENTS_CELLULES[key][0];
}

function reconcileCelluleFlagsFromCycle(celluleNumber) {
  if (!isValidCelluleNumber(celluleNumber)) {
    return;
  }

  const stateItem = getCelluleHeaderStateItem(celluleNumber);
  const active = getActiveCelluleDossiers(celluleNumber);
  const hasActive = active.length > 0;
  const hasInhibee = active.some(isDossierInhibitionActive);

  stateItem.aControler = hasActive;
  stateItem.celluleDefaut = hasActive;
  stateItem.celluleInhibee = hasInhibee;
}

function addCelluleDossier(celluleNumber, values = {}) {
  if (!isValidCelluleNumber(celluleNumber)) {
    alert("Numéro de cellule invalide.");
    return null;
  }

  const dossier = Object.assign(createCelluleDossier(Number(celluleNumber)), values || {});
  const rows = ensureCelluleDossiers(celluleNumber);
  rows.unshift(normalizeCelluleDossier(dossier, celluleNumber));

  reconcileCelluleFlagsFromCycle(celluleNumber);
  saveAll();
  return dossier;
}

function deleteCelluleDossier(celluleNumber, dossierId) {
  const rows = ensureCelluleDossiers(celluleNumber);
  const index = rows.findIndex((item) => item.id === dossierId);

  if (index < 0) {
    return;
  }

  if (!confirm("Supprimer définitivement ce dossier cellule ?")) {
    return;
  }

  rows.splice(index, 1);
  reconcileCelluleFlagsFromCycle(celluleNumber);
  saveAll();
  renderCurrentState();
}

function closeCelluleDossier(celluleNumber, dossierId, finalResult = "OK") {
  const rows = ensureCelluleDossiers(celluleNumber);
  const dossier = rows.find((item) => item.id === dossierId);

  if (!dossier) {
    return;
  }

  dossier.statut = "cloture";
  dossier.resultatFinal = finalResult || dossier.resultatFinal || "OK";
  dossier.dateResolution = dossier.dateResolution || getTodayIsoDate();
  dossier.desinhibitionIhm = dossier.desinhibitionIhm || isDossierInhibitionActive(dossier);
  dossier.plotRetire = dossier.plotRetire || isDossierInhibitionActive(dossier);

  reconcileCelluleFlagsFromCycle(celluleNumber);
  saveAll();
  renderCurrentState();
}

function saveCelluleCycleChange(celluleNumber, shouldRender = false) {
  reconcileCelluleFlagsFromCycle(celluleNumber);
  saveAll();

  if (shouldRender && typeof renderCurrentState === "function") {
    window.setTimeout(() => {
      renderCurrentState();
    }, 0);
  }
}

function loadCelluleDossiersFromPayload(sourceRoot) {
  Object.keys(CELLULE_DOSSIERS).forEach((key) => delete CELLULE_DOSSIERS[key]);

  if (!sourceRoot || typeof sourceRoot !== "object" || Array.isArray(sourceRoot)) {
    return;
  }

  Object.keys(sourceRoot).forEach((key) => {
    const match = key.match(/^cellule_(\d+)$/);
    const celluleNumber = match ? Number(match[1]) : null;

    if (!isValidCelluleNumber(celluleNumber)) {
      return;
    }

    CELLULE_DOSSIERS[key] = Array.isArray(sourceRoot[key])
      ? sourceRoot[key].map((item) => normalizeCelluleDossier(item, celluleNumber))
      : [];
  });

  ensureAllCelluleDossiers();
}

function installCelluleCycleStorageHooks() {
  if (typeof buildPayload === "function" && !buildPayload.__celluleCycleWrapped) {
    const originalBuildPayload = buildPayload;
    buildPayload = function () {
      const payload = originalBuildPayload();
      ensureAllCelluleDossiers();
      payload.celluleDossiers = CELLULE_DOSSIERS;
      return payload;
    };
    buildPayload.__celluleCycleWrapped = true;
  }

  if (typeof applyLoadedData === "function" && !applyLoadedData.__celluleCycleWrapped) {
    const originalApplyLoadedData = applyLoadedData;
    applyLoadedData = function (data) {
      originalApplyLoadedData(data);
      loadCelluleDossiersFromPayload(data?.celluleDossiers);
    };
    applyLoadedData.__celluleCycleWrapped = true;
  }
}

function createCycleField(labelText, child, wide = false) {
  const field = document.createElement("label");
  field.className = wide ? "cycle-field cycle-field-wide" : "cycle-field";

  const label = document.createElement("span");
  label.textContent = labelText;

  field.appendChild(label);
  field.appendChild(child);
  return field;
}

function createCycleTextInput(value, placeholder, onChange, multiline = false) {
  const input = multiline ? document.createElement("textarea") : document.createElement("input");

  if (!multiline) {
    input.type = "text";
  }

  input.className = "model-input cycle-input";
  input.value = value || "";
  input.placeholder = placeholder || "";

  let lastSavedValue = input.value;
  const commitValue = (event) => {
    const nextValue = event.target.value;
    if (nextValue === lastSavedValue) {
      return;
    }

    lastSavedValue = nextValue;
    onChange(nextValue);
  };

  input.addEventListener("input", commitValue);
  input.addEventListener("change", commitValue);
  input.addEventListener("blur", commitValue);

  return input;
}

function createCycleDateInput(value, onChange) {
  const input = document.createElement("input");
  input.type = "date";
  input.className = "date-input cycle-input";
  input.value = value || "";
  input.addEventListener("change", (event) => onChange(event.target.value));
  return input;
}

function createCycleSelect(value, options, onChange) {
  const select = document.createElement("select");
  select.className = "model-input cycle-input";

  options.forEach((option) => {
    const opt = document.createElement("option");
    opt.value = option.value;
    opt.textContent = option.label;
    select.appendChild(opt);
  });

  select.value = value || "";
  select.addEventListener("change", (event) => onChange(event.target.value));
  return select;
}

function createCycleCheckbox(labelText, checked, onChange) {
  const label = document.createElement("label");
  label.className = "cycle-check";

  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = checked === true;

  function forceCommitActiveCycleField() {
    const active = document.activeElement;
    if (!active || active === input) {
      return;
    }

    const tagName = String(active.tagName || "").toLowerCase();
    if (!["input", "textarea", "select"].includes(tagName)) {
      return;
    }

    if (!active.classList || !active.classList.contains("cycle-input")) {
      return;
    }

    active.dispatchEvent(new Event("input", { bubbles: true }));
    active.dispatchEvent(new Event("change", { bubbles: true }));
    if (typeof active.blur === "function") {
      active.blur();
    }
  }

  input.addEventListener("pointerdown", forceCommitActiveCycleField, true);
  label.addEventListener("pointerdown", forceCommitActiveCycleField, true);
  input.addEventListener("touchstart", forceCommitActiveCycleField, { capture: true, passive: true });

  input.addEventListener("change", (event) => {
    forceCommitActiveCycleField();
    onChange(event.target.checked);
  });

  const span = document.createElement("span");
  span.textContent = labelText;

  label.appendChild(input);
  label.appendChild(span);
  return label;
}

function createCyclePhaseBadge(dossier) {
  const badge = document.createElement("span");
  badge.className = `cycle-phase-badge ${getCelluleDossierPhaseClass(dossier)}`;
  badge.textContent = getCelluleDossierPhaseLabel(dossier);
  return badge;
}

function createCycleSection(title) {
  const section = document.createElement("div");
  section.className = "cycle-section";

  const h3 = document.createElement("h3");
  h3.textContent = title;
  section.appendChild(h3);

  return section;
}

function createCycleButton(text, className, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className || "model-save-button";
  button.textContent = text;
  button.onclick = onClick;
  return button;
}

function createCelluleDossierEditor(celluleNumber, dossier) {
  const box = document.createElement("div");
  box.className = "cycle-dossier-card";

  const header = document.createElement("div");
  header.className = "cycle-dossier-header";

  const titleWrap = document.createElement("div");
  titleWrap.className = "cycle-dossier-title-wrap";

  const title = document.createElement("div");
  title.className = "cycle-dossier-title";
  title.textContent = `Dossier ${dossier.dateDefaut || "sans date"}`;

  titleWrap.appendChild(title);
  titleWrap.appendChild(createCyclePhaseBadge(dossier));

  const deleteBtn = createCycleButton("Supprimer", "model-delete-button", () => {
    deleteCelluleDossier(celluleNumber, dossier.id);
  });

  header.appendChild(titleWrap);
  header.appendChild(deleteBtn);
  box.appendChild(header);

  const j0 = createCycleSection("1. Défaut IHM / action immédiate");
  const gridJ0 = document.createElement("div");
  gridJ0.className = "cycle-fields-grid";

  gridJ0.appendChild(
    createCycleField(
      "Date défaut",
      createCycleDateInput(dossier.dateDefaut, (value) => {
        dossier.dateDefaut = value;
        saveCelluleCycleChange(celluleNumber);
      })
    )
  );

  gridJ0.appendChild(
    createCycleField(
      "Technicien J0",
      createCycleTextInput(dossier.techJ0, "Nom", (value) => {
        dossier.techJ0 = value;
        saveCelluleCycleChange(celluleNumber);
      })
    )
  );

  gridJ0.appendChild(
    createCycleField(
      "Message défaut IHM",
      createCycleTextInput(dossier.messageIhm, "Message affiché sur l'IHM", (value) => {
        dossier.messageIhm = value;
        saveCelluleCycleChange(celluleNumber);
      }, true),
      true
    )
  );

  gridJ0.appendChild(
    createCycleField(
      "Contrôle visuel",
      createCycleTextInput(dossier.controleVisuel, "Contrôle réalisé sur place", (value) => {
        dossier.controleVisuel = value;
        saveCelluleCycleChange(celluleNumber);
      }, true),
      true
    )
  );

  gridJ0.appendChild(
    createCycleField(
      "Action immédiate",
      createCycleTextInput(dossier.actionImmediate, "Action simple faite immédiatement", (value) => {
        dossier.actionImmediate = value;
        saveCelluleCycleChange(celluleNumber);
      }, true),
      true
    )
  );

  const checksJ0 = document.createElement("div");
  checksJ0.className = "cycle-check-row";
  checksJ0.appendChild(
    createCycleCheckbox("Défaut acquitté", dossier.defautAcquitte, (checked) => {
      dossier.defautAcquitte = checked;
      if (checked && dossier.statut === "defaut_signale") {
        dossier.statut = "surveillance_j1";
      }
      saveCelluleCycleChange(celluleNumber);
    })
  );

  gridJ0.appendChild(checksJ0);
  j0.appendChild(gridJ0);
  box.appendChild(j0);

  const j1 = createCycleSection("2. Constat J+1");
  const gridJ1 = document.createElement("div");
  gridJ1.className = "cycle-fields-grid";

  gridJ1.appendChild(
    createCycleField(
      "Date constat J+1",
      createCycleDateInput(dossier.dateConstatJ1, (value) => {
        dossier.dateConstatJ1 = value;
        saveCelluleCycleChange(celluleNumber);
      })
    )
  );

  gridJ1.appendChild(
    createCycleField(
      "Technicien J+1",
      createCycleTextInput(dossier.techJ1, "Nom", (value) => {
        dossier.techJ1 = value;
        saveCelluleCycleChange(celluleNumber);
      })
    )
  );

  gridJ1.appendChild(
    createCycleField(
      "Constat J+1",
      createCycleSelect(
        dossier.constatJ1,
        [
          { value: "", label: "À renseigner" },
          { value: "OK", label: "OK - plus de défaut" },
          { value: "NOK", label: "NOK - défaut persistant" },
          { value: "A_SURVEILLER", label: "À surveiller" }
        ],
        (value) => {
          dossier.constatJ1 = value;
          dossier.dateConstatJ1 = dossier.dateConstatJ1 || getTodayIsoDate();
          if (value === "NOK") {
            dossier.statut = "j1_nok";
            dossier.decisionJ1 = "Inhiber la cellule";
          } else if (value === "OK") {
            dossier.decisionJ1 = "Clôturer si confirmé";
          } else if (value === "A_SURVEILLER") {
            dossier.statut = "surveillance_j1";
            dossier.decisionJ1 = "Garder en surveillance";
          }
          saveCelluleCycleChange(celluleNumber);
        }
      )
    )
  );

  gridJ1.appendChild(
    createCycleField(
      "Décision / remarque J+1",
      createCycleTextInput(dossier.decisionJ1, "Décision prise après contrôle J+1", (value) => {
        dossier.decisionJ1 = value;
        saveCelluleCycleChange(celluleNumber);
      }, true),
      true
    )
  );

  const j1Actions = document.createElement("div");
  j1Actions.className = "cycle-action-grid";
  j1Actions.appendChild(
    createCycleButton("J+1 OK : clôturer", "model-add-button", () => {
      dossier.constatJ1 = "OK";
      dossier.dateConstatJ1 = dossier.dateConstatJ1 || getTodayIsoDate();
      dossier.actionFinale = dossier.actionFinale || "Constat J+1 OK : défaut non reproduit.";
      closeCelluleDossier(celluleNumber, dossier.id, "OK");
    })
  );

  j1Actions.appendChild(
    createCycleButton("J+1 NOK : inhiber + plot", "model-save-button", () => {
      dossier.constatJ1 = "NOK";
      dossier.dateConstatJ1 = dossier.dateConstatJ1 || getTodayIsoDate();
      dossier.statut = "inhibee";
      dossier.celluleInhibee = true;
      dossier.inhibitionIhm = true;
      dossier.plotPose = true;
      dossier.dateInhibition = dossier.dateInhibition || getTodayIsoDate();
      dossier.decisionJ1 = dossier.decisionJ1 || "Cellule inhibée sur IHM et plot posé.";
      saveCelluleCycleChange(celluleNumber);
    })
  );

  j1.appendChild(gridJ1);
  j1.appendChild(j1Actions);
  box.appendChild(j1);

  const inhibition = createCycleSection("3. Suivi cellule inhibée / sécurité terrain");
  const gridInhibition = document.createElement("div");
  gridInhibition.className = "cycle-fields-grid";

  gridInhibition.appendChild(
    createCycleField(
      "Date inhibition",
      createCycleDateInput(dossier.dateInhibition, (value) => {
        dossier.dateInhibition = value;
        saveCelluleCycleChange(celluleNumber);
      })
    )
  );

  gridInhibition.appendChild(
    createCycleField(
      "Contrôle station",
      createCycleSelect(
        dossier.controleStation,
        [
          { value: "", label: "Non renseigné" },
          { value: "OK", label: "OK" },
          { value: "NOK", label: "NOK" }
        ],
        (value) => {
          dossier.controleStation = value;
          saveCelluleCycleChange(celluleNumber);
        }
      )
    )
  );

  const checksInhibition = document.createElement("div");
  checksInhibition.className = "cycle-check-row cycle-field-wide";
  checksInhibition.appendChild(
    createCycleCheckbox("Cellule inhibée sur IHM", dossier.inhibitionIhm, (checked) => {
      dossier.inhibitionIhm = checked;
      dossier.celluleInhibee = checked || dossier.plotPose;
      if (checked) {
        dossier.statut = "inhibee";
        dossier.dateInhibition = dossier.dateInhibition || getTodayIsoDate();
      }
      saveCelluleCycleChange(celluleNumber);
    })
  );
  checksInhibition.appendChild(
    createCycleCheckbox("Plot aimanté posé", dossier.plotPose, (checked) => {
      dossier.plotPose = checked;
      dossier.celluleInhibee = checked || dossier.inhibitionIhm;
      if (checked) {
        dossier.statut = "inhibee";
        dossier.dateInhibition = dossier.dateInhibition || getTodayIsoDate();
      }
      saveCelluleCycleChange(celluleNumber);
    })
  );

  gridInhibition.appendChild(checksInhibition);

  gridInhibition.appendChild(
    createCycleField(
      "Action menée",
      createCycleTextInput(dossier.actionMenee, "Action faite sur cellule inhibée", (value) => {
        dossier.actionMenee = value;
        saveCelluleCycleChange(celluleNumber);
      }, true),
      true
    )
  );

  gridInhibition.appendChild(
    createCycleField(
      "Cause / pièce suspectée",
      createCycleTextInput(dossier.causeSuspectee, "Ex : câble, bouchon, moteur, capteur...", (value) => {
        dossier.causeSuspectee = value;
        saveCelluleCycleChange(celluleNumber);
      }, true),
      true
    )
  );

  gridInhibition.appendChild(
    createCycleField(
      "Action prévue",
      createCycleTextInput(dossier.actionPrevue, "À faire pour résoudre", (value) => {
        dossier.actionPrevue = value;
        saveCelluleCycleChange(celluleNumber);
      }, true),
      true
    )
  );

  gridInhibition.appendChild(
    createCycleField(
      "Commentaire inhibition",
      createCycleTextInput(dossier.commentaireInhibition, "Commentaire libre", (value) => {
        dossier.commentaireInhibition = value;
        saveCelluleCycleChange(celluleNumber);
      }, true),
      true
    )
  );

  inhibition.appendChild(gridInhibition);
  box.appendChild(inhibition);

  const resolution = createCycleSection("4. Résolution / remise en service");
  const gridResolution = document.createElement("div");
  gridResolution.className = "cycle-fields-grid";

  gridResolution.appendChild(
    createCycleField(
      "Date résolution",
      createCycleDateInput(dossier.dateResolution, (value) => {
        dossier.dateResolution = value;
        saveCelluleCycleChange(celluleNumber);
      })
    )
  );

  gridResolution.appendChild(
    createCycleField(
      "Technicien résolution",
      createCycleTextInput(dossier.techResolution, "Nom", (value) => {
        dossier.techResolution = value;
        saveCelluleCycleChange(celluleNumber);
      })
    )
  );

  gridResolution.appendChild(
    createCycleField(
      "Résultat final",
      createCycleSelect(
        dossier.resultatFinal,
        [
          { value: "", label: "Non renseigné" },
          { value: "OK", label: "OK" },
          { value: "NOK", label: "NOK" }
        ],
        (value) => {
          dossier.resultatFinal = value;
          saveCelluleCycleChange(celluleNumber);
        }
      )
    )
  );

  const checksResolution = document.createElement("div");
  checksResolution.className = "cycle-check-row cycle-field-wide";
  checksResolution.appendChild(
    createCycleCheckbox("Cellule désinhibée sur IHM", dossier.desinhibitionIhm, (checked) => {
      dossier.desinhibitionIhm = checked;
      saveCelluleCycleChange(celluleNumber);
    })
  );
  checksResolution.appendChild(
    createCycleCheckbox("Plot retiré", dossier.plotRetire, (checked) => {
      dossier.plotRetire = checked;
      saveCelluleCycleChange(celluleNumber);
    })
  );

  gridResolution.appendChild(checksResolution);

  gridResolution.appendChild(
    createCycleField(
      "Action finale réalisée",
      createCycleTextInput(dossier.actionFinale, "Ex : câble remplacé, test OK, remise en service", (value) => {
        dossier.actionFinale = value;
        saveCelluleCycleChange(celluleNumber);
      }, true),
      true
    )
  );

  const resolutionActions = document.createElement("div");
  resolutionActions.className = "cycle-action-grid";
  resolutionActions.appendChild(
    createCycleButton("Clôturer le dossier", "model-save-button", () => {
      if (isDossierInhibitionActive(dossier) && (!dossier.desinhibitionIhm || !dossier.plotRetire)) {
        const confirmClose = confirm(
          "Attention : la cellule semble inhibée. Confirmer la clôture sans désinhibition IHM ou retrait du plot ?"
        );
        if (!confirmClose) return;
      }
      closeCelluleDossier(celluleNumber, dossier.id, dossier.resultatFinal || "OK");
    })
  );

  resolution.appendChild(gridResolution);
  resolution.appendChild(resolutionActions);
  box.appendChild(resolution);

  return box;
}

function createCelluleCycleSummary(celluleNumber) {
  const active = getActiveCelluleDossiers(celluleNumber);
  const closed = getClosedCelluleDossiers(celluleNumber);

  const summary = document.createElement("div");
  summary.className = "cycle-summary";

  const items = [
    { label: "Dossiers ouverts", value: active.length, className: "cycle-summary-open" },
    {
      label: "Inhibée / plot",
      value: active.filter(isDossierInhibitionActive).length,
      className: "cycle-summary-inhibee"
    },
    { label: "Historique", value: closed.length, className: "cycle-summary-closed" }
  ];

  items.forEach((item) => {
    const tile = document.createElement("div");
    tile.className = `cycle-summary-tile ${item.className}`;

    const value = document.createElement("strong");
    value.textContent = String(item.value);

    const label = document.createElement("span");
    label.textContent = item.label;

    tile.appendChild(value);
    tile.appendChild(label);
    summary.appendChild(tile);
  });

  return summary;
}


function getCelluleCycleSelectedSection() {
  const section = currentState?.data?.celluleSection;
  return typeof section === "string" && section ? section : "hub";
}

function getActiveCelluleDefautDossiers(celluleNumber) {
  return getActiveCelluleDossiers(celluleNumber).filter((dossier) => !isDossierInhibitionActive(dossier));
}

function getActiveCelluleInhibeeDossiers(celluleNumber) {
  return getActiveCelluleDossiers(celluleNumber).filter(isDossierInhibitionActive);
}

function setCelluleCycleSection(celluleNumber, chariotNumber, section) {
  const data = { celluleNumber, celluleSection: section || "hub" };
  if (chariotNumber !== null && chariotNumber !== undefined) {
    data.chariotNumber = chariotNumber;
  }
  setState("cellule", data);
}

function createCelluleModeButton(label, subtext, isActive, isDisabled, onClick, extraClass = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `cellule-mode-button ${extraClass || ""}`.trim();
  if (isActive) button.classList.add("active");
  if (isDisabled) {
    button.classList.add("disabled");
    button.disabled = true;
  }
  button.onclick = isDisabled ? null : onClick;

  const strong = document.createElement("strong");
  strong.textContent = label;
  button.appendChild(strong);

  if (subtext) {
    const span = document.createElement("span");
    span.textContent = subtext;
    button.appendChild(span);
  }

  return button;
}

function createCelluleStatusPill(label, value, className) {
  const pill = document.createElement("div");
  pill.className = `cellule-status-pill ${className || ""}`.trim();

  const strong = document.createElement("strong");
  strong.textContent = String(value);

  const span = document.createElement("span");
  span.textContent = label;

  pill.appendChild(strong);
  pill.appendChild(span);
  return pill;
}

function getCelluleMainStatus(activeDefauts, activeInhibees) {
  const hasInhibee = activeInhibees.length > 0;
  const hasDefaut = activeDefauts.length > 0;

  if (hasInhibee) {
    return {
      className: "inhibee",
      title: "Cellule inhibée / sécurité terrain",
      detail: "Suivi inhibition ouvert : vérifier l’inhibition IHM, le plot aimanté, les actions menées, puis la remise en service."
    };
  }

  if (hasDefaut) {
    return {
      className: "defaut",
      title: "Cellule en défaut / surveillance J+1",
      detail: "Suivi défaut ouvert : compléter le message IHM, l’action immédiate, l’acquittement et le constat J+1."
    };
  }

  return {
    className: "ok",
    title: "Cellule sans dossier terrain ouvert",
    detail: "Aucun suivi défaut ou inhibition ouvert pour cette cellule."
  };
}

function createCelluleStateOverview(celluleNumber) {
  const activeDefauts = getActiveCelluleDefautDossiers(celluleNumber);
  const activeInhibees = getActiveCelluleInhibeeDossiers(celluleNumber);
  const closed = getClosedCelluleDossiers(celluleNumber);
  const mainStatus = getCelluleMainStatus(activeDefauts, activeInhibees);

  const wrapper = document.createElement("div");
  wrapper.className = "cellule-state-overview";

  const banner = document.createElement("div");
  banner.className = `cellule-state-banner ${mainStatus.className}`;

  const label = document.createElement("div");
  label.className = "cellule-state-label";
  label.textContent = "État actuel de la cellule";

  const title = document.createElement("div");
  title.className = "cellule-state-title";
  title.textContent = mainStatus.title;

  const detail = document.createElement("div");
  detail.className = "cellule-state-detail";
  detail.textContent = mainStatus.detail;

  banner.appendChild(label);
  banner.appendChild(title);
  banner.appendChild(detail);
  wrapper.appendChild(banner);

  const status = document.createElement("div");
  status.className = "cellule-status-grid cellule-status-grid-compact";
  status.appendChild(createCelluleStatusPill("Défaut ouvert", activeDefauts.length, activeDefauts.length > 0 ? "defaut" : "ok"));
  status.appendChild(createCelluleStatusPill("Inhibition / plot", activeInhibees.length, activeInhibees.length > 0 ? "inhibee" : "ok"));
  status.appendChild(createCelluleStatusPill("Historique", closed.length, closed.length > 0 ? "history" : "ok"));
  wrapper.appendChild(status);

  if (activeInhibees.length > 0) {
    const warning = document.createElement("div");
    warning.className = "cellule-security-warning";
    warning.textContent = "⛔ Cellule en suivi inhibition : ne pas remettre de contenant tant que la remise en service et le retrait du plot ne sont pas confirmés.";
    wrapper.appendChild(warning);
  }

  return wrapper;
}

function createCelluleWorkspaceHeader(celluleNumber, chariotNumber) {
  ensureCelluleDossiers(celluleNumber);

  const activeDefauts = getActiveCelluleDefautDossiers(celluleNumber);
  const activeInhibees = getActiveCelluleInhibeeDossiers(celluleNumber);

  const hasInhibee = activeInhibees.length > 0;

  const subtitle =
    chariotNumber !== null && chariotNumber !== undefined
      ? `Chariot ${chariotNumber} • ${getTrainLabelForCellule(celluleNumber)}`
      : getTrainLabelForCellule(celluleNumber);

  const card = createDataCard(`Cellule ${celluleNumber}`, subtitle);
  card.classList.add("cellule-workspace-card", "cellule-menu-card");

  card.appendChild(createCelluleStateOverview(celluleNumber));

  const navTitle = document.createElement("div");
  navTitle.className = "cellule-menu-title";
  navTitle.textContent = "Choisir le suivi à ouvrir";
  card.appendChild(navTitle);

  const nav = document.createElement("div");
  nav.className = "cellule-mode-grid cellule-main-menu-grid";

  nav.appendChild(
    createCelluleModeButton(
      "Contrôle de routine",
      "Tableau pièces existant + commentaires",
      false,
      false,
      () => setCelluleCycleSection(celluleNumber, chariotNumber, "routine"),
      "routine"
    )
  );

  nav.appendChild(
    createCelluleModeButton(
      "Suivi cellule en défaut",
      hasInhibee
        ? "Grisé : la cellule est déjà en suivi inhibition"
        : activeDefauts.length > 0
          ? "Compléter le défaut IHM / J+1 ouvert"
          : "Déclarer un nouveau défaut IHM",
      false,
      hasInhibee,
      () => setCelluleCycleSection(celluleNumber, chariotNumber, "defaut"),
      "defaut"
    )
  );

  nav.appendChild(
    createCelluleModeButton(
      "Suivi cellule inhibée",
      hasInhibee
        ? "Inhibition IHM, plot, action, remise en service"
        : "Grisé : aucune inhibition ouverte",
      false,
      !hasInhibee,
      () => setCelluleCycleSection(celluleNumber, chariotNumber, "inhibee"),
      "inhibee"
    )
  );

  card.appendChild(nav);
  return card;
}

function createBackToCelluleMenuButton(celluleNumber, chariotNumber) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "back-button cellule-menu-back-button";
  button.textContent = "← Menu cellule";
  button.onclick = () => setCelluleCycleSection(celluleNumber, chariotNumber, "hub");
  return button;
}

function createCelluleSubPageHeader(celluleNumber, chariotNumber, title, subtitle) {
  const card = createDataCard(title, subtitle || "");
  card.classList.add("cellule-workspace-card", "cellule-subpage-header");

  const context = document.createElement("div");
  context.className = "cellule-subpage-context";
  context.textContent =
    chariotNumber !== null && chariotNumber !== undefined
      ? `Cellule ${celluleNumber} • Chariot ${chariotNumber} • ${getTrainLabelForCellule(celluleNumber)}`
      : `Cellule ${celluleNumber} • ${getTrainLabelForCellule(celluleNumber)}`;

  card.appendChild(context);
  card.appendChild(createCelluleStateOverview(celluleNumber));
  return card;
}

function openCelluleInhibitionFromDefaut(celluleNumber, chariotNumber = null) {
  const dossier = getActiveCelluleDefautDossiers(celluleNumber)[0];

  if (!dossier) {
    alert("Aucun suivi cellule en défaut ouvert à basculer en cellule inhibée.");
    return;
  }

  openCelluleInhibitionForDossier(celluleNumber, dossier.id, chariotNumber);
}

function openCelluleInhibitionForDossier(celluleNumber, dossierId, chariotNumber = null) {
  const dossier = ensureCelluleDossiers(celluleNumber).find((item) => item.id === dossierId);

  if (!dossier) return;

  dossier.constatJ1 = dossier.constatJ1 || "NOK";
  dossier.dateConstatJ1 = dossier.dateConstatJ1 || getTodayIsoDate();
  dossier.statut = "inhibee";
  dossier.celluleInhibee = true;
  dossier.inhibitionIhm = true;
  dossier.plotPose = true;
  dossier.dateInhibition = dossier.dateInhibition || getTodayIsoDate();
  dossier.decisionJ1 = dossier.decisionJ1 || "Cellule inhibée sur IHM et plot aimanté posé.";

  saveCelluleCycleChange(celluleNumber);
  setCelluleCycleSection(celluleNumber, chariotNumber, "inhibee");
}

function createCelluleDefautDossierEditor(celluleNumber, dossier, chariotNumber = null) {
  const box = document.createElement("div");
  box.className = "cycle-dossier-card cycle-dossier-card-focused";

  const header = document.createElement("div");
  header.className = "cycle-dossier-header";

  const titleWrap = document.createElement("div");
  titleWrap.className = "cycle-dossier-title-wrap";

  const title = document.createElement("div");
  title.className = "cycle-dossier-title";
  title.textContent = `Défaut cellule • ${dossier.dateDefaut || "sans date"}`;

  titleWrap.appendChild(title);
  titleWrap.appendChild(createCyclePhaseBadge(dossier));

  const deleteBtn = createCycleButton("Supprimer", "model-delete-button", () => {
    deleteCelluleDossier(celluleNumber, dossier.id);
  });

  header.appendChild(titleWrap);
  header.appendChild(deleteBtn);
  box.appendChild(header);

  const j0 = createCycleSection("1. Défaut IHM / action immédiate");
  const gridJ0 = document.createElement("div");
  gridJ0.className = "cycle-fields-grid";

  gridJ0.appendChild(createCycleField("Date défaut", createCycleDateInput(dossier.dateDefaut, (value) => {
    dossier.dateDefaut = value;
    saveCelluleCycleChange(celluleNumber);
  })));

  gridJ0.appendChild(createCycleField("Technicien J0", createCycleTextInput(dossier.techJ0, "Nom", (value) => {
    dossier.techJ0 = value;
    saveCelluleCycleChange(celluleNumber);
  })));

  gridJ0.appendChild(createCycleField("Message défaut IHM", createCycleTextInput(dossier.messageIhm, "Message affiché sur l'IHM", (value) => {
    dossier.messageIhm = value;
    saveCelluleCycleChange(celluleNumber);
  }, true), true));

  gridJ0.appendChild(createCycleField("Contrôle visuel", createCycleTextInput(dossier.controleVisuel, "Contrôle réalisé sur place", (value) => {
    dossier.controleVisuel = value;
    saveCelluleCycleChange(celluleNumber);
  }, true), true));

  gridJ0.appendChild(createCycleField("Action immédiate", createCycleTextInput(dossier.actionImmediate, "Action simple faite immédiatement", (value) => {
    dossier.actionImmediate = value;
    saveCelluleCycleChange(celluleNumber);
  }, true), true));

  const checksJ0 = document.createElement("div");
  checksJ0.className = "cycle-check-row cycle-field-wide";
  checksJ0.appendChild(createCycleCheckbox("Défaut acquitté", dossier.defautAcquitte, (checked) => {
    dossier.defautAcquitte = checked;
    if (checked && dossier.statut === "defaut_signale") {
      dossier.statut = "surveillance_j1";
    }
    saveCelluleCycleChange(celluleNumber);
  }));
  gridJ0.appendChild(checksJ0);

  j0.appendChild(gridJ0);
  box.appendChild(j0);

  const j1 = createCycleSection("2. Constat J+1");
  const gridJ1 = document.createElement("div");
  gridJ1.className = "cycle-fields-grid";

  gridJ1.appendChild(createCycleField("Date constat J+1", createCycleDateInput(dossier.dateConstatJ1, (value) => {
    dossier.dateConstatJ1 = value;
    saveCelluleCycleChange(celluleNumber);
  })));

  gridJ1.appendChild(createCycleField("Technicien J+1", createCycleTextInput(dossier.techJ1, "Nom", (value) => {
    dossier.techJ1 = value;
    saveCelluleCycleChange(celluleNumber);
  })));

  gridJ1.appendChild(createCycleField("Constat J+1", createCycleSelect(dossier.constatJ1, [
    { value: "", label: "À renseigner" },
    { value: "OK", label: "OK - plus de défaut" },
    { value: "NOK", label: "NOK - défaut persistant" },
    { value: "A_SURVEILLER", label: "À surveiller" }
  ], (value) => {
    dossier.constatJ1 = value;
    dossier.dateConstatJ1 = dossier.dateConstatJ1 || getTodayIsoDate();
    if (value === "NOK") {
      dossier.statut = "j1_nok";
      dossier.decisionJ1 = dossier.decisionJ1 || "Défaut persistant : prévoir inhibition si confirmé terrain.";
    } else if (value === "OK") {
      dossier.decisionJ1 = dossier.decisionJ1 || "Clôturer si confirmé.";
    } else if (value === "A_SURVEILLER") {
      dossier.statut = "surveillance_j1";
      dossier.decisionJ1 = dossier.decisionJ1 || "Garder en surveillance.";
    }
    saveCelluleCycleChange(celluleNumber);
  })));

  gridJ1.appendChild(createCycleField("Décision / remarque J+1", createCycleTextInput(dossier.decisionJ1, "Décision prise après contrôle J+1", (value) => {
    dossier.decisionJ1 = value;
    saveCelluleCycleChange(celluleNumber);
  }, true), true));

  j1.appendChild(gridJ1);

  const actions = document.createElement("div");
  actions.className = "cycle-action-grid";
  actions.appendChild(createCycleButton("J+1 OK : clôturer", "model-add-button", () => {
    dossier.constatJ1 = "OK";
    dossier.dateConstatJ1 = dossier.dateConstatJ1 || getTodayIsoDate();
    dossier.actionFinale = dossier.actionFinale || "Constat J+1 OK : défaut non reproduit.";
    closeCelluleDossier(celluleNumber, dossier.id, "OK");
  }));
  actions.appendChild(createCycleButton("J+1 NOK : ouvrir suivi inhibée", "model-save-button", () => {
    openCelluleInhibitionForDossier(celluleNumber, dossier.id, chariotNumber);
  }));

  j1.appendChild(actions);
  box.appendChild(j1);

  return box;
}

function createCelluleInhibeeDossierEditor(celluleNumber, dossier) {
  const box = document.createElement("div");
  box.className = "cycle-dossier-card cycle-dossier-card-focused cycle-dossier-card-inhibee";

  const header = document.createElement("div");
  header.className = "cycle-dossier-header";

  const titleWrap = document.createElement("div");
  titleWrap.className = "cycle-dossier-title-wrap";

  const title = document.createElement("div");
  title.className = "cycle-dossier-title";
  title.textContent = `Cellule inhibée • ${dossier.dateInhibition || dossier.dateDefaut || "sans date"}`;

  titleWrap.appendChild(title);
  titleWrap.appendChild(createCyclePhaseBadge(dossier));

  const deleteBtn = createCycleButton("Supprimer", "model-delete-button", () => {
    deleteCelluleDossier(celluleNumber, dossier.id);
  });

  header.appendChild(titleWrap);
  header.appendChild(deleteBtn);
  box.appendChild(header);

  const origin = document.createElement("div");
  origin.className = "cycle-origin-box";
  origin.innerHTML = `
    <strong>Défaut d'origine</strong>
    <span>${dossier.messageIhm || "Message IHM non renseigné"}</span>
    <span>Constat J+1 : ${dossier.constatJ1 || "NOK / non renseigné"}</span>
  `;
  box.appendChild(origin);

  const inhibition = createCycleSection("1. Suivi cellule inhibée / sécurité terrain");
  const gridInhibition = document.createElement("div");
  gridInhibition.className = "cycle-fields-grid";

  gridInhibition.appendChild(createCycleField("Date inhibition", createCycleDateInput(dossier.dateInhibition, (value) => {
    dossier.dateInhibition = value;
    saveCelluleCycleChange(celluleNumber);
  })));

  gridInhibition.appendChild(createCycleField("Contrôle station", createCycleSelect(dossier.controleStation, [
    { value: "", label: "Non renseigné" },
    { value: "OK", label: "OK" },
    { value: "NOK", label: "NOK" }
  ], (value) => {
    dossier.controleStation = value;
    saveCelluleCycleChange(celluleNumber);
  })));

  const checksInhibition = document.createElement("div");
  checksInhibition.className = "cycle-check-row cycle-field-wide";
  checksInhibition.appendChild(createCycleCheckbox("Cellule inhibée sur IHM", dossier.inhibitionIhm, (checked) => {
    dossier.inhibitionIhm = checked;
    dossier.celluleInhibee = checked || dossier.plotPose;
    if (checked) {
      dossier.statut = "inhibee";
      dossier.dateInhibition = dossier.dateInhibition || getTodayIsoDate();
    }
    saveCelluleCycleChange(celluleNumber);
  }));
  checksInhibition.appendChild(createCycleCheckbox("Plot aimanté posé", dossier.plotPose, (checked) => {
    dossier.plotPose = checked;
    dossier.celluleInhibee = checked || dossier.inhibitionIhm;
    if (checked) {
      dossier.statut = "inhibee";
      dossier.dateInhibition = dossier.dateInhibition || getTodayIsoDate();
    }
    saveCelluleCycleChange(celluleNumber);
  }));
  gridInhibition.appendChild(checksInhibition);

  gridInhibition.appendChild(createCycleField("Action menée", createCycleTextInput(dossier.actionMenee, "Action faite sur cellule inhibée", (value) => {
    dossier.actionMenee = value;
    saveCelluleCycleChange(celluleNumber);
  }, true), true));

  gridInhibition.appendChild(createCycleField("Cause / pièce suspectée", createCycleTextInput(dossier.causeSuspectee, "Ex : câble, bouchon, moteur, capteur...", (value) => {
    dossier.causeSuspectee = value;
    saveCelluleCycleChange(celluleNumber);
  }, true), true));

  gridInhibition.appendChild(createCycleField("Action prévue", createCycleTextInput(dossier.actionPrevue, "À faire pour résoudre", (value) => {
    dossier.actionPrevue = value;
    saveCelluleCycleChange(celluleNumber);
  }, true), true));

  gridInhibition.appendChild(createCycleField("Commentaire inhibition", createCycleTextInput(dossier.commentaireInhibition, "Commentaire libre", (value) => {
    dossier.commentaireInhibition = value;
    saveCelluleCycleChange(celluleNumber);
  }, true), true));

  inhibition.appendChild(gridInhibition);
  box.appendChild(inhibition);

  const resolution = createCycleSection("2. Résolution / remise en service");
  const gridResolution = document.createElement("div");
  gridResolution.className = "cycle-fields-grid";

  gridResolution.appendChild(createCycleField("Date résolution", createCycleDateInput(dossier.dateResolution, (value) => {
    dossier.dateResolution = value;
    saveCelluleCycleChange(celluleNumber);
  })));

  gridResolution.appendChild(createCycleField("Technicien résolution", createCycleTextInput(dossier.techResolution, "Nom", (value) => {
    dossier.techResolution = value;
    saveCelluleCycleChange(celluleNumber);
  })));

  gridResolution.appendChild(createCycleField("Résultat final", createCycleSelect(dossier.resultatFinal, [
    { value: "", label: "Non renseigné" },
    { value: "OK", label: "OK" },
    { value: "NOK", label: "NOK" }
  ], (value) => {
    dossier.resultatFinal = value;
    saveCelluleCycleChange(celluleNumber);
  })));

  const checksResolution = document.createElement("div");
  checksResolution.className = "cycle-check-row cycle-field-wide";
  checksResolution.appendChild(createCycleCheckbox("Cellule désinhibée sur IHM", dossier.desinhibitionIhm, (checked) => {
    dossier.desinhibitionIhm = checked;
    saveCelluleCycleChange(celluleNumber);
  }));
  checksResolution.appendChild(createCycleCheckbox("Plot retiré", dossier.plotRetire, (checked) => {
    dossier.plotRetire = checked;
    saveCelluleCycleChange(celluleNumber);
  }));
  gridResolution.appendChild(checksResolution);

  gridResolution.appendChild(createCycleField("Action finale réalisée", createCycleTextInput(dossier.actionFinale, "Ex : câble remplacé, test OK, remise en service", (value) => {
    dossier.actionFinale = value;
    saveCelluleCycleChange(celluleNumber);
  }, true), true));

  resolution.appendChild(gridResolution);

  const resolutionActions = document.createElement("div");
  resolutionActions.className = "cycle-action-grid";
  resolutionActions.appendChild(createCycleButton("Clôturer le dossier", "model-save-button", () => {
    if (isDossierInhibitionActive(dossier) && (!dossier.desinhibitionIhm || !dossier.plotRetire)) {
      const confirmClose = confirm("Attention : la cellule semble encore inhibée. Confirmer la clôture sans désinhibition IHM ou retrait du plot ?");
      if (!confirmClose) return;
    }
    closeCelluleDossier(celluleNumber, dossier.id, dossier.resultatFinal || "OK");
  }));
  resolution.appendChild(resolutionActions);

  box.appendChild(resolution);
  return box;
}

function renderCelluleRoutineSection(celluleNumber, chariotNumber = null) {
  const key = getCelluleKey(celluleNumber);
  const state = getCelluleState(celluleNumber);

  const subtitle =
    chariotNumber !== null && chariotNumber !== undefined
      ? `Chariot ${chariotNumber} • ${getTrainLabelForCellule(celluleNumber)}`
      : getTrainLabelForCellule(celluleNumber);

  const card = createDataCard(`Contrôle de routine cellule ${celluleNumber}`, subtitle);
  card.appendChild(createCelluleHeaderStates(celluleNumber));

  card.appendChild(createSchemaActionsCard("Voir schéma", SCHEMA_PATHS.cellule, `Schéma de la cellule ${celluleNumber}`));
  card.appendChild(createStatusLight(state === "off" ? false : true));
  card.appendChild(createTable(MODELE_CELLULE, DATA_CELLULES, key));

  appView.appendChild(card);
  appView.appendChild(createCommentsCard(`Commentaires de la cellule ${celluleNumber}`, COMMENTS_CELLULES, key));
}

function renderCelluleDefautSection(celluleNumber, chariotNumber = null) {
  const activeInhibees = getActiveCelluleInhibeeDossiers(celluleNumber);
  const activeDefauts = getActiveCelluleDefautDossiers(celluleNumber);

  const card = createDataCard("Suivi cellule en défaut", "Défaut IHM → action immédiate → constat J+1");

  if (activeInhibees.length > 0) {
    const locked = document.createElement("div");
    locked.className = "cycle-empty cycle-locked";
    locked.textContent = "Ce suivi défaut est verrouillé : la cellule est maintenant suivie comme cellule inhibée.";
    card.appendChild(locked);
    appView.appendChild(card);
    return;
  }

  const addActions = document.createElement("div");
  addActions.className = "cycle-action-grid";
  addActions.appendChild(createCycleButton("+ Déclarer un défaut cellule", "model-add-button", () => {
    addCelluleDossier(celluleNumber);
    setCelluleCycleSection(celluleNumber, chariotNumber, "defaut");
  }));
  card.appendChild(addActions);

  if (activeDefauts.length === 0) {
    const empty = document.createElement("div");
    empty.className = "cycle-empty";
    empty.textContent = "Aucun défaut ouvert. Clique sur le bouton ci-dessus pour démarrer un suivi défaut IHM.";
    card.appendChild(empty);
  } else {
    activeDefauts.forEach((dossier) => {
      card.appendChild(createCelluleDefautDossierEditor(celluleNumber, dossier, chariotNumber));
    });
  }

  appView.appendChild(card);
}

function renderCelluleInhibeeSection(celluleNumber) {
  const activeInhibees = getActiveCelluleInhibeeDossiers(celluleNumber);
  const card = createDataCard("Suivi cellule inhibée", "Inhibition IHM → plot → action → remise en service");

  const note = document.createElement("p");
  note.className = "cycle-note";
  note.textContent = "Le plot aimanté est un marquage terrain de sécurité. Il ne fait pas partie du tableau des pièces.";
  card.appendChild(note);

  if (activeInhibees.length === 0) {
    const empty = document.createElement("div");
    empty.className = "cycle-empty";
    empty.textContent = "Aucune cellule inhibée ouverte. Il faut d'abord basculer un suivi défaut vers le suivi cellule inhibée.";
    card.appendChild(empty);
  } else {
    activeInhibees.forEach((dossier) => {
      card.appendChild(createCelluleInhibeeDossierEditor(celluleNumber, dossier));
    });
  }

  appView.appendChild(card);
}

function renderCelluleHistorySection(celluleNumber) {
  const closed = getClosedCelluleDossiers(celluleNumber);
  const card = createDataCard("Historique cellule", "Dossiers défaut / inhibition clôturés");

  if (closed.length === 0) {
    const empty = document.createElement("div");
    empty.className = "cycle-empty";
    empty.textContent = "Aucun dossier clôturé pour cette cellule.";
    card.appendChild(empty);
  } else {
    const history = document.createElement("div");
    history.className = "cycle-history cycle-history-full";

    closed.forEach((dossier) => {
      const item = document.createElement("div");
      item.className = "cycle-history-item";
      item.textContent = `${dossier.dateDefaut || "Sans date"} → ${dossier.dateResolution || "clôturé"} • ${dossier.messageIhm || "Défaut cellule"} • ${dossier.actionFinale || dossier.resultatFinal || ""}`;
      history.appendChild(item);
    });

    card.appendChild(history);
  }

  appView.appendChild(card);
}

function renderCelluleHubHelp(celluleNumber) {
  const activeDefauts = getActiveCelluleDefautDossiers(celluleNumber);
  const activeInhibees = getActiveCelluleInhibeeDossiers(celluleNumber);

  const card = createDataCard("Choisir le suivi à ouvrir", "Vue simplifiée");

  const message = document.createElement("div");
  message.className = "cycle-empty cycle-hub-help";

  if (activeInhibees.length > 0) {
    message.textContent = "Cette cellule est en suivi inhibition. Ouvre 'Suivi cellule inhibée' pour compléter l'action, la remise en service et le retrait du plot.";
  } else if (activeDefauts.length > 0) {
    message.textContent = "Cette cellule a un défaut ouvert. Ouvre 'Suivi cellule en défaut' pour compléter J0/J+1, ou bascule vers 'Suivi cellule inhibée' si le défaut persiste.";
  } else {
    message.textContent = "Aucun dossier ouvert. Utilise 'Contrôle de routine' pour le tableau pièces, ou 'Suivi cellule en défaut' pour déclarer un défaut IHM.";
  }

  card.appendChild(message);
  appView.appendChild(card);
}

function renderCelluleCycleHubView(celluleNumber, chariotNumber = null) {
  clearView();

  const selectedSection = getCelluleCycleSelectedSection();

  if (selectedSection === "hub") {
    appView.appendChild(createBackButton());
    appView.appendChild(createCelluleWorkspaceHeader(celluleNumber, chariotNumber));
    return;
  }

  appView.appendChild(createBackToCelluleMenuButton(celluleNumber, chariotNumber));

  if (selectedSection === "routine") {
    appView.appendChild(
      createCelluleSubPageHeader(
        celluleNumber,
        chariotNumber,
        "Contrôle de routine",
        "Tableau pièces existant et commentaires classiques"
      )
    );
    renderCelluleRoutineSection(celluleNumber, chariotNumber);
    return;
  }

  if (selectedSection === "defaut") {
    appView.appendChild(
      createCelluleSubPageHeader(
        celluleNumber,
        chariotNumber,
        "Suivi cellule en défaut",
        "Défaut IHM → action immédiate → acquittement → constat J+1"
      )
    );
    renderCelluleDefautSection(celluleNumber, chariotNumber);
    return;
  }

  if (selectedSection === "inhibee") {
    appView.appendChild(
      createCelluleSubPageHeader(
        celluleNumber,
        chariotNumber,
        "Suivi cellule inhibée",
        "Inhibition IHM → plot aimanté → actions → remise en service"
      )
    );
    renderCelluleInhibeeSection(celluleNumber);
    return;
  }

  if (selectedSection === "history") {
    appView.appendChild(
      createCelluleSubPageHeader(
        celluleNumber,
        chariotNumber,
        "Historique cellule",
        "Dossiers défaut / inhibition clôturés"
      )
    );
    renderCelluleHistorySection(celluleNumber);
    return;
  }

  setCelluleCycleSection(celluleNumber, chariotNumber, "hub");
}

function createCelluleCycleCard(celluleNumber) {
  const card = createDataCard(
    "Cycle terrain cellule",
    "Défaut IHM → J+1 → inhibition/plot → résolution"
  );

  const note = document.createElement("p");
  note.className = "cycle-note";
  note.textContent = "Cette carte est conservée pour compatibilité, mais l'affichage principal utilise maintenant les boutons Contrôle / Défaut / Inhibition.";
  card.appendChild(note);

  card.appendChild(createCelluleCycleSummary(celluleNumber));
  return card;
}

function renderCellulesCycleView() {
  clearView();
  appView.appendChild(createBackButton());

  const counters = countCelluleCycleCounters();
  const card = createDataCard(
    "Suivi défauts cellules",
    `${counters.openProblems} dossier(s) ouvert(s)`
  );

  const intro = document.createElement("p");
  intro.textContent =
    "Cette page suit le vrai cycle terrain : défaut IHM, action immédiate, contrôle J+1, inhibition éventuelle, plot posé, puis résolution.";
  card.appendChild(intro);

  const quickForm = document.createElement("div");
  quickForm.className = "cycle-quick-form";

  const cellInput = document.createElement("input");
  cellInput.type = "number";
  cellInput.className = "model-input";
  cellInput.min = String(CONFIG_APP.CELLULE_MIN);
  cellInput.max = String(CONFIG_APP.CELLULE_MAX);
  cellInput.placeholder = "N° cellule";

  const messageInput = document.createElement("input");
  messageInput.type = "text";
  messageInput.className = "model-input";
  messageInput.placeholder = "Message défaut IHM";

  const techInput = document.createElement("input");
  techInput.type = "text";
  techInput.className = "model-input";
  techInput.placeholder = "Technicien";

  const addBtn = createCycleButton("Créer dossier", "model-add-button", () => {
    const celluleNumber = Number(cellInput.value);
    if (!isValidCelluleNumber(celluleNumber)) {
      alert(`Numéro cellule entre ${CONFIG_APP.CELLULE_MIN} et ${CONFIG_APP.CELLULE_MAX}.`);
      return;
    }

    addCelluleDossier(celluleNumber, {
      messageIhm: messageInput.value || "",
      techJ0: techInput.value || ""
    });

    setState("cellule", { celluleNumber, celluleSection: "defaut" });
  });

  quickForm.appendChild(cellInput);
  quickForm.appendChild(messageInput);
  quickForm.appendChild(techInput);
  quickForm.appendChild(addBtn);
  card.appendChild(quickForm);

  const printBtn = createCycleButton("Imprimer le suivi ouvert", "model-save-button", () => {
    window.print();
  });
  card.appendChild(printBtn);

  appView.appendChild(card);

  const active = getAllCelluleDossiers().filter(isCelluleDossierActive);
  const listCard = createDataCard("Dossiers ouverts", "Clique sur une cellule pour compléter le dossier");

  if (active.length === 0) {
    const empty = document.createElement("div");
    empty.className = "cycle-empty";
    empty.textContent = "Aucun dossier cellule ouvert.";
    listCard.appendChild(empty);
  } else {
    const wrapper = document.createElement("div");
    wrapper.className = "table-wrapper";

    const table = document.createElement("table");
    table.className = "parts-table cycle-global-table";
    table.appendChild(
      createTableHead([
        "Cellule",
        "Phase",
        "Date défaut",
        "Message IHM",
        "J+1",
        "Inhibition / plot",
        "Action prévue",
        "Action"
      ])
    );

    const tbody = document.createElement("tbody");

    active.forEach((dossier) => {
      const tr = document.createElement("tr");

      if (isDossierInhibitionActive(dossier)) {
        tr.classList.add("row-cellule-inhibee");
      } else {
        tr.classList.add("row-cellule-defaut");
      }

      const values = [
        `Cellule ${dossier.celluleNumber}`,
        getCelluleDossierPhaseLabel(dossier),
        dossier.dateDefaut || "",
        dossier.messageIhm || "",
        dossier.constatJ1 || "",
        isDossierInhibitionActive(dossier)
          ? `${dossier.inhibitionIhm ? "IHM inhibée" : ""}${dossier.inhibitionIhm && dossier.plotPose ? " • " : ""}${dossier.plotPose ? "plot posé" : ""}`
          : "",
        dossier.actionPrevue || dossier.decisionJ1 || ""
      ];

      values.forEach((value) => {
        const td = document.createElement("td");
        td.textContent = value;
        tr.appendChild(td);
      });

      const tdAction = document.createElement("td");
      tdAction.appendChild(
        createCycleButton("Ouvrir", "model-add-button", () => {
          setState("cellule", { celluleNumber: dossier.celluleNumber, celluleSection: isDossierInhibitionActive(dossier) ? "inhibee" : "defaut" });
        })
      );
      tr.appendChild(tdAction);

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    wrapper.appendChild(table);
    listCard.appendChild(wrapper);
  }

  appView.appendChild(listCard);
}

function installCelluleCycleViewHooks() {
  if (typeof renderHomeView === "function" && !renderHomeView.__celluleCycleWrapped) {
    const originalRenderHomeView = renderHomeView;
    renderHomeView = function () {
      originalRenderHomeView();

      const adminButton = appView.querySelector(".admin-button");
      const button = createButton(
        "Suivi défauts cellules",
        () => setState("cellulesCycle"),
        "big",
        "cellule-cycle-home-button",
        countCelluleCycleCounters(),
        "Défaut IHM • J+1 • inhibition • plot • résolution"
      );

      if (adminButton) {
        appView.insertBefore(button, adminButton);
      } else {
        appView.appendChild(button);
      }
    };
    renderHomeView.__celluleCycleWrapped = true;
  }

  if (typeof renderCelluleView === "function" && !renderCelluleView.__celluleCycleWrapped) {
    renderCelluleView = function (celluleNumber, chariotNumber = null) {
      renderCelluleCycleHubView(celluleNumber, chariotNumber);
    };
    renderCelluleView.__celluleCycleWrapped = true;
  }

  if (typeof renderCurrentState === "function" && !renderCurrentState.__celluleCycleWrapped) {
    const originalRenderCurrentState = renderCurrentState;
    renderCurrentState = function () {
      if (currentState && currentState.type === "cellulesCycle") {
        clearView();
        updateTopbarTitle();
        renderCellulesCycleView();
        updateHomeLegendBar();
        updateHomeCelluleBar();
        return;
      }

      originalRenderCurrentState();
    };
    renderCurrentState.__celluleCycleWrapped = true;
  }
}

installCelluleCycleStorageHooks();
installCelluleCycleViewHooks();
