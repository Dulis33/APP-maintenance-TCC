function showHistoryPopup(row, type = "chgt") {
  const existing = document.getElementById("historyPopup");
  if (existing) {
    existing.remove();
  }

  const overlay = document.createElement("div");
  overlay.id = "historyPopup";
  overlay.className = "history-overlay";

  const box = document.createElement("div");
  box.className = "history-box";

  const title = document.createElement("h3");
  title.textContent =
    type === "ctrl"
      ? "Historique des dates de contrôle"
      : "Historique des changements";

  const list = document.createElement("div");
  list.className = "history-list";

  const historyArray =
    type === "ctrl"
      ? Array.isArray(row?.historiqueCtrl)
        ? row.historiqueCtrl
        : []
      : Array.isArray(row?.historiqueChgt)
        ? row.historiqueChgt
        : [];

  if (historyArray.length === 0) {
    const item = document.createElement("div");
    item.className = "history-item";
    item.textContent = "Aucun historique.";
    list.appendChild(item);
  } else {
    historyArray.forEach((date, i) => {
      const item = document.createElement("div");
      item.className = "history-item history-item-row";

      const text = document.createElement("span");
      text.textContent = `#${i + 1} : ${date}`;

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "history-delete";
      deleteBtn.textContent = "Suppr.";
      deleteBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        removeHistoryDate(row, type, i);
      };

      item.appendChild(text);
      item.appendChild(deleteBtn);
      list.appendChild(item);
    });
  }

  const close = document.createElement("button");
  close.type = "button";
  close.className = "history-close";
  close.textContent = "Fermer";
  close.onclick = () => overlay.remove();

  box.appendChild(title);
  box.appendChild(list);
  box.appendChild(close);
  overlay.appendChild(box);

  overlay.onclick = (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  };

  document.body.appendChild(overlay);
}

function createStateToggleButton(targetRow, config) {
  const { prop, activeClass, text, title } = config;

  const button = document.createElement("button");
  button.type = "button";

  function refreshVisual() {
    button.className = targetRow[prop]
      ? `toggle-flag-button ${activeClass} active`
      : `toggle-flag-button ${activeClass}`;
    button.textContent = text;
    button.title = title;
  }

  button.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    targetRow[prop] = targetRow[prop] !== true;

    saveAll();
    renderCurrentState();
  };

  refreshVisual();
  return button;
}

function createCriticalToggleButton(targetRow) {
  return createStateToggleButton(targetRow, {
    prop: "critique",
    activeClass: "critical",
    text: "HS",
    title: "Critique"
  });
}

function createWarningToggleButton(targetRow) {
  return createStateToggleButton(targetRow, {
    prop: "aPrevoir",
    activeClass: "warning",
    text: "Usé",
    title: "À prévoir"
  });
}

function createControlToggleButton(targetRow) {
  return createStateToggleButton(targetRow, {
    prop: "controlePreventif",
    activeClass: "preventif",
    text: "Préventif",
    title: "Contrôle préventif"
  });
}

function createDefaultCommentItemForTable() {
  if (typeof createEmptyCommentItem === "function") {
    return createEmptyCommentItem();
  }

  return {
    text: "",
    elementConcerne: "",
    date: "",
    critique: false,
    aPrevoir: false,
    aControler: false,
    controlePreventif: false,
    celluleDefaut: false,
    celluleInhibee: false
  };
}

function ensureCommentHeaderRow(store, key) {
  ensureCommentRows(store, key);

  if (!Array.isArray(store[key])) {
    store[key] = [];
  }

  if (store[key].length === 0) {
    store[key].push(createDefaultCommentItemForTable());
  }

  const headerRow = store[key][0] || createDefaultCommentItemForTable();
  store[key][0] = headerRow;

  headerRow.text = typeof headerRow.text === "string" ? headerRow.text : "";
  headerRow.elementConcerne =
    typeof headerRow.elementConcerne === "string" ? headerRow.elementConcerne : "";
  headerRow.date = typeof headerRow.date === "string" ? headerRow.date : "";
  headerRow.critique = headerRow.critique === true;
  headerRow.aPrevoir = headerRow.aPrevoir === true;
  headerRow.aControler = headerRow.aControler === true;
  headerRow.controlePreventif = headerRow.controlePreventif === true;
  headerRow.celluleDefaut = headerRow.celluleDefaut === true;
  headerRow.celluleInhibee = headerRow.celluleInhibee === true;

  return headerRow;
}

