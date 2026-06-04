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
  appView.appendChild(createAdminNavButton("Formulaires preventifs", "adminFormulaires"));

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

/* ====================================================
   EDITEUR DE MODELES DE FORMULAIRES PREVENTIFS
==================================================== */

function renderAdminFormulairesView() {
  clearView();
  appView.appendChild(createBackButton());
  if (typeof initDefaultFormulaires === "function") initDefaultFormulaires();

  const card = document.createElement("div");
  card.className = "model-card";

  const h2 = document.createElement("h2");
  h2.textContent = "Formulaires preventifs";
  card.appendChild(h2);

  const p = document.createElement("p");
  p.textContent = "Cree et modifie les modeles de formulaires utilises lors de la planification.";
  card.appendChild(p);

  const btnCreate = document.createElement("button");
  btnCreate.type = "button";
  btnCreate.className = "model-add-button";
  btnCreate.textContent = "+ Creer un nouveau formulaire";
  btnCreate.onclick = () => {
    const newForm = typeof normalizeModeleFormulaire === "function"
      ? normalizeModeleFormulaire({ nom: "Nouveau formulaire", typeEquipement: "injecteur", sections: [] })
      : { id: "f" + Date.now(), nom: "Nouveau formulaire", typeEquipement: "injecteur", sections: [] };
    DATA_MODELES_FORMULAIRES.push(newForm);
    saveAll();
    setState("adminFormulaireDetail", { formulaireId: newForm.id });
  };
  card.appendChild(btnCreate);

  if (!DATA_MODELES_FORMULAIRES || DATA_MODELES_FORMULAIRES.length === 0) {
    const empty = document.createElement("p");
    empty.style.color = "var(--text-muted)";
    empty.style.marginTop = "12px";
    empty.textContent = "Aucun formulaire.";
    card.appendChild(empty);
  } else {
    const list = document.createElement("div");
    list.style.cssText = "display:flex;flex-direction:column;gap:8px;margin-top:12px;";
    DATA_MODELES_FORMULAIRES.forEach((form) => {
      const row = document.createElement("div");
      row.style.cssText = "display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--surface-soft);border:1px solid var(--border);border-radius:10px;";
      const info = document.createElement("div");
      info.style.flex = "1";
      const nom = document.createElement("div");
      nom.style.cssText = "font-weight:700;color:var(--text);";
      nom.textContent = form.nom;
      const types = { chariot: "Chariots", groupeMoteur: "Groupes moteurs", injecteur: "Injecteurs", sortie: "Sorties" };
      const meta = document.createElement("div");
      meta.style.cssText = "font-size:11px;color:var(--text-muted);";
      meta.textContent = (types[form.typeEquipement] || form.typeEquipement) + " - " + (form.sections || []).length + " section(s)";
      info.appendChild(nom);
      info.appendChild(meta);
      const btnEdit = document.createElement("button");
      btnEdit.type = "button";
      btnEdit.className = "model-save-button";
      btnEdit.style.cssText = "width:auto;min-height:34px;padding:0 12px;font-size:12px;";
      btnEdit.textContent = "Modifier";
      btnEdit.onclick = () => setState("adminFormulaireDetail", { formulaireId: form.id });
      const btnDel = document.createElement("button");
      btnDel.type = "button";
      btnDel.className = "model-delete-button";
      btnDel.textContent = "X";
      btnDel.onclick = () => {
        if (!confirm("Supprimer ce formulaire ?")) return;
        const idx = DATA_MODELES_FORMULAIRES.indexOf(form);
        if (idx !== -1) DATA_MODELES_FORMULAIRES.splice(idx, 1);
        saveAll();
        renderCurrentState();
      };
      row.appendChild(info);
      row.appendChild(btnEdit);
      row.appendChild(btnDel);
      list.appendChild(row);
    });
    card.appendChild(list);
  }
  appView.appendChild(card);
}

