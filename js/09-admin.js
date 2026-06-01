function createEmptyModelRow() {
  return {
    piece: "",
    reference: "",
    repere: ""
  };
}

function createModelTextInput(value, placeholder, onInput) {
  const input = document.createElement("input");
  input.className = "model-input";
  input.value = value || "";
  input.placeholder = placeholder;
  input.oninput = onInput;
  return input;
}

function createModelEditorRow(model, item, index) {
  const row = document.createElement("div");
  row.className = "model-row";

  const inputPiece = createModelTextInput(item.piece, "Pièce", (e) => {
    item.piece = e.target.value;
  });

  const inputReference = createModelTextInput(item.reference, "Référence", (e) => {
    item.reference = e.target.value;
  });

  const inputRepere = createModelTextInput(item.repere, "Repère", (e) => {
    item.repere = e.target.value;
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "model-delete-button";
  deleteBtn.textContent = "Supprimer";
  deleteBtn.onclick = () => {
    model.splice(index, 1);
    renderCurrentState();
  };

  row.appendChild(inputPiece);
  row.appendChild(inputReference);
  row.appendChild(inputRepere);
  row.appendChild(deleteBtn);

  return row;
}

function createModelEditorCard(title, model, onSave) {
  const safeModel = Array.isArray(model) ? model : [];

  const card = document.createElement("div");
  card.className = "model-card";

  const h2 = document.createElement("h2");
  h2.textContent = title;
  card.appendChild(h2);

  const p = document.createElement("p");
  p.textContent = "Tu définis ici les lignes du modèle : pièce, référence et repère.";
  card.appendChild(p);

  const rows = document.createElement("div");
  rows.className = "model-rows";

  if (safeModel.length === 0) {
    const empty = document.createElement("div");
    empty.className = "info-card";

    const txt = document.createElement("p");
    txt.textContent = "Le modèle est vide. Ajoute une ligne pour commencer.";
    empty.appendChild(txt);

    rows.appendChild(empty);
  } else {
    safeModel.forEach((item, index) => {
      rows.appendChild(createModelEditorRow(safeModel, item, index));
    });
  }

  card.appendChild(rows);

  const actions = document.createElement("div");
  actions.className = "model-actions";

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "model-add-button";
  addBtn.textContent = "Ajouter une ligne";
  addBtn.onclick = () => {
    safeModel.push(createEmptyModelRow());
    renderCurrentState();
  };

  const saveBtn = document.createElement("button");
  saveBtn.type = "button";
  saveBtn.className = "model-save-button";
  saveBtn.textContent = "Enregistrer le modèle";
  saveBtn.onclick = () => {
    syncAllDataWithModels();
    onSave();
    alert("Modèle mis à jour.");
  };

  actions.appendChild(addBtn);
  actions.appendChild(saveBtn);
  card.appendChild(actions);

  return card;
}

function getInjecteurIdsForAdmin() {
  if (
    typeof CONFIG_APP === "object" &&
    CONFIG_APP &&
    Array.isArray(CONFIG_APP.INJECTEUR_IDS) &&
    CONFIG_APP.INJECTEUR_IDS.length
  ) {
    return CONFIG_APP.INJECTEUR_IDS;
  }

  return [530, 531, 532, 533];
}

function createEmptyInjecteurAdminBranch() {
  return {
    convoyeur: [],
    motorisation: []
  };
}

function ensureAdminInjecteurModelBranch(injecteurNumber, convoyeurKey, type) {
  if (
    !MODELE_INJECTEUR_CONVOYEURS[injecteurNumber] ||
    typeof MODELE_INJECTEUR_CONVOYEURS[injecteurNumber] !== "object"
  ) {
    MODELE_INJECTEUR_CONVOYEURS[injecteurNumber] = {};
  }

  if (
    !MODELE_INJECTEUR_CONVOYEURS[injecteurNumber][convoyeurKey] ||
    typeof MODELE_INJECTEUR_CONVOYEURS[injecteurNumber][convoyeurKey] !== "object"
  ) {
    MODELE_INJECTEUR_CONVOYEURS[injecteurNumber][convoyeurKey] =
      createEmptyInjecteurAdminBranch();
  }

  if (!Array.isArray(MODELE_INJECTEUR_CONVOYEURS[injecteurNumber][convoyeurKey][type])) {
    MODELE_INJECTEUR_CONVOYEURS[injecteurNumber][convoyeurKey][type] = [];
  }
}

function normalizeInjecteurAdminRow(row = {}) {
  return {
    piece: row.piece || row.article || "",
    reference: row.reference || "",
    repere: row.repere || row.repereSchema || row.emplacement || ""
  };
}

function syncSharedInjecteurSystemToAll(convoyeurKey, type) {
  const injecteurIds = getInjecteurIdsForAdmin();
  const masterInjecteur = injecteurIds[0];

  ensureAdminInjecteurModelBranch(masterInjecteur, convoyeurKey, type);

  const sourceRows =
    MODELE_INJECTEUR_CONVOYEURS[masterInjecteur][convoyeurKey][type] || [];

  injecteurIds.forEach((injecteurNumber) => {
    ensureAdminInjecteurModelBranch(injecteurNumber, convoyeurKey, type);

    MODELE_INJECTEUR_CONVOYEURS[injecteurNumber][convoyeurKey][type] =
      sourceRows.map((row) => normalizeInjecteurAdminRow(row));
  });
}

function getInjecteurSchemaPath(convoyeurKey, type) {
  if (type === "motorisation") {
    return SCHEMA_PATHS.injecteurs.motorisation;
  }

  return SCHEMA_PATHS.injecteurs.convoyeurs?.[convoyeurKey] || null;
}

function updateSharedInjecteurModelField(masterInjecteur, convoyeurKey, type, index, field, value) {
  ensureAdminInjecteurModelBranch(masterInjecteur, convoyeurKey, type);

  const row = MODELE_INJECTEUR_CONVOYEURS[masterInjecteur][convoyeurKey][type][index];
  if (!row || typeof row !== "object") {
    return;
  }

  row[field] = value;

  if (field === "piece") {
    delete row.article;
  }

  if (field === "repere") {
    delete row.repereSchema;
    delete row.emplacement;
  }

  syncSharedInjecteurSystemToAll(convoyeurKey, type);
  saveAll();
}

function createInjecteurAdminRow(masterInjecteur, convoyeurKey, type, row, index) {
  const rowEl = document.createElement("div");
  rowEl.className = "model-row";

  const pieceInput = createModelTextInput(
    row.piece || row.article || "",
    "Pièce",
    (e) => {
      updateSharedInjecteurModelField(
        masterInjecteur,
        convoyeurKey,
        type,
        index,
        "piece",
        e.target.value
      );
    }
  );

  const referenceInput = createModelTextInput(
    row.reference || "",
    "Référence",
    (e) => {
      updateSharedInjecteurModelField(
        masterInjecteur,
        convoyeurKey,
        type,
        index,
        "reference",
        e.target.value
      );
    }
  );

  const repereInput = createModelTextInput(
    row.repere || row.repereSchema || row.emplacement || "",
    "Repère",
    (e) => {
      updateSharedInjecteurModelField(
        masterInjecteur,
        convoyeurKey,
        type,
        index,
        "repere",
        e.target.value
      );
    }
  );

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "model-delete-button";
  deleteBtn.textContent = "Supprimer";
  deleteBtn.onclick = () => {
    MODELE_INJECTEUR_CONVOYEURS[masterInjecteur][convoyeurKey][type].splice(index, 1);
    syncSharedInjecteurSystemToAll(convoyeurKey, type);
    saveAll();
    renderCurrentState();
  };

  rowEl.appendChild(pieceInput);
  rowEl.appendChild(referenceInput);
  rowEl.appendChild(repereInput);
  rowEl.appendChild(deleteBtn);

  return rowEl;
}

function createAdminInjecteurModelBlock(injecteurNumber, convoyeurKey, type) {
  const injecteurIds = getInjecteurIdsForAdmin();
  const masterInjecteur = injecteurIds[0];
  const typeLabel = type === "motorisation" ? "Motorisation" : "Convoyeur";

  ensureAdminInjecteurModelBranch(masterInjecteur, convoyeurKey, type);

  const block = document.createElement("div");
  block.className = "data-card";

  const title = document.createElement("h2");
  title.textContent = typeLabel;
  block.appendChild(title);

  const schemaActions = document.createElement("div");
  schemaActions.className = "schema-actions";
  schemaActions.appendChild(
    createSchemaButton(
      `Voir schéma ${typeLabel.toLowerCase()}`,
      getInjecteurSchemaPath(convoyeurKey, type),
      `Schéma ${typeLabel.toLowerCase()}`
    )
  );
  block.appendChild(schemaActions);

  const rowsWrap = document.createElement("div");
  rowsWrap.className = "model-rows";

  MODELE_INJECTEUR_CONVOYEURS[masterInjecteur][convoyeurKey][type].forEach((row, index) => {
    rowsWrap.appendChild(
      createInjecteurAdminRow(masterInjecteur, convoyeurKey, type, row, index)
    );
  });

  block.appendChild(rowsWrap);

  const actions = document.createElement("div");
  actions.className = "model-actions";

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "model-add-button";
  addBtn.textContent = `Ajouter une ligne ${typeLabel.toLowerCase()}`;
  addBtn.onclick = () => {
    MODELE_INJECTEUR_CONVOYEURS[masterInjecteur][convoyeurKey][type].push(
      createEmptyModelRow()
    );
    syncSharedInjecteurSystemToAll(convoyeurKey, type);
    saveAll();
    renderCurrentState();
  };

  actions.appendChild(addBtn);
  block.appendChild(actions);

  return block;
}

function createAdminNavButton(label, stateType) {
  return createButton(
    label,
    () => setState(stateType),
    "big",
    "primary",
    createEmptyCounters()
  );
}

function renderAdminInjecteursView() {
  clearView();
  appView.appendChild(createBackButton());

  const card = createDataCard("Modèle Injecteurs", "Choisis un système");

  const schemaActions = document.createElement("div");
  schemaActions.className = "schema-actions";
  schemaActions.appendChild(
    createSchemaButton(
      "Voir schéma général injecteurs",
      SCHEMA_PATHS.injecteurs.general,
      "Schéma général injecteurs"
    )
  );
  card.appendChild(schemaActions);

  const grid = document.createElement("div");
  grid.className = "toolbar-grid";

  const injecteurIds = getInjecteurIdsForAdmin();
  const masterInjecteur = injecteurIds[0];

  INJECTEUR_CONVOYEURS.forEach((conv) => {
    grid.appendChild(
      createButton(
        conv.label,
        () =>
          setState("adminInjecteurPieces", {
            injecteurNumber: masterInjecteur,
            convoyeurKey: conv.key
          }),
        "big",
        "primary"
      )
    );
  });

  card.appendChild(grid);
  appView.appendChild(card);
}

function renderAdminInjecteurDetailView(injecteurNumber) {
  setState("adminInjecteurs", {}, false);
}

function renderAdminInjecteurPiecesView(injecteurNumber, convoyeurKey) {
  clearView();
  appView.appendChild(createBackButton());

  const injecteurIds = getInjecteurIdsForAdmin();
  const masterInjecteur = injecteurIds[0];

  const convoyeurInfo =
    INJECTEUR_CONVOYEURS.find((c) => c.key === convoyeurKey) || {
      label: convoyeurKey
    };

  const card = createDataCard(convoyeurInfo.label, "Schéma + modèle");

  const topActions = document.createElement("div");
  topActions.className = "model-actions";
  topActions.appendChild(
    createSchemaButton(
      "Voir schéma général injecteurs",
      SCHEMA_PATHS.injecteurs.general,
      "Schéma général injecteurs"
    )
  );
  card.appendChild(topActions);

  card.appendChild(
    createAdminInjecteurModelBlock(masterInjecteur, convoyeurKey, "convoyeur")
  );

  card.appendChild(
    createAdminInjecteurModelBlock(masterInjecteur, convoyeurKey, "motorisation")
  );

  appView.appendChild(card);
}

function renderAdminView() {
  clearView();
  appView.appendChild(createBackButton());

  appView.appendChild(
    createInfoCard(
      "Administration des modèles",
      "Tu définis ici les modèles communs et les sauvegardes."
    )
  );

  appView.appendChild(createAdminNavButton("Modèle Cellules", "editModeleCellule"));
  appView.appendChild(createAdminNavButton("Modèle Chariots", "editModeleChariot"));
  appView.appendChild(
    createAdminNavButton("Modèle Groupes moteur", "editModeleGroupeMoteur")
  );
  appView.appendChild(createAdminNavButton("Modèle Sorties", "editModeleSortie"));
  appView.appendChild(createAdminNavButton("Modèle Injecteurs", "adminInjecteurs"));

  const schemaCard = document.createElement("div");
  schemaCard.className = "model-card";

  const schemaTitle = document.createElement("h2");
  schemaTitle.textContent = "Schémas de référence";
  schemaCard.appendChild(schemaTitle);

  const schemaText = document.createElement("p");
  schemaText.textContent = "Ouvre les schémas dans une fenêtre dédiée.";
  schemaCard.appendChild(schemaText);

  const schemaActions = document.createElement("div");
  schemaActions.className = "schema-actions";

  schemaActions.appendChild(
    createSchemaButton("Schéma cellules", SCHEMA_PATHS.cellule, "Schéma des cellules")
  );
  schemaActions.appendChild(
    createSchemaButton("Schéma chariot", SCHEMA_PATHS.chariot, "Schéma des chariots")
  );
  schemaActions.appendChild(
    createSchemaButton(
      "Schéma groupes moteur",
      SCHEMA_PATHS.groupeMoteur,
      "Schéma des groupes moteur"
    )
  );
  schemaActions.appendChild(
    createSchemaButton("Schéma sorties", SCHEMA_PATHS.sortie, "Schéma des sorties")
  );
  schemaActions.appendChild(
    createSchemaButton(
      "Schéma général injecteurs",
      SCHEMA_PATHS.injecteurs.general,
      "Schéma général injecteurs"
    )
  );

  schemaCard.appendChild(schemaActions);
  appView.appendChild(schemaCard);

  const exportCard = document.createElement("div");
  exportCard.className = "model-card";

  const exportTitle = document.createElement("h2");
  exportTitle.textContent = "Sauvegarde / transfert";
  exportCard.appendChild(exportTitle);

  const exportText = document.createElement("p");
  exportText.textContent =
    "Exporte ou importe toute l’application pour passer du téléphone au PC.";
  exportCard.appendChild(exportText);

  const exportActions = document.createElement("div");
  exportActions.className = "model-actions";

  const exportBtn = document.createElement("button");
  exportBtn.type = "button";
  exportBtn.className = "model-save-button";
  exportBtn.textContent = "📤 Exporter les données";
  exportBtn.onclick = exportData;

  const importBtn = document.createElement("button");
  importBtn.type = "button";
  importBtn.className = "model-add-button";
  importBtn.textContent = "📥 Importer les données";

  const importInput = document.createElement("input");
  importInput.type = "file";
  importInput.accept = "application/json";
  importInput.hidden = true;

  importBtn.onclick = () => {
    importInput.click();
  };

  importInput.onchange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      return;
    }
    importDataFromFile(file);
    importInput.value = "";
  };

  const resetBtn = document.createElement("button");
  resetBtn.type = "button";
  resetBtn.className = "model-delete-button";
  resetBtn.textContent = "Réinitialiser l’application";
  resetBtn.onclick = resetApplication;

  exportActions.appendChild(exportBtn);
  exportActions.appendChild(importBtn);
  exportActions.appendChild(importInput);
  exportActions.appendChild(resetBtn);

  exportCard.appendChild(exportActions);
  appView.appendChild(exportCard);
}

function renderEditModeleCelluleView() {
  clearView();
  appView.appendChild(createBackButton());
  appView.appendChild(
    createModelEditorCard("Édition du modèle Cellule", MODELE_CELLULE, () => {
      setState("admin");
    })
  );
}

function renderEditModeleChariotView() {
  clearView();
  appView.appendChild(createBackButton());
  appView.appendChild(
    createModelEditorCard("Édition du modèle Chariot", MODELE_CHARIOT_STANDARD, () => {
      setState("admin");
    })
  );
}

function renderEditModeleGroupeMoteurView() {
  clearView();
  appView.appendChild(createBackButton());
  appView.appendChild(
    createModelEditorCard(
      "Édition du modèle Groupe moteur",
      MODELE_GROUPE_MOTEUR,
      () => {
        setState("admin");
      }
    )
  );
}

function renderEditModeleSortieView() {
  clearView();
  appView.appendChild(createBackButton());
  appView.appendChild(
    createModelEditorCard("Édition du modèle Sortie", MODELE_SORTIE, () => {
      setState("admin");
    })
  );
}