function createHistoryDateCell(targetRow, type) {
  const td = document.createElement("td");
  const wrap = document.createElement("div");
  wrap.className = "date-cell-wrap";

  const input = document.createElement("input");
  input.type = "date";
  input.className = "date-input";
  input.value = type === "chgt" ? targetRow.dateChgt || "" : targetRow.dateCtrl || "";

  input.onchange = (e) => {
    if (type === "chgt") {
      updateDateChgt(targetRow, e.target.value);
    } else {
      updateDateCtrl(targetRow, e.target.value);
    }
    renderCurrentState();
  };

  const histBtn = document.createElement("button");
  histBtn.type = "button";
  histBtn.className = "history-btn";
  histBtn.textContent = "🕘";
  histBtn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    showHistoryPopup(targetRow, type);
  };

  wrap.appendChild(input);
  wrap.appendChild(histBtn);
  td.appendChild(wrap);

  return td;
}

function createPieceStatusCell(targetRow, type) {
  const td = document.createElement("td");

  if (type === "critical") {
    td.appendChild(createCriticalToggleButton(targetRow));
  } else if (type === "warning") {
    td.appendChild(createWarningToggleButton(targetRow));
  } else {
    td.appendChild(createControlToggleButton(targetRow));
  }

  return td;
}

function applyPieceRowClasses(tr, row) {
  if (row.critique) {
    tr.classList.add("row-critical");
  }
  if (row.aPrevoir) {
    tr.classList.add("row-warning");
  }
  if (row.controlePreventif) {
    tr.classList.add("row-preventif");
  }
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
  td.textContent = text;
  tr.appendChild(td);
  return tr;
}

function createActionStack() {
  const actionWrap = document.createElement("div");
  actionWrap.className = "action-stack";
  return actionWrap;
}

function createAlignedActionRow() {
  const row = document.createElement("div");
  row.className = "action-row-end";
  return row;
}