function renderAdminFormulaireDetailView(formulaireId) {
  clearView();
  appView.appendChild(createBackButton());
  if (typeof initDefaultFormulaires === "function") initDefaultFormulaires();
  const form = typeof getModeleFormulaire === "function" ? getModeleFormulaire(formulaireId) : null;
  if (!form) { setState("adminFormulaires"); return; }

  const card = document.createElement("div");
  card.className = "model-card";

  const nomLabel = document.createElement("div");
  nomLabel.className = "manual-field-label";
  nomLabel.textContent = "Nom du formulaire";
  card.appendChild(nomLabel);
  const nomInput = document.createElement("input");
  nomInput.type = "text";
  nomInput.className = "model-input";
  nomInput.value = form.nom;
  nomInput.oninput = () => { form.nom = nomInput.value; };
  card.appendChild(nomInput);

  const typeLabel = document.createElement("div");
  typeLabel.className = "manual-field-label";
  typeLabel.style.marginTop = "10px";
  typeLabel.textContent = "Type equipement";
  card.appendChild(typeLabel);
  const typeSelect = document.createElement("select");
  typeSelect.className = "model-input";
  [["injecteur","Injecteurs"],["chariot","Chariots"],["groupeMoteur","Groupes moteurs"],["sortie","Sorties"]].forEach(([val,lbl]) => {
    const opt = document.createElement("option");
    opt.value = val; opt.textContent = lbl; opt.selected = form.typeEquipement === val;
    typeSelect.appendChild(opt);
  });
  typeSelect.onchange = () => { form.typeEquipement = typeSelect.value; };
  card.appendChild(typeSelect);

  const secTitle = document.createElement("h2");
  secTitle.textContent = "Sections";
  secTitle.style.marginTop = "16px";
  card.appendChild(secTitle);

  const sectionsWrap = document.createElement("div");
  sectionsWrap.style.cssText = "display:flex;flex-direction:column;gap:8px;";

  function renderSections() {
    sectionsWrap.innerHTML = "";
    (form.sections || []).forEach((sec, idx) => {
      sectionsWrap.appendChild(buildSectionEditor(form, sec, idx, renderSections));
    });
  }
  renderSections();
  card.appendChild(sectionsWrap);

  const btnAddSec = document.createElement("button");
  btnAddSec.type = "button";
  btnAddSec.className = "model-add-button";
  btnAddSec.style.marginTop = "8px";
  btnAddSec.textContent = "+ Ajouter une section";
  btnAddSec.onclick = () => {
    if (!form.sections) form.sections = [];
    form.sections.push(typeof normalizeFormulaireSection === "function"
      ? normalizeFormulaireSection({ titre: "Nouvelle section", type: "ok_nok", anomalie: "aucune" })
      : { id: "s"+Date.now(), titre: "Nouvelle section", type: "ok_nok", anomalie: "aucune", items: [], precisions: [] });
    renderSections();
  };
  card.appendChild(btnAddSec);

  const btnSave = document.createElement("button");
  btnSave.type = "button";
  btnSave.className = "model-save-button";
  btnSave.style.marginTop = "14px";
  btnSave.textContent = "Sauvegarder ce formulaire";
  btnSave.onclick = () => { saveAll(); btnSave.textContent = "Sauvegarde OK"; setTimeout(() => { btnSave.textContent = "Sauvegarder ce formulaire"; }, 1500); };
  card.appendChild(btnSave);
  appView.appendChild(card);
}

