function getInjecteurIdsForViews() {
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

function createInjecteurSectionTitle(text) {
  const title = document.createElement("div");
  title.className = "section-title";
  title.textContent = text;
  return title;
}

function createInjecteurSchemaActions(convoyeurKey, label) {
  const schemaActions = document.createElement("div");
  schemaActions.className = "schema-actions";

  schemaActions.appendChild(
    createSchemaButton(
      "Voir schéma convoyeur",
      SCHEMA_PATHS.injecteurs.convoyeurs?.[convoyeurKey],
      `Schéma convoyeur - ${label}`
    )
  );

  schemaActions.appendChild(
    createSchemaButton(
      "Voir schéma motorisation",
      SCHEMA_PATHS.injecteurs.motorisation,
      `Schéma motorisation - ${label}`
    )
  );

  return schemaActions;
}

function getInjecteurHeaderCommentKey(injecteurNumber) {
  return getInjecteurKey(injecteurNumber);
}

function getInjecteurConvoyeurHeaderCommentKey(injecteurNumber, convoyeurKey) {
  return getInjecteurConvoyeurKey(injecteurNumber, convoyeurKey);
}

function createInjecteurHeaderControl(injecteurNumber) {
  const key = getInjecteurHeaderCommentKey(injecteurNumber);

  return createStandardHeaderControl(
    `Injecteur ${injecteurNumber}`,
    COMMENTS_INJECTEURS,
    key,
    { type: "injecteur", id: injecteurNumber }
  );
}

function createInjecteurConvoyeurHeaderControl(
  injecteurNumber,
  convoyeurKey,
  label
) {
  const key = getInjecteurConvoyeurHeaderCommentKey(
    injecteurNumber,
    convoyeurKey
  );

  return createStandardHeaderControl(
    `${label} - Injecteur ${injecteurNumber}`,
    COMMENTS_INJECTEURS,
    key,
    { type: "injecteur", id: injecteurNumber, convoyeurKey: convoyeurKey }
  );
}

function createProblemCardTitle(index) {
  return `Problématique ${index + 1}`;
}

function createArchiveCardTitle(index, total) {
  return `Archive ${total - index}`;
}

function createProblemStatusBadge(statut) {
  const badge = document.createElement("span");
  badge.className = "injecteur-status-badge-v2";
  badge.textContent = statut === "résolue" ? "Résolue" : "Ouverte";
  return badge;
}

function createProblemFieldBlock(labelText, inputElement) {
  const block = document.createElement("div");
  block.className = "injecteur-section-block-v2";

  const label = document.createElement("label");
  label.className = "injecteur-label-v2";
  label.textContent = labelText;

  block.appendChild(label);
  block.appendChild(inputElement);

  return block;
}

function createProblemValueBlock(labelText, valueText) {
  const value = document.createElement("div");
  value.textContent = valueText || "—";
  return createProblemFieldBlock(labelText, value);
}

function createProblemInfoGrid() {
  const grid = document.createElement("div");
  grid.className = "injecteur-problem-grid-v2";
  return grid;
}

function createProblemDateInput(value, onChange) {
  const input = document.createElement("input");
  input.type = "date";
  input.className = "date-input";
  input.value = value || "";
  input.onchange = onChange;
  return input;
}

function createProblemTextInput(value, placeholder, onInput) {
  const input = document.createElement("input");
  input.type = "text";
  input.className = "model-input";
  input.placeholder = placeholder;
  input.value = value || "";
  input.oninput = onInput;
  return input;
}

function createProblemTextarea(value, placeholder, rows, onInput) {
  const textarea = document.createElement("textarea");
  textarea.className = "model-input injecteur-problem-textarea-v2";
  textarea.rows = rows;
  textarea.placeholder = placeholder;
  textarea.value = value || "";
  textarea.oninput = onInput;
  return textarea;
}

function createProblemStatusSelect(currentValue, onChange) {
  const select = document.createElement("select");
  select.className = "model-input";

  [
    { value: "ouverte", label: "Ouverte" },
    { value: "résolue", label: "Résolue" }
  ].forEach((item) => {
    const option = document.createElement("option");
    option.value = item.value;
    option.textContent = item.label;
    option.selected = (currentValue || "ouverte") === item.value;
    select.appendChild(option);
  });

  select.onchange = onChange;
  return select;
}

function createTableHead(labels) {
  const thead = document.createElement("thead");
  const tr = document.createElement("tr");

  labels.forEach((label) => {
    const th = document.createElement("th");
    th.textContent = label;
    tr.appendChild(th);
  });

  thead.appendChild(tr);
  return thead;
}

function createEmptyTableRow(colSpan, text) {
  const tr = document.createElement("tr");
  const td = document.createElement("td");
  td.colSpan = colSpan;
  td.className = "injecteur-empty-text-v2";
  td.textContent = text;
  tr.appendChild(td);
  return tr;
}

function createActionsTableHead(withDeleteColumn = true) {
  return createTableHead(
    withDeleteColumn ? ["Date", "Action", ""] : ["Date", "Action"]
  );
}

function createProblemActionsTable(actions, onDeleteAction = null) {
  const tableWrap = document.createElement("div");
  tableWrap.className = "injecteur-actions-table-wrap-v3";

  const table = document.createElement("table");
  table.className = "injecteur-actions-table-v3";
  table.appendChild(
    createActionsTableHead(typeof onDeleteAction === "function")
  );

  const tbody = document.createElement("tbody");

  if (!Array.isArray(actions) || actions.length === 0) {
    tbody.appendChild(
      createEmptyTableRow(
        typeof onDeleteAction === "function" ? 3 : 2,
        onDeleteAction
          ? "Aucune action liée pour le moment."
          : "Aucune action associée."
      )
    );
  } else {
    actions.forEach((action, index) => {
      const tr = document.createElement("tr");

      const tdDate = document.createElement("td");
      tdDate.textContent = action.date || "";

      const tdText = document.createElement("td");
      tdText.textContent = action.texte || "";

      tr.appendChild(tdDate);
      tr.appendChild(tdText);

      if (typeof onDeleteAction === "function") {
        const tdDelete = document.createElement("td");
        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "injecteur-delete-inline-button-v3";
        deleteBtn.textContent = "Supprimer";
        deleteBtn.onclick = () => onDeleteAction(index);
        tdDelete.appendChild(deleteBtn);
        tr.appendChild(tdDelete);
      }

      tbody.appendChild(tr);
    });
  }

  table.appendChild(tbody);
  tableWrap.appendChild(table);

  return tableWrap;
}

function createProblemActionsSection(problemIndex, getProblemSnapshot) {
  const actionsSection = document.createElement("div");
  actionsSection.className = "injecteur-actions-section-v2";

  const liveProblem = () => {
    ensureGlobalProblems();
    return GLOBAL_PROBLEMS[problemIndex];
  };

  const actionsTitle = document.createElement("h3");
  actionsTitle.className = "injecteur-section-title-v2";
  actionsTitle.textContent = "Actions réalisées liées";
  actionsSection.appendChild(actionsTitle);

  actionsSection.appendChild(
    createProblemActionsTable(liveProblem()?.actions, (actionIndex) => {
      removeGlobalAction(problemIndex, actionIndex);
    })
  );

  const addActionWrap = document.createElement("div");
  addActionWrap.className = "injecteur-add-action-wrap-v3";

  const addActionBtn = document.createElement("button");
  addActionBtn.className = "injecteur-link-button-v3";
  addActionBtn.type = "button";
  addActionBtn.textContent = "+ Ajouter une action";

  const addActionForm = document.createElement("div");
  addActionForm.className = "injecteur-add-action-form-v3 hidden";

  const formTitle = document.createElement("div");
  formTitle.className = "injecteur-add-action-form-title-v3";
  formTitle.textContent = "Nouvelle action";

  const formGrid = document.createElement("div");
  formGrid.className = "injecteur-add-action-form-grid-v3";

  const formDateInput = document.createElement("input");
  formDateInput.type = "date";
  formDateInput.className = "date-input";
  formDateInput.value = new Date().toISOString().slice(0, 10);

  const formTextInput = document.createElement("input");
  formTextInput.type = "text";
  formTextInput.className = "model-input";
  formTextInput.placeholder = "Description de l'action";

  formGrid.appendChild(formDateInput);
  formGrid.appendChild(formTextInput);

  const formButtons = document.createElement("div");
  formButtons.className = "injecteur-add-action-buttons-v3";

  const validateBtn = document.createElement("button");
  validateBtn.type = "button";
  validateBtn.className = "injecteur-primary-button-v3";
  validateBtn.textContent = "Valider";

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "injecteur-secondary-button-v3";
  cancelBtn.textContent = "Annuler";

  validateBtn.onclick = () => {
    const texte = (formTextInput.value || "").trim();
    const date = formDateInput.value || "";

    if (!texte) {
      alert("Renseigne l'action réalisée.");
      return;
    }

    const probleme = liveProblem();
    if (!probleme) {
      alert("Problématique introuvable.");
      return;
    }

    if (typeof getProblemSnapshot === "function") {
      const snapshot = getProblemSnapshot();
      probleme.date = snapshot.date || "";
      probleme.statut = snapshot.statut || "ouverte";
      probleme.numero = snapshot.numero || "";
      probleme.texte = snapshot.texte || "";
    }

    if (!Array.isArray(probleme.actions)) {
      probleme.actions = [];
    }

    probleme.actions.push({
      date,
      texte
    });

    saveAll();
    renderCurrentState();
  };

  cancelBtn.onclick = () => {
    addActionForm.classList.add("hidden");
    addActionBtn.classList.remove("hidden");
    formTextInput.value = "";
    formDateInput.value = new Date().toISOString().slice(0, 10);
  };

  addActionBtn.onclick = () => {
    addActionBtn.classList.add("hidden");
    addActionForm.classList.remove("hidden");
  };

  formButtons.appendChild(validateBtn);
  formButtons.appendChild(cancelBtn);

  addActionForm.appendChild(formTitle);
  addActionForm.appendChild(formGrid);
  addActionForm.appendChild(formButtons);

  addActionWrap.appendChild(addActionBtn);
  addActionWrap.appendChild(addActionForm);
  actionsSection.appendChild(addActionWrap);

  const deleteProblemWrap = document.createElement("div");
  deleteProblemWrap.className = "injecteur-problem-actions-v2";

  const deleteProblemBtn = document.createElement("button");
  deleteProblemBtn.type = "button";
  deleteProblemBtn.className = "injecteur-danger-button-v2";
  deleteProblemBtn.textContent = "Supprimer la problématique";
  deleteProblemBtn.onclick = () => removeGlobalProblematique(problemIndex);

  deleteProblemWrap.appendChild(deleteProblemBtn);
  actionsSection.appendChild(deleteProblemWrap);

  return actionsSection;
}

function createProblemCard(probleme, index) {
  const card = document.createElement("div");
  card.className = "injecteur-problem-card-v2";
  card.setAttribute("data-statut", probleme.statut || "ouverte");

  const liveProblem = () => {
    ensureGlobalProblems();
    return GLOBAL_PROBLEMS[index];
  };

  const head = document.createElement("div");
  head.className = "injecteur-problem-head-v2";

  const title = document.createElement("h2");
  title.className = "injecteur-problem-title-v2";
  title.textContent = createProblemCardTitle(index);

  const statusBadge = createProblemStatusBadge(probleme.statut);

  head.appendChild(title);
  head.appendChild(statusBadge);
  card.appendChild(head);

  const grid = createProblemInfoGrid();

  const dateInput = createProblemDateInput(probleme.date, (e) => {
    const current = liveProblem();
    if (!current) return;
    current.date = e.target.value;
    saveAll();
  });

  const statutSelect = createProblemStatusSelect(probleme.statut, (e) => {
    const current = liveProblem();
    if (!current) return;

    current.statut = e.target.value;
    card.setAttribute("data-statut", current.statut || "ouverte");
    statusBadge.textContent =
      current.statut === "résolue" ? "Résolue" : "Ouverte";

    saveAll();
  });

  grid.appendChild(createProblemFieldBlock("Date", dateInput));
  grid.appendChild(createProblemFieldBlock("Statut", statutSelect));
  card.appendChild(grid);

  const numeroInput = createProblemTextInput(
    probleme.numero,
    "Ex : Injecteur 530, Train 1, Chariot 12...",
    (e) => {
      const current = liveProblem();
      if (!current) return;
      current.numero = e.target.value;
      saveAll();
    }
  );

  const textArea = createProblemTextarea(
    probleme.texte,
    "Décris la problématique rencontrée",
    4,
    (e) => {
      const current = liveProblem();
      if (!current) return;
      current.texte = e.target.value;
      saveAll();
    }
  );

  card.appendChild(
    createProblemFieldBlock("Équipement concerné", numeroInput)
  );

  card.appendChild(
    createProblemFieldBlock("Description de la problématique", textArea)
  );

  card.appendChild(
    createProblemActionsSection(index, () => ({
      date: dateInput.value || "",
      statut: statutSelect.value || "ouverte",
      numero: (numeroInput.value || "").trim(),
      texte: (textArea.value || "").trim()
    }))
  );

  return card;
}

function createArchiveCard(probleme, displayIndex, realIndex) {
  const card = document.createElement("div");
  card.className = "injecteur-problem-card-v2";
  card.setAttribute("data-statut", "résolue");

  const head = document.createElement("div");
  head.className = "injecteur-problem-head-v2";

  const title = document.createElement("h2");
  title.className = "injecteur-problem-title-v2";
  title.textContent = createArchiveCardTitle(
    displayIndex,
    GLOBAL_PROBLEMS_ARCHIVE.length
  );

  const statusBadge = createProblemStatusBadge("résolue");

  head.appendChild(title);
  head.appendChild(statusBadge);
  card.appendChild(head);

  const infoGrid = createProblemInfoGrid();
  infoGrid.appendChild(createProblemValueBlock("Date", probleme.date));
  infoGrid.appendChild(
    createProblemValueBlock("Date d'archivage", probleme.dateArchivage)
  );
  card.appendChild(infoGrid);

  card.appendChild(
    createProblemValueBlock("Équipement concerné", probleme.numero)
  );
  card.appendChild(
    createProblemValueBlock("Description de la problématique", probleme.texte)
  );

  const actionsSection = document.createElement("div");
  actionsSection.className = "injecteur-actions-section-v2";

  const actionsTitle = document.createElement("h3");
  actionsTitle.className = "injecteur-section-title-v2";
  actionsTitle.textContent = "Actions associées";
  actionsSection.appendChild(actionsTitle);

  actionsSection.appendChild(createProblemActionsTable(probleme.actions));
  card.appendChild(actionsSection);

  const deleteArchiveWrap = document.createElement("div");
  deleteArchiveWrap.className = "injecteur-problem-actions-v2";

  const deleteArchiveBtn = document.createElement("button");
  deleteArchiveBtn.type = "button";
  deleteArchiveBtn.className = "injecteur-danger-button-v2";
  deleteArchiveBtn.textContent = "Supprimer l'archive";
  deleteArchiveBtn.onclick = () => {
    const ok = confirm("Supprimer définitivement cette archive ?");
    if (!ok) {
      return;
    }
    removeGlobalArchivedProblem(realIndex);
  };

  deleteArchiveWrap.appendChild(deleteArchiveBtn);
  card.appendChild(deleteArchiveWrap);

  return card;
}

function createEmptyStateCard(text) {
  const empty = document.createElement("div");
  empty.className = "injecteur-problem-card-v2";

  const txt = document.createElement("p");
  txt.className = "injecteur-empty-text-v2";
  txt.textContent = text;

  empty.appendChild(txt);
  return empty;
}

function createGlobalCountersPills() {
  const totalActives = Array.isArray(GLOBAL_PROBLEMS)
    ? GLOBAL_PROBLEMS.length
    : 0;
  const ouvertes = countGlobalProblems();
  const resolues = totalActives - ouvertes;
  const archivees = Array.isArray(GLOBAL_PROBLEMS_ARCHIVE)
    ? GLOBAL_PROBLEMS_ARCHIVE.length
    : 0;

  const wrap = document.createElement("div");
  wrap.className = "injecteur-pills-row";

  const pillTotal = document.createElement("div");
  pillTotal.className = "injecteur-pill injecteur-pill-total";
  pillTotal.textContent = `Actives : ${totalActives}`;

  const pillOpen = document.createElement("div");
  pillOpen.className = "injecteur-pill injecteur-pill-open";
  pillOpen.textContent = `Ouvertes : ${ouvertes}`;

  const pillResolved = document.createElement("div");
  pillResolved.className = "injecteur-pill injecteur-pill-resolved";
  pillResolved.textContent = `Résolues : ${resolues}`;

  const pillArchive = document.createElement("div");
  pillArchive.className = "injecteur-pill injecteur-pill-total";
  pillArchive.textContent = `Archivées : ${archivees}`;

  wrap.appendChild(pillTotal);
  wrap.appendChild(pillOpen);
  wrap.appendChild(pillResolved);
  wrap.appendChild(pillArchive);

  return wrap;
}

function renderInjecteursView() {
  clearView();
  appView.appendChild(createBackButton());

  const grid = document.createElement("div");
  grid.className = "grid";

  getInjecteurIdsForViews().forEach((injecteurNumber) => {
    grid.appendChild(
      createButton(
        `Injecteur ${injecteurNumber}`,
        () => setState("injecteurDetail", { injecteurNumber }),
        "medium",
        getInjecteurButtonClasses(injecteurNumber),
        countInjecteurTotalCountersWithPlans(injecteurNumber),
        "Commentaires • Convoyeurs"
      )
    );
  });

  appView.appendChild(grid);
}

function renderInjecteurDetailView(injecteurNumber) {
  clearView();
  appView.appendChild(createBackButton());

  const key = getInjecteurHeaderCommentKey(injecteurNumber);

  const card = createDataCard(
    `Injecteur ${injecteurNumber}`,
    "Commentaires • Choix du convoyeur"
  );

  card.appendChild(createInjecteurHeaderControl(injecteurNumber));

  const schemaActions = document.createElement("div");
  schemaActions.className = "schema-actions";
  schemaActions.appendChild(
    createSchemaButton(
      "Voir schéma général",
      SCHEMA_PATHS.injecteurs.general,
      `Schéma général injecteur ${injecteurNumber}`
    )
  );
  card.appendChild(schemaActions);

  card.appendChild(
    createCommentsCard(
      `Commentaires de l'injecteur ${injecteurNumber}`,
      COMMENTS_INJECTEURS,
      key,
      {
        showCelluleStates: false,
        subtitle: "3 lignes de constat maximum."
      }
    )
  );

  card.appendChild(createInjecteurSectionTitle("Convoyeurs"));

  const grid = document.createElement("div");
  grid.className = "toolbar-grid";

  INJECTEUR_CONVOYEURS.forEach((conv) => {
    grid.appendChild(
      createButton(
        conv.label,
        () =>
          setState("injecteurConvoyeurDetail", {
            injecteurNumber,
            convoyeurKey: conv.key
          }),
        "action",
        getInjecteurConvoyeurButtonClasses(injecteurNumber, conv.key),
        countInjecteurConvoyeurCounters(injecteurNumber, conv.key)
      )
    );
  });

  card.appendChild(grid);

  if (typeof createPlansPreventifBlock === "function") {
    const planBlock = createPlansPreventifBlock("injecteur", injecteurNumber);
    if (planBlock) card.appendChild(planBlock);
  }

  appView.appendChild(card);
}

function renderInjecteurConvoyeursView(injecteurNumber) {
  setState("injecteurDetail", { injecteurNumber }, false);
}

function renderInjecteurConvoyeurDetailView(injecteurNumber, convoyeurKey) {
  clearView();
  appView.appendChild(createBackButton());

  const label = getInjecteurConvoyeurLabel(convoyeurKey);

  const card = createDataCard(label, `Injecteur ${injecteurNumber}`);

  card.appendChild(
    createInjecteurConvoyeurHeaderControl(
      injecteurNumber,
      convoyeurKey,
      label
    )
  );

  card.appendChild(createInjecteurSchemaActions(convoyeurKey, label));

  card.appendChild(createInjecteurSectionTitle("Convoyeur"));
  card.appendChild(
    createInjecteurPieceTable(injecteurNumber, convoyeurKey, "convoyeur")
  );

  card.appendChild(createInjecteurSectionTitle("Motorisation"));
  card.appendChild(
    createInjecteurPieceTable(injecteurNumber, convoyeurKey, "motorisation")
  );

  if (typeof createPlansPreventifBlock === "function") {
    const planBlock = createPlansPreventifBlock("injecteur", injecteurNumber, convoyeurKey);
    if (planBlock) card.appendChild(planBlock);
  }

  appView.appendChild(card);
}

function renderInjecteurMotorisationDetailView(injecteurNumber, convoyeurKey) {
  setState("injecteurConvoyeurDetail", { injecteurNumber, convoyeurKey });
}

function renderProblematiquesActionsView() {
  clearView();
  appView.appendChild(createBackButton());

  const card = createDataCard("Problématiques / Actions", "Suivi global");
  card.appendChild(createGlobalProblemsCard());
  appView.appendChild(card);
}

function createGlobalProblemsCard() {
  ensureGlobalProblems();
  ensureGlobalProblemsArchive();

  const wrapper = document.createElement("div");
  wrapper.className = "injecteur-linked-wrapper injecteur-linked-wrapper-v2";

  wrapper.appendChild(createGlobalCountersPills());

  const topActions = document.createElement("div");
  topActions.className = "injecteur-footer-actions-v2";

  const archiveBtn = document.createElement("button");
  archiveBtn.type = "button";
  archiveBtn.className = "injecteur-secondary-button-v2";
  archiveBtn.textContent = "Archiver les résolues";
  archiveBtn.onclick = () => {
    const moved = archiveResolvedGlobalProblems();

    if (moved === 0) {
      alert("Aucune problématique résolue à archiver.");
      return;
    }

    alert(`${moved} problématique(s) archivée(s).`);
    renderCurrentState();
  };

  const historyBtn = document.createElement("button");
  historyBtn.type = "button";
  historyBtn.className = "injecteur-primary-button-v2";
  historyBtn.textContent = "Consulter l'historique";
  historyBtn.onclick = () => {
    setState("problematiquesActionsArchive");
  };

  topActions.appendChild(archiveBtn);
  topActions.appendChild(historyBtn);
  wrapper.appendChild(topActions);

  if (!Array.isArray(GLOBAL_PROBLEMS) || GLOBAL_PROBLEMS.length === 0) {
    wrapper.appendChild(
      createEmptyStateCard("Aucune problématique enregistrée pour le moment.")
    );
  } else {
    GLOBAL_PROBLEMS.forEach((probleme, index) => {
      wrapper.appendChild(createProblemCard(probleme, index));
    });
  }

  const footer = document.createElement("div");
  footer.className = "injecteur-footer-actions-v2";

  const addProblemBtn = document.createElement("button");
  addProblemBtn.type = "button";
  addProblemBtn.className = "injecteur-primary-button-v2";
  addProblemBtn.textContent = "Ajouter une problématique";
  addProblemBtn.onclick = () => addGlobalProblematique();

  footer.appendChild(addProblemBtn);
  wrapper.appendChild(footer);

  return wrapper;
}

function renderProblematiquesActionsArchiveView() {
  clearView();
  appView.appendChild(createBackButton());

  const card = createDataCard("Historique des problématiques", "Archives");
  card.appendChild(createGlobalArchiveCard());
  appView.appendChild(card);
}

function createGlobalArchiveCard() {
  ensureGlobalProblemsArchive();

  const wrapper = document.createElement("div");
  wrapper.className = "injecteur-linked-wrapper injecteur-linked-wrapper-v2";

  if (
    !Array.isArray(GLOBAL_PROBLEMS_ARCHIVE) ||
    GLOBAL_PROBLEMS_ARCHIVE.length === 0
  ) {
    wrapper.appendChild(
      createEmptyStateCard("Aucune problématique archivée pour le moment.")
    );
    return wrapper;
  }

  GLOBAL_PROBLEMS_ARCHIVE
    .slice()
    .reverse()
    .forEach((probleme, index) => {
      const realIndex = GLOBAL_PROBLEMS_ARCHIVE.length - 1 - index;
      wrapper.appendChild(createArchiveCard(probleme, index, realIndex));
    });

  return wrapper;
}

function removeGlobalArchivedProblem(archiveIndex) {
  ensureGlobalProblemsArchive();

  if (archiveIndex < 0 || archiveIndex >= GLOBAL_PROBLEMS_ARCHIVE.length) {
    return;
  }

  GLOBAL_PROBLEMS_ARCHIVE.splice(archiveIndex, 1);
  saveAll();
  renderCurrentState();
}