function getTodayDateString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function createPartsTable(model, rows) {
  const safeModel = Array.isArray(model) ? model : [];
  const safeRows = Array.isArray(rows) ? rows : [];

  // Rôle : encadrant si admin débloqué, technicien sinon
  const isEncadrant = typeof adminUnlocked !== "undefined" && adminUnlocked === true;

  const container = document.createElement("div");
  container.className = "parts-table-container";

  if (safeModel.length === 0) {
    const wrapper = document.createElement("div");
    wrapper.className = "table-wrapper";
    const table = document.createElement("table");
    table.className = "parts-table";
    table.appendChild(createTableHead(["Pièce","Référence","Repère","Date chgt","Date contrôle","Critique","À prévoir","Préventif à réaliser","Réalisé"]));
    const tbody = document.createElement("tbody");
    tbody.appendChild(createEmptyTableRow(9, "Aucune ligne définie."));
    table.appendChild(tbody);
    wrapper.appendChild(table);
    container.appendChild(wrapper);
    return container;
  }

  // =====================
  // BANDEAU MODE
  // =====================
  const modeBanner = document.createElement("div");
  modeBanner.className = isEncadrant
    ? "parts-mode-banner parts-mode-encadrant"
    : "parts-mode-banner parts-mode-technicien";
  modeBanner.innerHTML = isEncadrant
    ? "🔓 <strong>Mode encadrant</strong> — Planification activée"
    : "👷 <strong>Mode technicien</strong> — Cochez les préventifs réalisés";
  container.appendChild(modeBanner);

  // =====================
  // BARRE PRÉVENTIF
  // =====================
  const bar = document.createElement("div");
  bar.className = "parts-table-action-bar";

  const row1 = document.createElement("div");
  row1.className = "parts-action-row";

  // Bouton "Programmer préventif complet" — encadrant seulement
  const btnComplet = document.createElement("button");
  btnComplet.type = "button";
  if (!isEncadrant) {
    btnComplet.className = "parts-action-btn parts-preventif-complet-btn parts-btn-disabled";
    btnComplet.disabled = true;
    btnComplet.title = "Réservé à l'encadrant";
  } else {
    btnComplet.className = "parts-action-btn parts-preventif-complet-btn";
  }

  // Sélecteur de date
  const dateInput = document.createElement("input");
  dateInput.type = "date";
  dateInput.className = "date-input parts-date-input";
  dateInput.value = getTodayDateString();

  // Bouton valider — accessible au technicien
  const btnValider = document.createElement("button");
  btnValider.type = "button";
  btnValider.className = "parts-action-btn parts-preventif-done-btn parts-btn-disabled";
  btnValider.textContent = "✓ Valider les réalisés";
  btnValider.title = "Inscrit la date choisie sur les lignes Réalisé et les remet à zéro";
  btnValider.disabled = true;

  // Compteur
  const counter = document.createElement("span");
  counter.className = "parts-preventif-counter";
  counter.style.display = "none";

  row1.appendChild(btnComplet);
  row1.appendChild(dateInput);
  row1.appendChild(btnValider);
  row1.appendChild(counter);
  bar.appendChild(row1);
  container.appendChild(bar);

  // =====================
  // TABLEAU
  // =====================
  const wrapper = document.createElement("div");
  wrapper.className = "table-wrapper";

  const table = document.createElement("table");
  table.className = "parts-table";

  table.appendChild(
    createTableHead([
      "Pièce", "Référence", "Repère",
      "Date chgt", "Date contrôle",
      "Critique", "À prévoir",
      "Préventif à réaliser", "Réalisé"
    ])
  );

  const tbody = document.createElement("tbody");
  const trList = [];

  safeModel.forEach((item, index) => {
    const row = safeRows[index] || createEmptyLocalRow();
    const tr = document.createElement("tr");
    trList.push({ tr, row });

    applyPieceRowClasses(tr, row);

    // Appliquer classe visuelle si "À faire" coché
    if (row.controlePreventif) tr.classList.add("row-a-faire");
    if (row.preventifRealise) tr.classList.add("row-realise");

    const tdPiece = document.createElement("td");
    tdPiece.textContent = item?.piece || "";
    const tdRef = document.createElement("td");
    tdRef.textContent = item?.reference || "";
    const tdRep = document.createElement("td");
    tdRep.textContent = item?.repere || "";

    tr.appendChild(tdPiece);
    tr.appendChild(tdRef);
    tr.appendChild(tdRep);
    tr.appendChild(createHistoryDateCell(row, "chgt"));
    tr.appendChild(createHistoryDateCell(row, "ctrl"));
    tr.appendChild(createPieceStatusCell(row, "critical"));
    tr.appendChild(createPieceStatusCell(row, "warning"));

    // Colonne "À faire" (bleu)
    const tdAFaire = document.createElement("td");
    const btnAFaire = document.createElement("button");
    btnAFaire.type = "button";
    btnAFaire.className = row.controlePreventif
      ? "toggle-flag-button preventif active"
      : "toggle-flag-button preventif";
    btnAFaire.textContent = "Préventif";
    // Mode technicien : bouton "À faire" verrouillé
    if (!isEncadrant) {
      btnAFaire.disabled = true;
      btnAFaire.classList.add("parts-afaire-locked");
      btnAFaire.title = "Planification réservée à l\'encadrant";
    }

    btnAFaire.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isEncadrant) return;
      row.controlePreventif = !row.controlePreventif;
      // Si on décoche "À faire", on décoche aussi "Réalisé"
      if (!row.controlePreventif) {
        row.preventifRealise = false;
        btnRealise.className = "toggle-flag-button preventif";
        tr.classList.remove("row-realise");
      }
      btnAFaire.className = row.controlePreventif
        ? "toggle-flag-button preventif active"
        : "toggle-flag-button preventif";
      tr.classList.toggle("row-a-faire", row.controlePreventif);
      saveAll();
      refreshCounter();
      refreshBtnComplet();
    };
    tdAFaire.appendChild(btnAFaire);

    // Colonne "Réalisé" (vert)
    const tdRealise = document.createElement("td");
    const btnRealise = document.createElement("button");
    btnRealise.type = "button";
    btnRealise.className = row.preventifRealise
      ? "toggle-flag-button preventif active parts-btn-realise"
      : "toggle-flag-button preventif parts-btn-realise";
    btnRealise.textContent = "Réalisé";
    btnRealise.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Ne peut être coché que si "À faire" est coché
      if (!row.controlePreventif && !row.preventifRealise) return;
      row.preventifRealise = !row.preventifRealise;
      // Cocher "Réalisé" coche aussi "À faire" automatiquement
      if (row.preventifRealise && !row.controlePreventif) {
        row.controlePreventif = true;
        btnAFaire.className = "toggle-flag-button preventif active";
        tr.classList.add("row-a-faire");
      }
      btnRealise.className = row.preventifRealise
        ? "toggle-flag-button preventif active parts-btn-realise"
        : "toggle-flag-button preventif parts-btn-realise";
      tr.classList.toggle("row-realise", row.preventifRealise);
      saveAll();
      refreshCounter();
    };
    tdRealise.appendChild(btnRealise);

    tr.appendChild(tdAFaire);
    tr.appendChild(tdRealise);
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  wrapper.appendChild(table);
  container.appendChild(wrapper);

  // =====================
  // LOGIQUE BARRE
  // =====================

  function refreshCounter() {
    const nbAFaire = safeRows.filter((r) => r && r.controlePreventif === true).length;
    const nbRealise = safeRows.filter((r) => r && r.preventifRealise === true).length;
    if (nbRealise > 0) {
      counter.textContent = `${nbRealise} réalisé${nbRealise > 1 ? "s" : ""} prêt${nbRealise > 1 ? "s" : ""} à valider`;
      counter.style.display = "inline-flex";
      btnValider.disabled = false;
      btnValider.classList.remove("parts-btn-disabled");
    } else {
      counter.textContent = "";
      counter.style.display = "none";
      btnValider.disabled = true;
      btnValider.classList.add("parts-btn-disabled");
    }
  }

  function refreshBtnComplet() {
    const nbTotal = safeRows.filter((r) => r).length;
    const nbAFaire = safeRows.filter((r) => r && r.controlePreventif === true).length;
    if (nbAFaire === nbTotal && nbTotal > 0) {
      btnComplet.className = "parts-action-btn parts-preventif-complet-btn parts-preventif-complet-active";
      btnComplet.textContent = "📋 Préventif à réaliser ✓";
    } else if (nbAFaire > 0) {
      btnComplet.className = "parts-action-btn parts-preventif-complet-btn parts-preventif-complet-active";
      btnComplet.textContent = `📋 Préventif à réaliser (${nbAFaire}/${nbTotal})`;
    } else {
      btnComplet.className = "parts-action-btn parts-preventif-complet-btn";
      btnComplet.textContent = "📋 Programmer préventif complet";
    }
  }

  // Bouton complet : coche ou décoche "À faire" sur toutes les lignes
  btnComplet.onclick = (e) => {
    e.preventDefault();
    const nbTotal = safeRows.filter((r) => r).length;
    const nbAFaire = safeRows.filter((r) => r && r.controlePreventif === true).length;
    const cible = nbAFaire < nbTotal;
    safeRows.forEach((row) => {
      if (row) {
        row.controlePreventif = cible;
        if (!cible) row.preventifRealise = false;
      }
    });
    trList.forEach(({ tr, row }) => {
      tr.classList.toggle("row-a-faire", !!row.controlePreventif);
      tr.classList.toggle("row-realise", !!row.preventifRealise);
      // Refresh boutons ligne
      const btnAF = tr.querySelector(".toggle-flag-button.preventif:not(.parts-btn-realise)");
      const btnR = tr.querySelector(".toggle-flag-button.parts-btn-realise");
      if (btnAF) btnAF.className = row.controlePreventif ? "toggle-flag-button preventif active" : "toggle-flag-button preventif";
      if (btnR) btnR.className = row.preventifRealise ? "toggle-flag-button preventif active parts-btn-realise" : "toggle-flag-button preventif parts-btn-realise";
    });
    saveAll();
    refreshCounter();
    refreshBtnComplet();
  };

  // Bouton valider : inscrire date sur les "Réalisé" cochés et tout remettre à zéro
  btnValider.onclick = (e) => {
    e.preventDefault();
    const dateVal = dateInput.value || getTodayDateString();
    let nbValides = 0;
    safeRows.forEach((row) => {
      if (row && row.preventifRealise === true) {
        updateDateCtrl(row, dateVal);
        row.controlePreventif = false;
        row.preventifRealise = false;
        nbValides++;
      }
    });
    if (nbValides > 0) {
      saveAll();
      renderCurrentState();
    }
  };

  refreshCounter();
  refreshBtnComplet();

  return container;
}