function buildSectionEditor(form, sec, idx, onUpdate) {
  const wrap = document.createElement("div");
  wrap.style.cssText = "padding:10px 12px;background:var(--surface-soft);border:1px solid var(--border);border-radius:10px;display:flex;flex-direction:column;gap:7px;";

  // En-tête section
  const delRow = document.createElement("div");
  delRow.style.cssText = "display:flex;justify-content:space-between;align-items:center;";
  const secNum = document.createElement("span");
  secNum.style.cssText = "font-size:10px;color:var(--text-muted);";
  secNum.textContent = "Section " + (idx + 1);
  const btnDel = document.createElement("button");
  btnDel.type = "button"; btnDel.className = "model-delete-button"; btnDel.textContent = "Supprimer";
  btnDel.onclick = () => { form.sections.splice(idx, 1); onUpdate(); };
  delRow.appendChild(secNum); delRow.appendChild(btnDel);
  wrap.appendChild(delRow);

  const titreInput = document.createElement("input");
  titreInput.type = "text"; titreInput.className = "model-input";
  titreInput.placeholder = "Titre de la section"; titreInput.value = sec.titre || "";
  titreInput.oninput = () => { sec.titre = titreInput.value; };
  wrap.appendChild(titreInput);

  const typeRow = document.createElement("div");
  typeRow.style.cssText = "display:flex;gap:8px;flex-wrap:wrap;";
  const typeSelect = document.createElement("select");
  typeSelect.className = "model-input"; typeSelect.style.flex = "1";
  [
    ["ok_nok","OK / NOK"],
    ["ok_nok_urgent","OK / NOK + Urgent"],
    ["ok_nok_multiple","OK / NOK par item"],
    ["ok_nok_gravite_multiple","OK / NOK + Gravite par item (liaison pieces)"],
    ["ok_nok_urgent_precision","OK / NOK + Urgent + Precisions"],
    ["texte_libre","Texte libre"],
    ["checkbox_liste","Liste de cases"],
    ["numerique","Valeur numerique"]
  ].forEach(([val,lbl]) => {
    const opt = document.createElement("option");
    opt.value = val; opt.textContent = lbl; opt.selected = sec.type === val;
    typeSelect.appendChild(opt);
  });
  typeSelect.onchange = () => { sec.type = typeSelect.value; onUpdate(); };

  const anomSelect = document.createElement("select");
  anomSelect.className = "model-input"; anomSelect.style.flex = "1";
  [["aucune","Pas anomalie"],["aPrevoir","-> A prevoir"],["critique","-> Critique"],["preventif","-> Preventif"]].forEach(([val,lbl]) => {
    const opt = document.createElement("option");
    opt.value = val; opt.textContent = lbl; opt.selected = sec.anomalie === val;
    anomSelect.appendChild(opt);
  });
  anomSelect.onchange = () => { sec.anomalie = anomSelect.value; };
  typeRow.appendChild(typeSelect); typeRow.appendChild(anomSelect);
  wrap.appendChild(typeRow);

  // Items simples (ok_nok_multiple, checkbox_liste)
  if (sec.type === "ok_nok_multiple" || sec.type === "checkbox_liste") {
    wrap.appendChild(buildItemsEditor(sec, onUpdate, false));
  }

  // Items avec gravite + liaison pieces (ok_nok_gravite_multiple)
  if (sec.type === "ok_nok_gravite_multiple") {
    wrap.appendChild(buildItemsGraviteEditor(form, sec, onUpdate));
  }

  // Precisions (ok_nok_urgent_precision)
  if (sec.type === "ok_nok_urgent_precision") {
    wrap.appendChild(buildPrecisionsEditor(sec, onUpdate));
  }

  return wrap;
}

/* ---- Editeur items simples ---- */
function buildItemsEditor(sec, onUpdate, withPiece) {
  const iWrap = document.createElement("div");
  iWrap.style.cssText = "display:flex;flex-direction:column;gap:5px;";
  const iLbl = document.createElement("div");
  iLbl.style.cssText = "font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;";
  iLbl.textContent = "Items :";
  iWrap.appendChild(iLbl);

  (sec.items || []).forEach((item, iIdx) => {
    const itemObj = typeof item === "object" ? item : { label: item };
    const iRow = document.createElement("div");
    iRow.style.cssText = "display:flex;gap:6px;";
    const iInput = document.createElement("input");
    iInput.type = "text"; iInput.className = "model-input";
    iInput.value = itemObj.label || String(item);
    iInput.oninput = () => {
      if (typeof sec.items[iIdx] === "object") sec.items[iIdx].label = iInput.value;
      else sec.items[iIdx] = iInput.value;
    };
    const iDel = document.createElement("button");
    iDel.type = "button"; iDel.className = "model-delete-button"; iDel.textContent = "X";
    iDel.style.cssText = "min-height:30px;padding:0 8px;font-size:11px;";
    iDel.onclick = () => { sec.items.splice(iIdx, 1); onUpdate(); };
    iRow.appendChild(iInput); iRow.appendChild(iDel);
    iWrap.appendChild(iRow);
  });

  const btnAddI = document.createElement("button");
  btnAddI.type = "button"; btnAddI.className = "model-add-button";
  btnAddI.style.cssText = "padding:5px 10px;font-size:11px;";
  btnAddI.textContent = "+ Item";
  btnAddI.onclick = () => { if (!sec.items) sec.items = []; sec.items.push("Nouvel item"); onUpdate(); };
  iWrap.appendChild(btnAddI);
  return iWrap;
}