function createTable(model, store, key) {
  const safeModel = Array.isArray(model) ? model : [];
  ensureLocalRows(store, key, safeModel);
  return createPartsTable(safeModel, store[key]);
}

function createInjecteurPieceTable(injecteurNumber, convoyeurKey, type) {
  const model = Array.isArray(
    MODELE_INJECTEUR_CONVOYEURS?.[injecteurNumber]?.[convoyeurKey]?.[type]
  )
    ? MODELE_INJECTEUR_CONVOYEURS[injecteurNumber][convoyeurKey][type]
    : [];

  ensureInjecteurPieceRows(
    DATA_INJECTEUR_CONVOYEURS,
    injecteurNumber,
    convoyeurKey,
    type
  );

  const rows =
    DATA_INJECTEUR_CONVOYEURS[injecteurNumber]?.[convoyeurKey]?.[type] || [];

  return createPartsTable(model, rows);
}

function createCommentTextInput(value, placeholder, onInput) {
  const input = document.createElement("input");
  input.type = "text";
  input.className = "model-input";
  input.value = value || "";
  input.placeholder = placeholder;
  input.addEventListener("input", onInput);
  return input;
}

function createCommentDateInput(value, onInput) {
  const input = document.createElement("input");
  input.type = "date";
  input.className = "date-input";
  input.value = value || "";
  input.addEventListener("input", onInput);
  return input;
}