/* ---- Editeur items avec gravite + liaison pieces ---- */
function buildItemsGraviteEditor(form, sec, onUpdate) {
  const wrap = document.createElement("div");
  wrap.style.cssText = "display:flex;flex-direction:column;gap:8px;";

  const lbl = document.createElement("div");
  lbl.style.cssText = "font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;";
  lbl.textContent = "Items (OK/NOK + gravite + piece liee) :";
  wrap.appendChild(lbl);

  // Charger les pieces disponibles pour ce type d equipement
  const pieces = typeof getPiecesForEquipement === "function"
    ? getPiecesForEquipement(form.typeEquipement)
    : [];

  // Selectionner le convoyeur si injecteur
  let convoyeurKey = null;
  if (form.typeEquipement === "injecteur" && typeof INJECTEUR_CONVOYEURS !== "undefined") {
    const convRow = document.createElement("div");
    convRow.style.cssText = "display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:4px;";
    const convLbl = document.createElement("span");
    convLbl.style.cssText = "font-size:11px;color:var(--text-soft);";
    convLbl.textContent = "Convoyeur de reference :";
    const convSel = document.createElement("select");
    convSel.className = "model-input"; convSel.style.flex = "1";
    INJECTEUR_CONVOYEURS.forEach((c) => {
      const o = document.createElement("option"); o.value = c.key; o.textContent = c.label;
      convSel.appendChild(o);
    });
    convSel.onchange = () => {
      convoyeurKey = convSel.value;
      onUpdate();
    };
    convoyeurKey = INJECTEUR_CONVOYEURS[0]?.key;
    convRow.appendChild(convLbl); convRow.appendChild(convSel);
    wrap.appendChild(convRow);
  }

  (sec.items || []).forEach((item, iIdx) => {
    const itemObj = typeof item === "object" ? item : { label: item };

    const iCard = document.createElement("div");
    iCard.style.cssText = "padding:8px 10px;background:var(--surface-card);border:1px solid var(--border);border-radius:8px;display:flex;flex-direction:column;gap:6px;";

    // Libelle
    const lblRow = document.createElement("div");
    lblRow.style.cssText = "display:flex;gap:6px;align-items:center;";
    const iInput = document.createElement("input");
    iInput.type = "text"; iInput.className = "model-input"; iInput.style.flex = "1";
    iInput.placeholder = "Libelle de l item";
    iInput.value = itemObj.label || "";
    iInput.oninput = () => { sec.items[iIdx].label = iInput.value; };
    const iDel = document.createElement("button");
    iDel.type = "button"; iDel.className = "model-delete-button"; iDel.textContent = "X";
    iDel.style.cssText = "min-height:30px;padding:0 8px;font-size:11px;";
    iDel.onclick = () => { sec.items.splice(iIdx, 1); onUpdate(); };
    lblRow.appendChild(iInput); lblRow.appendChild(iDel);
    iCard.appendChild(lblRow);

    // Liaison piece
    const pieceRow = document.createElement("div");
    pieceRow.style.cssText = "display:flex;gap:6px;align-items:center;flex-wrap:wrap;";
    const pieceLbl = document.createElement("span");
    pieceLbl.style.cssText = "font-size:11px;color:var(--text-soft);white-space:nowrap;";
    pieceLbl.textContent = "Piece liee :";

    // Selecteur depuis le modele
    const pieceSelect = document.createElement("select");
    pieceSelect.className = "model-input"; pieceSelect.style.flex = "1";
    const emptyOpt = document.createElement("option");
    emptyOpt.value = ""; emptyOpt.textContent = "— Saisie manuelle —";
    pieceSelect.appendChild(emptyOpt);

    const currentPieces = typeof getPiecesForEquipement === "function"
      ? getPiecesForEquipement(form.typeEquipement, convoyeurKey || itemObj.convoyeurKey)
      : [];
    currentPieces.forEach((p) => {
      const o = document.createElement("option");
      o.value = JSON.stringify({ index: p.index, tableauType: p.tableauType, convoyeurKey: p.convoyeurKey });
      o.textContent = p.label;
      o.selected = itemObj.index === p.index && itemObj.tableauType === p.tableauType
        && itemObj.convoyeurKey === p.convoyeurKey;
      pieceSelect.appendChild(o);
    });
    pieceSelect.onchange = () => {
      if (pieceSelect.value) {
        try {
          const parsed = JSON.parse(pieceSelect.value);
          sec.items[iIdx].index = parsed.index;
          sec.items[iIdx].pieceIndex = parsed.index;
          sec.items[iIdx].tableauType = parsed.tableauType;
          sec.items[iIdx].convoyeurKey = parsed.convoyeurKey;
          manualInput.value = "";
          manualInput.style.display = "none";
        } catch(e) {}
      } else {
        sec.items[iIdx].index = undefined;
        sec.items[iIdx].pieceIndex = undefined;
        manualInput.style.display = "";
      }
    };

    // Saisie manuelle
    const manualInput = document.createElement("input");
    manualInput.type = "text"; manualInput.className = "model-input"; manualInput.style.flex = "1";
    manualInput.placeholder = "Saisir repere ou description";
    manualInput.value = itemObj.repereManuel || "";
    manualInput.style.display = pieceSelect.value ? "none" : "";
    manualInput.oninput = () => { sec.items[iIdx].repereManuel = manualInput.value; };

    pieceRow.appendChild(pieceLbl); pieceRow.appendChild(pieceSelect); pieceRow.appendChild(manualInput);
    iCard.appendChild(pieceRow);
    wrap.appendChild(iCard);
  });

  const btnAdd = document.createElement("button");
  btnAdd.type = "button"; btnAdd.className = "model-add-button";
  btnAdd.style.cssText = "padding:5px 10px;font-size:11px;";
  btnAdd.textContent = "+ Ajouter un item";
  btnAdd.onclick = () => {
    if (!sec.items) sec.items = [];
    sec.items.push({ label: "Nouvel item", index: undefined, pieceIndex: undefined, tableauType: "convoyeur", convoyeurKey: convoyeurKey });
    onUpdate();
  };
  wrap.appendChild(btnAdd);
  return wrap;
}

/* ---- Editeur precisions ---- */
function buildPrecisionsEditor(sec, onUpdate) {
  const pWrap = document.createElement("div");
  pWrap.style.cssText = "display:flex;flex-direction:column;gap:5px;";
  const pLbl = document.createElement("div");
  pLbl.style.cssText = "font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;";
  pLbl.textContent = "Precisions :";
  pWrap.appendChild(pLbl);
  (sec.precisions || []).forEach((prec, pIdx) => {
    const pRow = document.createElement("div"); pRow.style.cssText = "display:flex;gap:6px;";
    const pInput = document.createElement("input");
    pInput.type = "text"; pInput.className = "model-input"; pInput.value = prec;
    pInput.oninput = () => { sec.precisions[pIdx] = pInput.value; };
    const pDel = document.createElement("button");
    pDel.type = "button"; pDel.className = "model-delete-button"; pDel.textContent = "X";
    pDel.style.cssText = "min-height:30px;padding:0 8px;font-size:11px;";
    pDel.onclick = () => { sec.precisions.splice(pIdx, 1); onUpdate(); };
    pRow.appendChild(pInput); pRow.appendChild(pDel);
    pWrap.appendChild(pRow);
  });
  const btnAddP = document.createElement("button");
  btnAddP.type = "button"; btnAddP.className = "model-add-button";
  btnAddP.style.cssText = "padding:5px 10px;font-size:11px;";
  btnAddP.textContent = "+ Precision";
  btnAddP.onclick = () => { if (!sec.precisions) sec.precisions = []; sec.precisions.push("Nouvelle precision"); onUpdate(); };
  pWrap.appendChild(btnAddP);
  return pWrap;
}