function isSystemFollowUpCommentRow(item) {
  return !!(
    item &&
    typeof item.suiviType === "string" &&
    item.suiviType.trim() !== ""
  );
}

function isCommentRowFilled(item) {
  return !!(
    ((item?.text || "").trim() !== "") ||
    ((item?.elementConcerne || "").trim() !== "") ||
    ((item?.date || "").trim() !== "")
  );
}

function createCommentsCard(title, store, key, options = {}) {
  const {
    subtitle = "Ajoute autant de lignes de commentaire que nécessaire."
  } = options;

  ensureCommentHeaderRow(store, key);

  const card = document.createElement("div");
  card.className = "comments-card";

  const h2 = document.createElement("h2");
  h2.textContent = title;
  card.appendChild(h2);

  const p = document.createElement("p");
  p.textContent = subtitle;
  card.appendChild(p);

  const tableWrapper = document.createElement("div");
  tableWrapper.className = "table-wrapper";

  const table = document.createElement("table");
  table.className = "comments-table";

  table.appendChild(
    createTableHead([
      "Commentaire",
      "Élément concerné",
      "Date constat",
      "Action"
    ])
  );

  const tbody = document.createElement("tbody");

  store[key]
    .map((item, index) => ({ item, index }))
    .filter(({ item, index }) => index > 0 && !isSystemFollowUpCommentRow(item))
    .forEach(({ item, index }) => {
    const tr = document.createElement("tr");

    const tdText = document.createElement("td");
    const inputText = createCommentTextInput(
      item.text,
      "Commentaire",
      (e) => {
        store[key][index].text = e.target.value;
        saveAll();
        refreshRow();
      }
    );
    tdText.appendChild(inputText);

    const tdElementConcerne = document.createElement("td");
    const inputElementConcerne = createCommentTextInput(
      item.elementConcerne,
      "Élément concerné",
      (e) => {
        store[key][index].elementConcerne = e.target.value;
        saveAll();
        refreshRow();
      }
    );
    tdElementConcerne.appendChild(inputElementConcerne);

    const tdDate = document.createElement("td");
    const inputDate = createCommentDateInput(item.date, (e) => {
      store[key][index].date = e.target.value;
      saveAll();
      refreshRow();
    });
    tdDate.appendChild(inputDate);

    const tdAction = document.createElement("td");
    const actionWrap = createActionStack();

    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "comment-delete-button";
    clearBtn.textContent = "Effacer";
    clearBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const preservedHeader = store[key][0];
      store[key][index] = createDefaultCommentItemForTable();
      store[key][0] = preservedHeader;

      inputText.value = "";
      inputElementConcerne.value = "";
      inputDate.value = "";

      saveAll();
      refreshRow();
    };
    actionWrap.appendChild(clearBtn);

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "model-delete-button";
    deleteBtn.textContent = "Supprimer";
    deleteBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();

      store[key].splice(index, 1);

      if (store[key].length === 0) {
        store[key].push(createDefaultCommentItemForTable());
      }

      if (store[key].length === 1) {
        store[key][0] = store[key][0] || createDefaultCommentItemForTable();
      }

      saveAll();
      renderCurrentState();
    };
    actionWrap.appendChild(deleteBtn);

    tdAction.appendChild(actionWrap);

    function refreshRow() {
      const current = store[key][index];

      tr.classList.remove("row-comment-only");

      if (isCommentRowFilled(current)) {
        tr.classList.add("row-comment-only");
      }
    }

    refreshRow();

    tr.appendChild(tdText);
    tr.appendChild(tdElementConcerne);
    tr.appendChild(tdDate);
    tr.appendChild(tdAction);
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  tableWrapper.appendChild(table);
  card.appendChild(tableWrapper);

  const addRowWrap = createAlignedActionRow();

  const addRowBtn = document.createElement("button");
  addRowBtn.type = "button";
  addRowBtn.className = "comment-add-button";
  addRowBtn.textContent = "+ Ajouter une ligne";
  addRowBtn.onclick = () => {
    ensureCommentHeaderRow(store, key);
    store[key].push(createDefaultCommentItemForTable());
    saveAll();
    renderCurrentState();
  };

  addRowWrap.appendChild(addRowBtn);
  card.appendChild(addRowWrap);

  return card;
}

function createSchemaViewer() {
  const viewer = document.createElement("div");
  viewer.className = "schema-viewer";

  const zoomLayer = document.createElement("div");
  zoomLayer.className = "schema-zoom-layer";

  const img = document.createElement("img");
  img.className = "schema-image";
  img.style.display = "none";
  img.draggable = false;

  const errorBox = document.createElement("div");
  errorBox.className = "schema-note";
  errorBox.textContent = "Schéma non disponible pour le moment.";
  errorBox.style.display = "none";

  const controls = document.createElement("div");
  controls.className = "schema-controls";
  controls.style.display = "none";

  return {
    viewer,
    zoomLayer,
    img,
    errorBox,
    controls
  };
}

function createSchemaControlButton(className, text) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = text;
  return button;
}

function createSchemaCardFromImage(title, imagePath) {
  const card = document.createElement("div");
  card.className = "schema-card";

  const schemaTitle = document.createElement("div");
  schemaTitle.className = "schema-title";
  schemaTitle.textContent = title;
  card.appendChild(schemaTitle);

  if (!imagePath || typeof imagePath !== "string") {
    const empty = document.createElement("div");
    empty.className = "schema-note";
    empty.textContent = "Schéma non disponible pour le moment.";
    card.appendChild(empty);
    return card;
  }

  const { viewer, zoomLayer, img, errorBox, controls } = createSchemaViewer();

  img.src = imagePath;
  img.alt = title;

  const zoomInBtn = createSchemaControlButton("model-save-button", "Zoom +");
  const zoomOutBtn = createSchemaControlButton("model-add-button", "Zoom -");
  const resetBtn = createSchemaControlButton("back-button", "Réinitialiser");

  let scale = 1;
  let translateX = 0;
  let translateY = 0;
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let lastTouchDistance = null;
  let imageReady = false;

  function applyTransform() {
    if (!imageReady) {
      return;
    }

    zoomLayer.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
  }

  function zoomAt(factor, centerX, centerY) {
    if (!imageReady) {
      return;
    }

    const oldScale = scale;
    let newScale = scale * factor;

    if (newScale < 1) {
      newScale = 1;
    }
    if (newScale > 6) {
      newScale = 6;
    }

    factor = newScale / oldScale;
    scale = newScale;

    translateX = centerX - (centerX - translateX) * factor;
    translateY = centerY - (centerY - translateY) * factor;

    applyTransform();
  }

  function resetView() {
    scale = 1;
    translateX = 0;
    translateY = 0;
    applyTransform();
  }

  zoomInBtn.onclick = () => {
    const rect = viewer.getBoundingClientRect();
    zoomAt(1.2, rect.width / 2, rect.height / 2);
  };

  zoomOutBtn.onclick = () => {
    const rect = viewer.getBoundingClientRect();
    zoomAt(1 / 1.2, rect.width / 2, rect.height / 2);
  };

  resetBtn.onclick = resetView;

  viewer.addEventListener(
    "wheel",
    (e) => {
      if (!imageReady) {
        return;
      }

      e.preventDefault();

      const rect = viewer.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (e.deltaY < 0) {
        zoomAt(1.15, x, y);
      } else {
        zoomAt(1 / 1.15, x, y);
      }
    },
    { passive: false }
  );

  zoomLayer.addEventListener("pointerdown", (e) => {
    if (!imageReady) {
      return;
    }

    isDragging = true;
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
    zoomLayer.style.cursor = "grabbing";
    zoomLayer.setPointerCapture(e.pointerId);
  });

  zoomLayer.addEventListener("pointermove", (e) => {
    if (!imageReady || !isDragging) {
      return;
    }

    translateX = e.clientX - startX;
    translateY = e.clientY - startY;
    applyTransform();
  });

  function stopDragging(e) {
    isDragging = false;
    zoomLayer.style.cursor = "grab";

    if (typeof zoomLayer.releasePointerCapture === "function") {
      try {
        zoomLayer.releasePointerCapture(e.pointerId);
      } catch (error) {}
    }
  }

  zoomLayer.addEventListener("pointerup", stopDragging);
  zoomLayer.addEventListener("pointercancel", stopDragging);

  viewer.addEventListener(
    "touchmove",
    (e) => {
      if (!imageReady || e.touches.length !== 2) {
        lastTouchDistance = null;
        return;
      }

      e.preventDefault();

      const rect = viewer.getBoundingClientRect();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      const dx = touch2.clientX - touch1.clientX;
      const dy = touch2.clientY - touch1.clientY;
      const distance = Math.hypot(dx, dy);

      const centerX = (touch1.clientX + touch2.clientX) / 2 - rect.left;
      const centerY = (touch1.clientY + touch2.clientY) / 2 - rect.top;

      if (lastTouchDistance !== null && lastTouchDistance > 0) {
        const factor = distance / lastTouchDistance;
        zoomAt(factor, centerX, centerY);
      }

      lastTouchDistance = distance;
    },
    { passive: false }
  );

  viewer.addEventListener("touchend", () => {
    lastTouchDistance = null;
  });

  viewer.addEventListener("touchcancel", () => {
    lastTouchDistance = null;
  });

  img.onload = () => {
    imageReady = true;
    img.style.display = "block";
    controls.style.display = "flex";
    errorBox.style.display = "none";
    resetView();
  };

  img.onerror = () => {
    imageReady = false;
    img.style.display = "none";
    controls.style.display = "none";
    errorBox.style.display = "block";
  };

  zoomLayer.appendChild(img);
  viewer.appendChild(zoomLayer);

  controls.appendChild(zoomInBtn);
  controls.appendChild(zoomOutBtn);
  controls.appendChild(resetBtn);

  card.appendChild(viewer);
  card.appendChild(errorBox);
  card.appendChild(controls);

  return card;
}

function openSchemaPopup(title, imagePath) {
  const existing = document.getElementById("schemaPopup");
  if (existing) {
    existing.remove();
  }

  const overlay = document.createElement("div");
  overlay.id = "schemaPopup";
  overlay.className = "history-overlay";

  const box = document.createElement("div");
  box.className = "history-box schema-popup-box";

  const titleEl = document.createElement("h3");
  titleEl.textContent = title;

  const content = document.createElement("div");
  content.className = "schema-popup-content";
  content.appendChild(createSchemaCardFromImage(title, imagePath));

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "history-close";
  closeBtn.textContent = "Fermer";
  closeBtn.onclick = () => overlay.remove();

  box.appendChild(titleEl);
  box.appendChild(content);
  box.appendChild(closeBtn);
  overlay.appendChild(box);

  overlay.onclick = (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  };

  document.body.appendChild(overlay);
}

function createSchemaButton(label, imagePath, popupTitle = "Schéma") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "model-save-button";
  button.textContent = label;

  button.onclick = () => {
    openSchemaPopup(popupTitle, imagePath);
  };

  return button;
}