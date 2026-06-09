function getEtatOrderFromFlags(flags = {}) {
  if (flags.critique) return 1;
  if (flags.celluleDefaut) return 2;
  if (flags.celluleInhibee) return 3;
  if (flags.aPrevoir) return 4;
  if (flags.aControler) return 5;
  if (flags.controlePreventif) return 6;
  return 99;
}

function sortInterventionRows(rows) {
  rows.sort((a, b) => {
    if (a._etatOrder !== b._etatOrder) {
      return a._etatOrder - b._etatOrder;
    }

    if (a._familleOrder !== b._familleOrder) {
      return a._familleOrder - b._familleOrder;
    }

    if (a._trainOrder !== b._trainOrder) {
      return a._trainOrder - b._trainOrder;
    }

    if (a._chariotNumber !== b._chariotNumber) {
      return a._chariotNumber - b._chariotNumber;
    }

    if (a._zoneOrder !== b._zoneOrder) {
      return a._zoneOrder - b._zoneOrder;
    }

    if (a._celluleNumber !== b._celluleNumber) {
      return a._celluleNumber - b._celluleNumber;
    }

    return a._pieceOrder - b._pieceOrder;
  });
}

function createEmptyManualInterventionRow() {
  return {
    emplacement: "",
    element: "",
    detail: "",
    dateCtrl: "",
    etat: "Contrôle préventif",
    commentaire: ""
  };
}

function getInterventionRowKey(item) {
  if (item && item._aggregateKey) {
    return item._aggregateKey;
  }

  return [
    item.emplacement || "",
    item.element || "",
    item.detail || "",
    item.dateCtrl || "",
    item.etat || "",
    item._flags?.critique ? "1" : "0",
    item._flags?.aPrevoir ? "1" : "0",
    item._flags?.aControler ? "1" : "0",
    item._flags?.controlePreventif ? "1" : "0",
    item._flags?.celluleDefaut ? "1" : "0",
    item._flags?.celluleInhibee ? "1" : "0"
  ].join("||");
}

function getFamilleOrder(famille) {
  if (famille === "cellule") return 1;
  if (famille === "chariot") return 2;
  if (famille === "groupeMoteur") return 3;
  if (famille === "energybox") return 4;
  if (famille === "trieur") return 5;
  if (famille === "injecteur") return 6;
  if (famille === "sortie") return 7;
  if (famille === "convoyeur") return 8;
  if (famille === "manuel") return 99;
  return 50;
}

function getInterventionDetailedFamilleFilters() {
  return ["cellule", "chariot", "groupeMoteur", "energybox", "injecteur", "sortie", "convoyeur", "manuel"];
}

function getInterventionFamilleLabel(famille) {
  if (famille === "cellule") return "Cellules";
  if (famille === "chariot") return "Chariots";
  if (famille === "groupeMoteur") return "Groupes moteur";
  if (famille === "energybox") return "EnergyBox / Pickups";
  if (famille === "injecteur") return "Injecteurs";
  if (famille === "sortie") return "Sorties";
  if (famille === "convoyeur") return "Convoyeurs";
  if (famille === "manuel") return "Manuel";
  if (famille === "trieur") return "Trieur complet";
  return famille || "Autre";
}

function getInjecteurCommentsStoreSafe() {
  if (typeof COMMENTS_INJECTEURS !== "object" || COMMENTS_INJECTEURS === null) {
    return {};
  }

  return COMMENTS_INJECTEURS;
}

function getInjecteurIdsForIntervention() {
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

function createInterventionFieldLabel(text) {
  const label = document.createElement("div");
  label.className = "manual-field-label";
  label.textContent = text;
  return label;
}

function createInterventionSelect(options, value, onChange) {
  const select = document.createElement("select");
  select.className = "model-input";

  options.forEach((label) => {
    const option = document.createElement("option");
    option.value = label;
    option.textContent = label;
    option.selected = label === value;
    select.appendChild(option);
  });

  select.onchange = onChange;
  return select;
}

function createInterventionActionStack() {
  const wrap = document.createElement("div");
  wrap.className = "action-stack";
  return wrap;
}

function createInterventionTableHead() {
  return createTableHead([
    "Emplacement",
    "Élément concerné",
    "Référence / Détail",
    "Date",
    "Critique",
    "À prévoir",
    "À contrôler J+1",
    "Défaut",
    "Inhibée",
    "Préventif",
    "Note",
    "Action"
  ]);
}

function getInterventionDefaultFilters() {
  return ["critical", "warning", "control", "defaut", "inhibee", "preventif"];
}

function getInterventionDefaultFamilles() {
  return getInterventionDetailedFamilleFilters();
}

function sanitizeInterventionEtatFilters(filters) {
  return Array.isArray(filters) ? filters : getInterventionDefaultFilters();
}

function sanitizeInterventionFamilleFilters(filters) {
  return Array.isArray(filters) ? filters : getInterventionDefaultFamilles();
}

function createManualInterventionEditor(
  activeEtatFilters = getInterventionDefaultFilters(),
  activeFamilleFilters = getInterventionDefaultFamilles()
) {
  const card = document.createElement("div");
  card.className = "data-card";

  const h2 = document.createElement("h2");
  h2.textContent = "Nouvelle ligne";
  card.appendChild(h2);

  const row = createEmptyManualInterventionRow();

  const fields = document.createElement("div");
  fields.className = "manual-intervention-fields";

  const emplacement = document.createElement("input");
  emplacement.className = "model-input";
  emplacement.placeholder = "Emplacement";
  emplacement.value = row.emplacement;
  emplacement.oninput = (e) => {
    row.emplacement = e.target.value;
  };

  const element = document.createElement("input");
  element.className = "model-input";
  element.placeholder = "Élément concerné";
  element.value = row.element;
  element.oninput = (e) => {
    row.element = e.target.value;
  };

  const detail = document.createElement("input");
  detail.className = "model-input";
  detail.placeholder = "Référence / détail";
  detail.value = row.detail;
  detail.oninput = (e) => {
    row.detail = e.target.value;
  };

  const dateCtrl = document.createElement("input");
  dateCtrl.type = "date";
  dateCtrl.className = "date-input";
  dateCtrl.value = row.dateCtrl;
  dateCtrl.oninput = (e) => {
    row.dateCtrl = e.target.value;
  };

  const etatWrap = document.createElement("div");
  etatWrap.appendChild(createInterventionFieldLabel("État"));

  const etat = createInterventionSelect(
    ["Critique", "À prévoir", "Contrôle préventif"],
    row.etat,
    (e) => {
      row.etat = e.target.value;
    }
  );
  etatWrap.appendChild(etat);

  const commentaire = document.createElement("textarea");
  commentaire.className = "model-input";
  commentaire.placeholder = "Note / précision";
  commentaire.rows = 3;
  commentaire.value = row.commentaire;
  commentaire.oninput = (e) => {
    row.commentaire = e.target.value;
  };

  const actions = document.createElement("div");
  actions.className = "manual-intervention-actions";

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "comment-delete-button";
  cancelBtn.textContent = "Annuler";
  cancelBtn.onclick = () => {
    setState(
      "intervention",
      {
        etatFilters: activeEtatFilters,
        familleFilters: activeFamilleFilters,
        showManualForm: false
      },
      false
    );
  };

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "model-save-button";
  addBtn.textContent = "Ajouter la ligne";
  addBtn.onclick = () => {
    const hasContent =
      row.emplacement.trim() !== "" ||
      row.element.trim() !== "" ||
      row.detail.trim() !== "" ||
      row.dateCtrl.trim() !== "" ||
      row.commentaire.trim() !== "";

    if (!hasContent) {
      alert("Remplis au moins un champ avant d’ajouter la ligne.");
      return;
    }

    MANUAL_INTERVENTION_ROWS.push({
      emplacement: row.emplacement.trim(),
      element: row.element.trim(),
      detail: row.detail.trim(),
      dateCtrl: row.dateCtrl.trim(),
      etat: row.etat,
      commentaire: row.commentaire.trim()
    });

    saveAll();

    setState(
      "intervention",
      {
        etatFilters: activeEtatFilters,
        familleFilters: activeFamilleFilters,
        showManualForm: false
      },
      false
    );
  };

  fields.appendChild(emplacement);
  fields.appendChild(element);
  fields.appendChild(detail);
  fields.appendChild(dateCtrl);
  fields.appendChild(etatWrap);
  fields.appendChild(commentaire);

  actions.appendChild(cancelBtn);
  actions.appendChild(addBtn);

  card.appendChild(fields);
  card.appendChild(actions);

  return card;
}

function collectInterventionRows(
  etatFilters = getInterventionDefaultFilters(),
  familleFilters = getInterventionDefaultFamilles()
) {
  const rows = [];
  const aggregates = new Map();

  const ALL_ETAT_FILTERS = ["critical","warning","control","defaut","inhibee","preventif"];
  const allEtatsActifs = ALL_ETAT_FILTERS.every((f) => etatFilters.includes(f));
  const allFamillesActives = getInterventionDetailedFamilleFilters().every((f) => familleFilters.includes(f));

  function shouldIncludeFlags(flags) {
    if (!Array.isArray(etatFilters) || etatFilters.length === 0) return false;
    // Tous états cochés → montrer tout ce qui a un flag
    if (allEtatsActifs) {
      return flags.critique || flags.aPrevoir || flags.aControler ||
             flags.celluleDefaut || flags.celluleInhibee || flags.controlePreventif;
    }
    return (
      (flags.critique        && etatFilters.includes("critical"))   ||
      (flags.aPrevoir        && etatFilters.includes("warning"))    ||
      (flags.aControler      && etatFilters.includes("control"))    ||
      (flags.celluleDefaut   && etatFilters.includes("defaut"))     ||
      (flags.celluleInhibee  && etatFilters.includes("inhibee"))    ||
      (flags.controlePreventif && etatFilters.includes("preventif"))
    );
  }

  function shouldIncludeFamille(aggregate) {
    if (!Array.isArray(familleFilters) || familleFilters.length === 0) return false;
    if (allFamillesActives) return true;
    const detailFamille = aggregate?._familleDetail || aggregate?._famille;
    const broadFamille = aggregate?._famille;
    return familleFilters.includes(detailFamille) || familleFilters.includes(broadFamille);
  }

  function makeFlags({
    critique = false,
    aPrevoir = false,
    aControler = false,
    commentaire = false,
    celluleDefaut = false,
    celluleInhibee = false,
    controlePreventif = false
  } = {}) {
    return {
      critique: critique === true,
      aPrevoir: aPrevoir === true,
      aControler: aControler === true,
      commentaire: false,
      celluleDefaut: celluleDefaut === true,
      celluleInhibee: celluleInhibee === true,
      controlePreventif: controlePreventif === true
    };
  }

  function buildAggregateKey(famille, gotoType, gotoData, fallback = "") {
    if (gotoType) {
      return `${famille}||${gotoType}||${JSON.stringify(gotoData || {})}`;
    }
    return `${famille}||${fallback}`;
  }

  function pickLatestDate(currentDate, nextDate) {
    const a = (currentDate || "").trim();
    const b = (nextDate || "").trim();

    if (!a) return b;
    if (!b) return a;

    return a >= b ? a : b;
  }

  function formatPieceLabel(piece = "", reference = "") {
    const cleanPiece = (piece || "").trim();
    const cleanReference = (reference || "").trim();

    if (cleanPiece && cleanReference) {
      return `${cleanPiece} (${cleanReference})`;
    }

    return cleanPiece || cleanReference || "";
  }

  function addUniqueText(set, value) {
    const text = (value || "").trim();
    if (text) {
      set.add(text);
    }
  }

  function createAggregate(config) {
    const aggregateKey = buildAggregateKey(
      config.famille,
      config.gotoType,
      config.gotoData,
      `${config.emplacement || ""}||${config.element || ""}`
    );

    if (!aggregates.has(aggregateKey)) {
      aggregates.set(aggregateKey, {
        emplacement: config.emplacement || "",
        element: config.element || "",
        detail: "",
        dateCtrl: config.dateCtrl || "",
        etat: "",
        commentaire: "",
        _flags: makeFlags(),
        _famille: config.famille,
        _familleDetail: config.familleDetail || config.famille,
        _familleOrder: getFamilleOrder(config.familleDetail || config.famille),
        _gotoType: config.gotoType || null,
        _gotoData: config.gotoData || null,
        _etatOrder: 99,
        _trainOrder: config.trainOrder || 99,
        _chariotNumber: config.chariotNumber || 9999,
        _zoneOrder: config.zoneOrder || 999,
        _celluleNumber: config.celluleNumber || 999,
        _pieceOrder: config.pieceOrder || 0,
        _aggregateKey: aggregateKey,
        _detailBuckets: {
          critique: new Set(),
          aPrevoir: new Set(),
          aControler: new Set(),
          controlePreventif: new Set(),
          commentaire: new Set()
        },
        _commentTexts: []
      });
    }

    return aggregates.get(aggregateKey);
  }

  function applyFlagsToAggregate(aggregate, flags) {
    if (flags.critique) aggregate._flags.critique = true;
    if (flags.aPrevoir) aggregate._flags.aPrevoir = true;
    if (flags.aControler) aggregate._flags.aControler = true;
    if (flags.controlePreventif) aggregate._flags.controlePreventif = true;
    if (flags.celluleDefaut) aggregate._flags.celluleDefaut = true;
    if (flags.celluleInhibee) aggregate._flags.celluleInhibee = true;
  }


  function applyCommentStateFlagsToAggregate(aggregate, commentItem, labelFallback = "État général") {
    if (!aggregate || !commentItem || typeof commentItem !== "object") {
      return;
    }

    const label =
      (commentItem.elementConcerne || "").trim() ||
      (commentItem.text || "").trim() ||
      labelFallback;

    if (commentItem.critique === true) {
      applyFlagsToAggregate(aggregate, makeFlags({ critique: true }));
      addUniqueText(aggregate._detailBuckets.critique, label);
      aggregate.dateCtrl = pickLatestDate(aggregate.dateCtrl, commentItem.date || "");
    }

    if (commentItem.aPrevoir === true) {
      applyFlagsToAggregate(aggregate, makeFlags({ aPrevoir: true }));
      addUniqueText(aggregate._detailBuckets.aPrevoir, label);
      aggregate.dateCtrl = pickLatestDate(aggregate.dateCtrl, commentItem.date || "");
    }

    if (commentItem.controlePreventif === true || commentItem.aControler === true) {
      applyFlagsToAggregate(aggregate, makeFlags({ controlePreventif: true }));
      addUniqueText(aggregate._detailBuckets.controlePreventif, label);
      aggregate.dateCtrl = pickLatestDate(aggregate.dateCtrl, commentItem.date || "");
    }
  }

  function addCommentText(aggregate, text, date = "", elementConcerne = "") {
    const cleanText = (text || "").trim();
    const cleanDate = (date || "").trim();
    const cleanElement = (elementConcerne || "").trim();

    if (!cleanText && !cleanDate && !cleanElement) {
      return;
    }

    const parts = [];

    if (cleanDate) parts.push(`[${cleanDate}]`);
    if (cleanElement) parts.push(cleanElement);
    if (cleanText) parts.push(cleanText);

    const finalText = parts.join(" - ").trim();
    if (finalText) {
      aggregate._commentTexts.push(finalText);
    }
  }

  function finalizeAggregate(aggregate) {
    const detailParts = [];

    const critiques = Array.from(aggregate._detailBuckets.critique);
    const aPrevoirs = Array.from(aggregate._detailBuckets.aPrevoir);
    const aControlers = Array.from(aggregate._detailBuckets.aControler);
    const preventifs = Array.from(aggregate._detailBuckets.controlePreventif);

    if (critiques.length) {
      detailParts.push(`Critique : ${critiques.join(", ")}`);
    }

    if (aPrevoirs.length) {
      detailParts.push(`À prévoir : ${aPrevoirs.join(", ")}`);
    }

    if (aControlers.length) {
      detailParts.push(`À contrôler J+1 : ${aControlers.join(", ")}`);
    }

    if (preventifs.length) {
      detailParts.push(`Préventif : ${preventifs.join(", ")}`);
    }

    aggregate.detail = detailParts.join(" | ");
    aggregate.dateCtrl = aggregate.dateCtrl || "";

    const override =
      INTERVENTION_COMMENT_OVERRIDES &&
      typeof INTERVENTION_COMMENT_OVERRIDES === "object"
        ? INTERVENTION_COMMENT_OVERRIDES[aggregate._aggregateKey] || ""
        : "";

    aggregate.commentaire = override || "";

    aggregate.etat =
      aggregate._flags.critique ? "Critique"
      : aggregate._flags.celluleDefaut ? "Défaut"
      : aggregate._flags.celluleInhibee ? "Inhibée"
      : aggregate._flags.aPrevoir ? "À prévoir"
      : aggregate._flags.aControler ? "À contrôler J+1"
      : aggregate._flags.controlePreventif ? "Contrôle préventif"
      : "";

    aggregate._etatOrder = getEtatOrderFromFlags(aggregate._flags);

    delete aggregate._detailBuckets;
    delete aggregate._commentTexts;
  }

  const familleTrieur = "trieur";
  const familleInjecteur = "injecteur";
  const familleSortie = "sortie";

  for (
    let boxNumber = CONFIG_APP.ENERGYBOX_TRAIN_1_START;
    boxNumber <= CONFIG_APP.ENERGYBOX_TRAIN_2_END;
    boxNumber++
  ) {
    ensureEnergyBoxData(boxNumber);
    const key = getEnergyBoxKey(boxNumber);
    const trainOrder =
      boxNumber <= CONFIG_APP.ENERGYBOX_TRAIN_1_END ? 1 : 2;
    const data = DATA_ENERGYBOX[key];

    const aggregate = createAggregate({
      famille: familleTrieur,
      familleDetail: "energybox",
      gotoType: "energyCase",
      gotoData: { boxNumber },
      emplacement: trainOrder === 1 ? "Train 1" : "Train 2",
      element: `EnergyBox / Pickup n°${boxNumber}`,
      dateCtrl: "",
      trainOrder,
      chariotNumber: boxNumber,
      zoneOrder: 0,
      celluleNumber: 0,
      pieceOrder: 0
    });

    if (data.energyBox.aChanger === true) {
      applyFlagsToAggregate(aggregate, makeFlags({ critique: true }));
      addUniqueText(
        aggregate._detailBuckets.critique,
        formatPieceLabel("EnergyBox", data.energyBox.article || "")
      );
      aggregate.dateCtrl = pickLatestDate(
        aggregate.dateCtrl,
        data.energyBox.dateDefaut || data.energyBox.dateChgt || ""
      );
    }

    if (data.pickup1.aChanger === true) {
      applyFlagsToAggregate(aggregate, makeFlags({ critique: true }));
      addUniqueText(
        aggregate._detailBuckets.critique,
        formatPieceLabel("Pickup1", data.pickup1.reference || "")
      );
      aggregate.dateCtrl = pickLatestDate(aggregate.dateCtrl, data.pickup1.dateChgt || "");
    }

    if (data.pickup2.aChanger === true) {
      applyFlagsToAggregate(aggregate, makeFlags({ critique: true }));
      addUniqueText(
        aggregate._detailBuckets.critique,
        formatPieceLabel("Pickup2", data.pickup2.reference || "")
      );
      aggregate.dateCtrl = pickLatestDate(aggregate.dateCtrl, data.pickup2.dateChgt || "");
    }
  }

  for (
    let chariotNumber = CONFIG_APP.CHARIOT_MIN;
    chariotNumber <= CONFIG_APP.CHARIOT_MAX;
    chariotNumber++
  ) {
    const trainOrder = chariotNumber <= CONFIG_APP.TRAIN_1_END ? 1 : 2;
    const [cell1, cell2] = getCellulesForChariot(chariotNumber);

    const celluleEntries = [
      { celluleNumber: cell1, key: getCelluleKey(cell1) },
      { celluleNumber: cell2, key: getCelluleKey(cell2) }
    ];

    celluleEntries.forEach(({ celluleNumber, key }) => {
      ensureLocalRows(DATA_CELLULES, key, MODELE_CELLULE);
      ensureCommentRows(COMMENTS_CELLULES, key);

      const aggregate = createAggregate({
        famille: familleTrieur,
        familleDetail: "cellule",
        gotoType: "cellule",
        gotoData: { celluleNumber, chariotNumber },
        emplacement: `Chariot ${chariotNumber}`,
        element: `Cellule ${celluleNumber}`,
        dateCtrl: "",
        trainOrder,
        chariotNumber,
        zoneOrder: 1,
        celluleNumber,
        pieceOrder: 0
      });

      const pieceRows = DATA_CELLULES[key];
      const modelRows = MODELE_CELLULE;

      pieceRows.forEach((row, index) => {
        const modelItem = modelRows[index] || {};
        const pieceLabel = formatPieceLabel(modelItem.piece || "", modelItem.reference || "");

        if (row.critique === true) {
          applyFlagsToAggregate(aggregate, makeFlags({ critique: true }));
          addUniqueText(aggregate._detailBuckets.critique, pieceLabel);
          aggregate.dateCtrl = pickLatestDate(aggregate.dateCtrl, row.dateCtrl || "");
        }

        if (row.aPrevoir === true) {
          applyFlagsToAggregate(aggregate, makeFlags({ aPrevoir: true }));
          addUniqueText(aggregate._detailBuckets.aPrevoir, pieceLabel);
          aggregate.dateCtrl = pickLatestDate(aggregate.dateCtrl, row.dateCtrl || "");
        }

        if ((row.controlePreventif === true || row.aControler === true)) {
          applyFlagsToAggregate(aggregate, makeFlags({ controlePreventif: true }));
          addUniqueText(aggregate._detailBuckets.controlePreventif, pieceLabel);
          aggregate.dateCtrl = pickLatestDate(aggregate.dateCtrl, row.dateCtrl || "");
        }
      });

      COMMENTS_CELLULES[key].forEach((commentItem, commentIndex) => {
        if (!commentItem || typeof commentItem !== "object") {
          return;
        }

        const isHeaderStateRow = commentIndex === 0;
        const isSystemFollowUpRow =
          typeof commentItem.suiviType === "string" &&
          commentItem.suiviType.trim() !== "";

        // Les fiches de suivi défaut / inhibition validées sont des historiques.
        // Elles ne doivent plus alimenter le tableau "Détail des anomalies".
        // Seul l'état actif de la cellule (ligne 0) + les commentaires visibles du
        // contrôle préventif doivent créer une ligne à traiter.
        if (isSystemFollowUpRow) {
          return;
        }

        const hasTextContent =
          !isHeaderStateRow &&
          ((commentItem.text || "").trim() !== "" ||
            (commentItem.elementConcerne || "").trim() !== "" ||
            (commentItem.date || "").trim() !== "");

        applyCommentStateFlagsToAggregate(aggregate, commentItem, "État cellule");

      if (commentItem?.aControler === true) {
          applyFlagsToAggregate(aggregate, makeFlags({ aControler: true }));
          addUniqueText(aggregate._detailBuckets.aControler, "État cellule à contrôler J+1");
          aggregate.dateCtrl = pickLatestDate(aggregate.dateCtrl, commentItem.date || "");
        }

        if (commentItem?.controlePreventif === true) {
          applyFlagsToAggregate(aggregate, makeFlags({ controlePreventif: true }));
          addUniqueText(aggregate._detailBuckets.controlePreventif, "Contrôle préventif");
          aggregate.dateCtrl = pickLatestDate(aggregate.dateCtrl, commentItem.date || "");
        }

        if (commentItem?.celluleDefaut === true) {
          applyFlagsToAggregate(aggregate, makeFlags({ celluleDefaut: true }));
          aggregate.dateCtrl = pickLatestDate(aggregate.dateCtrl, commentItem.date || "");
        }

        if (commentItem?.celluleInhibee === true) {
          applyFlagsToAggregate(aggregate, makeFlags({ celluleInhibee: true }));
          aggregate.dateCtrl = pickLatestDate(aggregate.dateCtrl, commentItem.date || "");
        }

        if (hasTextContent) {
          applyFlagsToAggregate(aggregate, makeFlags({ commentaire: true }));
          addUniqueText(
            aggregate._detailBuckets.commentaire,
            (commentItem.elementConcerne || "").trim()
          );
          addCommentText(
            aggregate,
            commentItem.text || "",
            commentItem.date || "",
            commentItem.elementConcerne || ""
          );
          aggregate.dateCtrl = pickLatestDate(aggregate.dateCtrl, commentItem.date || "");
        }
      });
    });

    const chariotKey = getChariotKey(chariotNumber);
    const chariotParts = getChariotParts(chariotNumber);

    ensureLocalRows(DATA_CHARIOTS, chariotKey, chariotParts);
    ensureCommentRows(COMMENTS_CHARIOTS, chariotKey);

    const chariotAggregate = createAggregate({
      famille: familleTrieur,
      familleDetail: "chariot",
      gotoType: "chariotPieces",
      gotoData: { chariotNumber },
      emplacement: getTrainLabelForChariot(chariotNumber),
      element: `Chariot ${chariotNumber}`,
      dateCtrl: "",
      trainOrder,
      chariotNumber,
      zoneOrder: 2,
      celluleNumber: 999,
      pieceOrder: 0
    });

    const chariotRows = DATA_CHARIOTS[chariotKey];

    chariotRows.forEach((row, index) => {
      const modelItem = chariotParts[index] || {};
      const pieceLabel = formatPieceLabel(modelItem.piece || "", modelItem.reference || "");

      if (row.critique === true) {
        applyFlagsToAggregate(chariotAggregate, makeFlags({ critique: true }));
        addUniqueText(chariotAggregate._detailBuckets.critique, pieceLabel);
        chariotAggregate.dateCtrl = pickLatestDate(chariotAggregate.dateCtrl, row.dateCtrl || "");
      }

      if (row.aPrevoir === true) {
        applyFlagsToAggregate(chariotAggregate, makeFlags({ aPrevoir: true }));
        addUniqueText(chariotAggregate._detailBuckets.aPrevoir, pieceLabel);
        chariotAggregate.dateCtrl = pickLatestDate(chariotAggregate.dateCtrl, row.dateCtrl || "");
      }

      if ((row.controlePreventif === true || row.aControler === true)) {
        applyFlagsToAggregate(chariotAggregate, makeFlags({ controlePreventif: true }));
        addUniqueText(chariotAggregate._detailBuckets.controlePreventif, pieceLabel);
        chariotAggregate.dateCtrl = pickLatestDate(chariotAggregate.dateCtrl, row.dateCtrl || "");
      }
    });

    COMMENTS_CHARIOTS[chariotKey].forEach((commentItem, commentIndex) => {
      const hasTextContent =
        (commentItem?.text || "").trim() !== "" ||
        (commentItem?.elementConcerne || "").trim() !== "" ||
        (commentItem?.date || "").trim() !== "";
      const canUseCommentFlags = commentIndex > 0 && hasTextContent;

      if (canUseCommentFlags) {
        applyCommentStateFlagsToAggregate(chariotAggregate, commentItem, "État général chariot");
      }

      if (canUseCommentFlags && (commentItem?.controlePreventif === true || commentItem?.aControler === true)) {
        applyFlagsToAggregate(chariotAggregate, makeFlags({ controlePreventif: true }));
        chariotAggregate.dateCtrl = pickLatestDate(
          chariotAggregate.dateCtrl,
          commentItem.date || ""
        );
      }

      if (hasTextContent) {
        applyFlagsToAggregate(chariotAggregate, makeFlags({ commentaire: true }));
        addUniqueText(
          chariotAggregate._detailBuckets.commentaire,
          (commentItem.elementConcerne || "").trim()
        );
        addCommentText(
          chariotAggregate,
          commentItem.text || "",
          commentItem.date || "",
          commentItem.elementConcerne || ""
        );
        chariotAggregate.dateCtrl = pickLatestDate(
          chariotAggregate.dateCtrl,
          commentItem.date || ""
        );
      }
    });
  }

  for (
    let groupNumber = CONFIG_APP.GROUPE_MOTEUR_MIN;
    groupNumber <= CONFIG_APP.GROUPE_MOTEUR_MAX;
    groupNumber++
  ) {
    const key = getGroupeMoteurKey(groupNumber);

    ensureLocalRows(DATA_GROUPE_MOTEUR, key, MODELE_GROUPE_MOTEUR);
    ensureCommentRows(COMMENTS_GROUPE_MOTEUR, key);

    const aggregate = createAggregate({
      famille: familleTrieur,
      familleDetail: "groupeMoteur",
      gotoType: "groupeMoteurDetail",
      gotoData: { groupNumber },
      emplacement: "Trieur",
      element: `Groupe moteur ${groupNumber}`,
      dateCtrl: "",
      trainOrder: 3,
      chariotNumber: groupNumber,
      zoneOrder: 1,
      celluleNumber: 0,
      pieceOrder: 0
    });

    const rowsData = DATA_GROUPE_MOTEUR[key];

    rowsData.forEach((row, index) => {
      const modelItem = MODELE_GROUPE_MOTEUR[index] || {};
      const pieceLabel = formatPieceLabel(modelItem.piece || "", modelItem.reference || "");

      if (row.critique === true) {
        applyFlagsToAggregate(aggregate, makeFlags({ critique: true }));
        addUniqueText(aggregate._detailBuckets.critique, pieceLabel);
        aggregate.dateCtrl = pickLatestDate(aggregate.dateCtrl, row.dateCtrl || "");
      }

      if (row.aPrevoir === true) {
        applyFlagsToAggregate(aggregate, makeFlags({ aPrevoir: true }));
        addUniqueText(aggregate._detailBuckets.aPrevoir, pieceLabel);
        aggregate.dateCtrl = pickLatestDate(aggregate.dateCtrl, row.dateCtrl || "");
      }

      if (row.controlePreventif === true || row.aControler === true) {
        applyFlagsToAggregate(aggregate, makeFlags({ controlePreventif: true }));
        addUniqueText(aggregate._detailBuckets.controlePreventif, pieceLabel);
        aggregate.dateCtrl = pickLatestDate(aggregate.dateCtrl, row.dateCtrl || "");
      }
    });

    COMMENTS_GROUPE_MOTEUR[key].forEach((commentItem, commentIndex) => {
      const hasTextContent =
        (commentItem?.text || "").trim() !== "" ||
        (commentItem?.elementConcerne || "").trim() !== "" ||
        (commentItem?.date || "").trim() !== "";
      const canUseCommentFlags = commentIndex > 0 && hasTextContent;

      if (canUseCommentFlags) {
        applyCommentStateFlagsToAggregate(aggregate, commentItem, "État général groupe moteur");
      }

      if (canUseCommentFlags && (commentItem?.controlePreventif === true || commentItem?.aControler === true)) {
        applyFlagsToAggregate(aggregate, makeFlags({ controlePreventif: true }));
        aggregate.dateCtrl = pickLatestDate(aggregate.dateCtrl, commentItem.date || "");
      }

      if (hasTextContent) {
        applyFlagsToAggregate(aggregate, makeFlags({ commentaire: true }));
        addUniqueText(
          aggregate._detailBuckets.commentaire,
          (commentItem.elementConcerne || "").trim()
        );
        addCommentText(
          aggregate,
          commentItem.text || "",
          commentItem.date || "",
          commentItem.elementConcerne || ""
        );
        aggregate.dateCtrl = pickLatestDate(aggregate.dateCtrl, commentItem.date || "");
      }
    });
  }

  const injecteurCommentsStore = getInjecteurCommentsStoreSafe();

  getInjecteurIdsForIntervention().forEach((injecteurNumber) => {
    const key = getInjecteurKey(injecteurNumber);
    ensureCommentRows(injecteurCommentsStore, key);

    const injecteurCommentAggregate = createAggregate({
      famille: familleInjecteur,
      familleDetail: "injecteur",
      gotoType: "injecteurDetail",
      gotoData: { injecteurNumber },
      emplacement: "Injecteurs",
      element: `Injecteur ${injecteurNumber}`,
      dateCtrl: "",
      trainOrder: 4,
      chariotNumber: injecteurNumber,
      zoneOrder: 1,
      celluleNumber: 0,
      pieceOrder: 0
    });

    injecteurCommentsStore[key].forEach((item, commentIndex) => {
      const hasTextContent =
        (item?.text || "").trim() !== "" ||
        (item?.elementConcerne || "").trim() !== "" ||
        (item?.date || "").trim() !== "";
      const canUseCommentFlags = commentIndex > 0 && hasTextContent;

      if (canUseCommentFlags) {
        applyCommentStateFlagsToAggregate(injecteurCommentAggregate, item, "État général injecteur");
      }

      if (canUseCommentFlags && (item?.controlePreventif === true || item?.aControler === true)) {
        applyFlagsToAggregate(injecteurCommentAggregate, makeFlags({ controlePreventif: true }));
        injecteurCommentAggregate.dateCtrl = pickLatestDate(
          injecteurCommentAggregate.dateCtrl,
          item.date || ""
        );
      }

      if (hasTextContent) {
        applyFlagsToAggregate(injecteurCommentAggregate, makeFlags({ commentaire: true }));
        addUniqueText(
          injecteurCommentAggregate._detailBuckets.commentaire,
          (item.elementConcerne || "").trim()
        );
        addCommentText(
          injecteurCommentAggregate,
          item.text || "",
          item.date || "",
          item.elementConcerne || ""
        );
        injecteurCommentAggregate.dateCtrl = pickLatestDate(
          injecteurCommentAggregate.dateCtrl,
          item.date || ""
        );
      }
    });

    INJECTEUR_CONVOYEURS.forEach((conv, convIndex) => {
      ["convoyeur", "motorisation"].forEach((type, typeIndex) => {
        ensureInjecteurPieceRows(
          DATA_INJECTEUR_CONVOYEURS,
          injecteurNumber,
          conv.key,
          type
        );

        const dataRows =
          DATA_INJECTEUR_CONVOYEURS[injecteurNumber]?.[conv.key]?.[type] || [];
        const modelRows =
          MODELE_INJECTEUR_CONVOYEURS[injecteurNumber]?.[conv.key]?.[type] || [];

        const aggregate = createAggregate({
          famille: familleInjecteur,
          familleDetail: "injecteur",
          gotoType: "injecteurConvoyeurDetail",
          gotoData: { injecteurNumber, convoyeurKey: conv.key },
          emplacement: `Injecteur ${injecteurNumber}`,
          element: conv.label,
          dateCtrl: "",
          trainOrder: 4,
          chariotNumber: injecteurNumber,
          zoneOrder: 10 + convIndex,
          celluleNumber: typeIndex,
          pieceOrder: 0
        });

        dataRows.forEach((row, index) => {
          const modelItem = modelRows[index] || {};
          const pieceLabel = formatPieceLabel(modelItem.piece || "", modelItem.reference || "");

          if (row.critique === true) {
            applyFlagsToAggregate(aggregate, makeFlags({ critique: true }));
            addUniqueText(aggregate._detailBuckets.critique, pieceLabel);
            aggregate.dateCtrl = pickLatestDate(aggregate.dateCtrl, row.dateCtrl || "");
          }

          if (row.aPrevoir === true) {
            applyFlagsToAggregate(aggregate, makeFlags({ aPrevoir: true }));
            addUniqueText(aggregate._detailBuckets.aPrevoir, pieceLabel);
            aggregate.dateCtrl = pickLatestDate(aggregate.dateCtrl, row.dateCtrl || "");
          }

          if (row.controlePreventif === true || row.aControler === true) {
            applyFlagsToAggregate(aggregate, makeFlags({ controlePreventif: true }));
            addUniqueText(aggregate._detailBuckets.controlePreventif, pieceLabel);
            aggregate.dateCtrl = pickLatestDate(aggregate.dateCtrl, row.dateCtrl || "");
          }

          if ((row.commentaire || "").trim() !== "") {
            applyFlagsToAggregate(aggregate, makeFlags({ commentaire: true }));
            addUniqueText(aggregate._detailBuckets.commentaire, modelItem.piece || "");
            addCommentText(
              aggregate,
              row.commentaire || "",
              row.dateCtrl || "",
              modelItem.piece || ""
            );
            aggregate.dateCtrl = pickLatestDate(aggregate.dateCtrl, row.dateCtrl || "");
          }
        });
      });
    });
  });

  for (
    let sortieNumber = CONFIG_APP.SORTIE_MIN;
    sortieNumber <= CONFIG_APP.SORTIE_MAX;
    sortieNumber++
  ) {
    const key = getSortieKey(sortieNumber);

    ensureLocalRows(DATA_SORTIES, key, MODELE_SORTIE);
    ensureCommentRows(COMMENTS_SORTIES, key);

    const aggregate = createAggregate({
      famille: familleSortie,
      familleDetail: "sortie",
      gotoType: "sortie",
      gotoData: { sortieNumber },
      emplacement: "TCC",
      element: `Sortie ${sortieNumber}`,
      dateCtrl: "",
      trainOrder: 5,
      chariotNumber: sortieNumber,
      zoneOrder: 1,
      celluleNumber: 0,
      pieceOrder: 0
    });

    DATA_SORTIES[key].forEach((row, index) => {
      const modelItem = MODELE_SORTIE[index] || {};
      const pieceLabel = formatPieceLabel(modelItem.piece || "", modelItem.reference || "");

      if (row.critique === true) {
        applyFlagsToAggregate(aggregate, makeFlags({ critique: true }));
        addUniqueText(aggregate._detailBuckets.critique, pieceLabel);
        aggregate.dateCtrl = pickLatestDate(aggregate.dateCtrl, row.dateCtrl || "");
      }

      if (row.aPrevoir === true) {
        applyFlagsToAggregate(aggregate, makeFlags({ aPrevoir: true }));
        addUniqueText(aggregate._detailBuckets.aPrevoir, pieceLabel);
        aggregate.dateCtrl = pickLatestDate(aggregate.dateCtrl, row.dateCtrl || "");
      }

      if (row.controlePreventif === true || row.aControler === true) {
        applyFlagsToAggregate(aggregate, makeFlags({ controlePreventif: true }));
        addUniqueText(aggregate._detailBuckets.controlePreventif, pieceLabel);
        aggregate.dateCtrl = pickLatestDate(aggregate.dateCtrl, row.dateCtrl || "");
      }
    });

    COMMENTS_SORTIES[key].forEach((commentItem, commentIndex) => {
      const hasTextContent =
        (commentItem?.text || "").trim() !== "" ||
        (commentItem?.elementConcerne || "").trim() !== "" ||
        (commentItem?.date || "").trim() !== "";
      const canUseCommentFlags = commentIndex > 0 && hasTextContent;

      if (canUseCommentFlags) {
        applyCommentStateFlagsToAggregate(aggregate, commentItem, "État général sortie");
      }

      if (canUseCommentFlags && (commentItem?.controlePreventif === true || commentItem?.aControler === true)) {
        applyFlagsToAggregate(aggregate, makeFlags({ controlePreventif: true }));
        aggregate.dateCtrl = pickLatestDate(aggregate.dateCtrl, commentItem.date || "");
      }

      if (hasTextContent) {
        applyFlagsToAggregate(aggregate, makeFlags({ commentaire: true }));
        addUniqueText(
          aggregate._detailBuckets.commentaire,
          (commentItem.elementConcerne || "").trim()
        );
        addCommentText(
          aggregate,
          commentItem.text || "",
          commentItem.date || "",
          commentItem.elementConcerne || ""
        );
        aggregate.dateCtrl = pickLatestDate(aggregate.dateCtrl, commentItem.date || "");
      }
    });
  }

  // ---- Collecte des portions convoyeurs ----
  if (
    typeof CONFIG_APP !== "undefined" &&
    typeof DATA_CONVOYEURS !== "undefined" &&
    typeof COMMENTS_CONVOYEURS !== "undefined"
  ) {
    const convMin = CONFIG_APP.CONVOYEUR_MIN || 1;
    const convMax = CONFIG_APP.CONVOYEUR_MAX || 10;
    for (let convNumber = convMin; convNumber <= convMax; convNumber++) {
      const key = typeof getConvoyeurKey === "function"
        ? getConvoyeurKey(convNumber)
        : ("convoyeur_" + convNumber);
      const label = typeof getConvoyeurLabel === "function"
        ? getConvoyeurLabel(convNumber)
        : ("Portion " + convNumber);
      const model = typeof MODELE_CONVOYEUR !== "undefined" ? MODELE_CONVOYEUR : [];

      ensureLocalRows(DATA_CONVOYEURS, key, model);

      const aggregate = createAggregate({
        famille: "convoyeur",
        familleDetail: "convoyeur",
        gotoType: "convoyeurDetail",
        gotoData: { convoyeurNumber: convNumber },
        emplacement: "Convoyeurs",
        element: "Convoyeur " + convNumber + " — " + label,
        dateCtrl: "",
        trainOrder: 8,
        chariotNumber: convNumber,
        zoneOrder: 1,
        celluleNumber: 0,
        pieceOrder: 0
      });

      const rowsData = DATA_CONVOYEURS[key] || [];
      rowsData.forEach((row, index) => {
        const modelItem = model[index] || {};
        const pieceLabel = formatPieceLabel(modelItem.piece || "", modelItem.reference || "");
        if (row.critique === true) {
          applyFlagsToAggregate(aggregate, makeFlags({ critique: true }));
          addUniqueText(aggregate._detailBuckets.critique, pieceLabel);
        }
        if (row.aPrevoir === true) {
          applyFlagsToAggregate(aggregate, makeFlags({ aPrevoir: true }));
          addUniqueText(aggregate._detailBuckets.aPrevoir, pieceLabel);
        }
        if (row.controlePreventif === true) {
          applyFlagsToAggregate(aggregate, makeFlags({ controlePreventif: true }));
        }
      });

      const comments = (COMMENTS_CONVOYEURS && COMMENTS_CONVOYEURS[key]) || [];
      comments.forEach((commentItem, commentIndex) => {
        const hasText = (commentItem?.text || "").trim() !== "" ||
                        (commentItem?.elementConcerne || "").trim() !== "";
        if (commentIndex > 0 && hasText) {
          applyCommentStateFlagsToAggregate(aggregate, commentItem, label);
        }
        if (hasText) {
          addCommentText(aggregate, commentItem.text || "", commentItem.date || "", commentItem.elementConcerne || "");
        }
      });

      finalizeAggregate(aggregate);
      if (shouldIncludeFamille(aggregate) && shouldIncludeFlags(aggregate._flags)) {
        rows.push(aggregate);
      }
    }
  }

  aggregates.forEach((aggregate) => {
    finalizeAggregate(aggregate);

    if (
      shouldIncludeFamille(aggregate) &&
      shouldIncludeFlags(aggregate._flags)
    ) {
      rows.push(aggregate);
    }
  });

  MANUAL_INTERVENTION_ROWS.forEach((item, index) => {
    const flags = makeFlags({
      critique: item.etat === "Critique",
      aPrevoir: item.etat === "À prévoir",
      aControler: false,
      controlePreventif: item.etat === "Contrôle préventif" || item.etat === "À contrôler"
    });

    if (!shouldIncludeFlags(flags) || !shouldIncludeFamille({ _famille: "manuel", _familleDetail: "manuel" })) {
      return;
    }

    rows.push({
      emplacement: item.emplacement || "",
      element: item.element || "",
      detail: item.detail || "",
      dateCtrl: item.dateCtrl || "",
      etat: item.etat || "Contrôle préventif",
      commentaire: item.commentaire || "",
      _flags: flags,
      _famille: "manuel",
      _familleDetail: "manuel",
      _familleOrder: getFamilleOrder("manuel"),
      _gotoType: null,
      _gotoData: null,
      _etatOrder: getEtatOrderFromFlags(flags),
      _trainOrder: 99,
      _chariotNumber: 9999,
      _zoneOrder: 999,
      _celluleNumber: 999,
      _pieceOrder: index,
      _aggregateKey: `manuel||${index}`
    });
  });

  return rows;
}

function printInterventionTable() {
  const sourceTable = document.querySelector(".intervention-table");
  if (!sourceTable) {
    alert("Aucun tableau à imprimer.");
    return;
  }

  const clonedTable = sourceTable.cloneNode(true);

  const stateColumnIndexes = [4, 5, 6, 7, 8, 9];
  const noteColumnIndex = 10;
  const actionColumnIndex = 11;

  const headerRow = clonedTable.querySelector("thead tr");
  if (headerRow) {
    const ths = Array.from(headerRow.querySelectorAll("th"));

    const labels = [
      "Emplacement",
      "Élément concerné",
      "Référence / Détail",
      "Date",
      "Critique",
      "À prévoir",
      "À contrôler J+1",
      "En défaut",
      "Inhibée",
      "Préventif",
      "Note"
    ];

    ths.forEach((th, index) => {
      if (index < labels.length) {
        th.textContent = labels[index];
      }
    });

    if (ths[actionColumnIndex]) {
      ths[actionColumnIndex].remove();
    }
  }

  const bodyRows = clonedTable.querySelectorAll("tbody tr");

  bodyRows.forEach((row) => {
    const cells = Array.from(row.querySelectorAll("td"));

    if (cells[actionColumnIndex]) {
      cells[actionColumnIndex].remove();
    }

    stateColumnIndexes.forEach((index) => {
      const cell = cells[index];
      if (!cell) return;

      const hasEtatPill = !!cell.querySelector(".etat-pill");
      const hasIndicator =
        !!cell.querySelector(".etat-critical, .etat-warning, .etat-control, .etat-defaut, .etat-inhibee, .etat-preventif");

      const text = (cell.textContent || "").trim();
      const shouldMark = hasEtatPill || hasIndicator || text === "●" || text === "•" || text === "1";

      cell.innerHTML = shouldMark ? "✕" : "";
      cell.style.textAlign = "center";
      cell.style.verticalAlign = "middle";
      cell.style.fontWeight = "700";
      cell.style.fontSize = "16px";
      cell.style.color = "#111";
    });

    const refreshedCells = Array.from(row.querySelectorAll("td"));
    const noteCell = refreshedCells[noteColumnIndex];
    if (noteCell) {
      noteCell.style.whiteSpace = "pre-line";
    }
  });

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Impossible d'ouvrir la fenêtre d'impression.");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <title>Récapitulatif intervention</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 24px;
            color: #111;
          }

          h1 {
            margin: 0 0 6px;
            font-size: 28px;
          }

          .print-subtitle {
            margin: 0;
            font-size: 14px;
          }

          .print-date {
            margin: 4px 0 18px;
            font-size: 13px;
            color: #444;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            font-size: 12px;
          }

          th,
          td {
            border: 1px solid #bfc7d1;
            padding: 6px 8px;
            vertical-align: top;
            word-break: break-word;
          }

          th {
            background: #eef2f6;
            text-align: center;
            font-weight: 700;
          }

          td:nth-child(1) { width: 110px; }
          td:nth-child(2) { width: 140px; }
          td:nth-child(3) { width: 220px; }
          td:nth-child(4) { width: 90px; }

          td:nth-child(5),
          td:nth-child(6),
          td:nth-child(7),
          td:nth-child(8),
          td:nth-child(9),
          td:nth-child(10) {
            width: 70px;
            text-align: center;
            vertical-align: middle;
            font-size: 16px;
            font-weight: 700;
          }

          td:nth-child(11) {
            width: 180px;
            white-space: pre-line;
          }

          @media print {
            body {
              padding: 10px;
            }

            h1 {
              font-size: 22px;
            }

            table {
              font-size: 11px;
            }

            td:nth-child(5),
            td:nth-child(6),
            td:nth-child(7),
            td:nth-child(8),
            td:nth-child(9),
            td:nth-child(10) {
              font-size: 14px;
            }
          }
        </style>
      </head>
      <body>
        <h1>Récapitulatif intervention</h1>
        <p class="print-subtitle">Suivi TCC et Transitique</p>
        <p class="print-date">Imprimé le ${new Date().toLocaleString("fr-FR")}</p>
        ${clonedTable.outerHTML}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function toggleInterventionFilter(currentFilters, filterKey) {
  const filters = Array.isArray(currentFilters) ? [...currentFilters] : [];

  if (filters.includes(filterKey)) {
    return filters.filter((item) => item !== filterKey);
  }

  filters.push(filterKey);
  return filters;
}

function navigateFromInterventionRow(item) {
  if (!item || !item._gotoType) {
    return;
  }

  setState(item._gotoType, item._gotoData || {}, true);
}

function createEtatIndicatorCell(active, className) {
  const td = document.createElement("td");
  td.className = "etat-indicator-cell";

  if (active) {
    const indicator = document.createElement("div");
    indicator.className = `etat-pill ${className}`;
    td.appendChild(indicator);
  }

  return td;
}

function getInterventionRowClass(flags) {
  if (flags.critique) return "row-critical";
  if (flags.aPrevoir) return "row-warning";
  if (flags.aControler) return "row-a-controler";
  if (flags.celluleDefaut) return "row-cellule-defaut";
  if (flags.celluleInhibee) return "row-cellule-inhibee";
  if (flags.controlePreventif) return "row-preventif";
  return "";
}

function createInterventionFiltersGroup(config, activeFilters, onToggle) {
  const wrap = document.createElement("div");
  wrap.className = "intervention-filters";

  config.forEach((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = activeFilters.includes(item.key)
      ? "intervention-filter-btn active"
      : "intervention-filter-btn";
    btn.textContent = item.label;
    btn.onclick = () => {
      onToggle(item.key);
    };
    wrap.appendChild(btn);
  });

  return wrap;
}

function createInterventionActionCell(item) {
  const tdAction = document.createElement("td");
  const actionWrap = createInterventionActionStack();

  if (item._famille === "manuel") {
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "comment-delete-button";
    deleteBtn.textContent = "Supprimer";
    deleteBtn.onclick = () => {
      MANUAL_INTERVENTION_ROWS.splice(item._pieceOrder, 1);
      saveAll();
      renderCurrentState();
    };
    actionWrap.appendChild(deleteBtn);
  } else {
    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "model-delete-button";
    clearBtn.textContent = "Vider note";
    clearBtn.onclick = () => {
      if (
        INTERVENTION_COMMENT_OVERRIDES &&
        typeof INTERVENTION_COMMENT_OVERRIDES === "object"
      ) {
        delete INTERVENTION_COMMENT_OVERRIDES[item._aggregateKey];
      }
      saveAll();
      renderCurrentState();
    };
    actionWrap.appendChild(clearBtn);
  }

  tdAction.appendChild(actionWrap);
  return tdAction;
}

function getChariotNumberFromCellule(celluleNumber) {
  return Math.floor(Number(celluleNumber) / 2) + 1;
}

function getLatestCelluleReportRecord(records = []) {
  const safeRecords = Array.isArray(records) ? records : [];
  return safeRecords[safeRecords.length - 1] || null;
}

function formatCelluleReportHistory(records = []) {
  const safeRecords = Array.isArray(records) ? records : [];
  return safeRecords
    .slice(-4)
    .map((record) => {
      const date = record.date || "";
      const label = record.suiviType === "cellule_inhibee"
        ? getCelluleInhibeeIssueLabel(record)
        : getCelluleDefautIssueLabel(record);
      return [date, label].filter(Boolean).join(" - ");
    })
    .filter(Boolean)
    .join("\n");
}

function collectCellulesTerrainRows(etatFilters = ["defaut", "inhibee", "control", "preventif"]) {
  const filters = Array.isArray(etatFilters) ? etatFilters : [];
  const rows = [];

  for (
    let celluleNumber = CONFIG_APP.CELLULE_MIN;
    celluleNumber <= CONFIG_APP.CELLULE_MAX;
    celluleNumber++
  ) {
    const key = getCelluleKey(celluleNumber);
    const chariotNumber = getChariotNumberFromCellule(celluleNumber);
    const header = getCelluleHeaderStateItem(celluleNumber);

    ensureLocalRows(DATA_CELLULES, key, MODELE_CELLULE);
    ensureCommentRows(COMMENTS_CELLULES, key);

    const pieceLabels = [];
    let hasPreventivePiece = false;
    DATA_CELLULES[key].forEach((row, index) => {
      if (
        row?.critique === true ||
        row?.aPrevoir === true ||
        row?.controlePreventif === true ||
        row?.aControler === true
      ) {
        const model = MODELE_CELLULE[index] || {};
        const label = [model.piece || "Pièce", model.reference || ""].filter(Boolean).join(" / ");
        pieceLabels.push(label);
      }

      if (row?.controlePreventif === true || row?.aControler === true) {
        hasPreventivePiece = true;
      }
    });

    const defautRecords = typeof getCelluleDefautRecords === "function"
      ? getCelluleDefautRecords(celluleNumber)
      : [];
    const inhibeeRecords = typeof getCelluleInhibeeRecords === "function"
      ? getCelluleInhibeeRecords(celluleNumber)
      : [];
    const latestDefaut = getLatestCelluleReportRecord(defautRecords);
    const latestInhibee = getLatestCelluleReportRecord(inhibeeRecords);
    const latestRecord = latestInhibee || latestDefaut;

    const visibleComments = (COMMENTS_CELLULES[key] || [])
      .filter((item, index) => index > 0 && item && !item.suiviType)
      .filter((item) => (item.text || "").trim() || (item.elementConcerne || "").trim())
      .map((item) => {
        const parts = [];
        if ((item.date || "").trim()) parts.push(`[${item.date}]`);
        if ((item.elementConcerne || "").trim()) parts.push(item.elementConcerne.trim());
        if ((item.text || "").trim()) parts.push(item.text.trim());
        return parts.join(" - ");
      });

    const statusParts = [];
    const filterKeys = [];

    if (header.celluleDefaut === true) {
      statusParts.push("En défaut");
      filterKeys.push("defaut");
    }

    if (header.celluleInhibee === true) {
      statusParts.push("Inhibée");
      filterKeys.push("inhibee");
    }

    if (header.aControler === true) {
      statusParts.push("À contrôler J+1");
      filterKeys.push("control");
    }

    if (header.controlePreventif === true || hasPreventivePiece) {
      statusParts.push("Contrôle préventif");
      filterKeys.push("preventif");
    }

    const matchesFilter = filterKeys.some((keyName) => filters.includes(keyName));
    if (!matchesFilter) {
      continue;
    }

    const latestDate = latestRecord?.date || header.date || "";
    const technicien = latestRecord?.technicien || "";
    const constat = latestDefaut?.constat || latestInhibee?.observation || "";
    const action = latestDefaut?.action || latestInhibee?.observation || "";
    const historique = formatCelluleReportHistory([...defautRecords, ...inhibeeRecords]);
    const nok = header.celluleDefaut || header.celluleInhibee || header.aControler;

    rows.push({
      celluleNumber,
      chariotNumber,
      train: getTrainLabelForCellule(celluleNumber),
      etat: statusParts.join(" / ") || "Contrôle préventif",
      date: latestDate,
      technicien,
      pieces: pieceLabels.join("\n"),
      constat,
      testStation: nok ? "NOK" : "",
      action,
      commentaires: visibleComments.join("\n"),
      historique,
      constatFinal: nok ? "NOK" : "À contrôler J+1"
    });
  }

  return rows;
}

function createCellulesTerrainTableHead() {
  const thead = document.createElement("thead");

  const groupRow = document.createElement("tr");
  const constat = document.createElement("th");
  constat.colSpan = 6;
  constat.textContent = "CONSTATATION";
  const actions = document.createElement("th");
  actions.colSpan = 5;
  actions.textContent = "ACTIONS / HISTORIQUE";
  groupRow.appendChild(constat);
  groupRow.appendChild(actions);

  const labelsRow = document.createElement("tr");
  [
    "N° Cellule",
    "Chariot / Train",
    "État",
    "Date",
    "Nom tech",
    "Pièces suspectées / constat",
    "Test station OK/NOK",
    "Contrôle ou changement effectués + date",
    "Commentaires / suggestions",
    "Actions déjà réalisées",
    "Constat OK/NOK"
  ].forEach((label) => {
    const th = document.createElement("th");
    th.textContent = label;
    labelsRow.appendChild(th);
  });

  thead.appendChild(groupRow);
  thead.appendChild(labelsRow);
  return thead;
}

function createCellulesTerrainTable(rows) {
  const table = document.createElement("table");
  table.className = "parts-table cellules-terrain-table";
  table.appendChild(createCellulesTerrainTableHead());

  const tbody = document.createElement("tbody");

  if (!rows.length) {
    tbody.appendChild(createEmptyTableRow(11, "Aucune cellule à imprimer avec les filtres sélectionnés."));
  } else {
    rows.forEach((row) => {
      const tr = document.createElement("tr");
      tr.className = "cellules-terrain-row intervention-row-clickable";
      tr.title = "Appuie pour ouvrir la cellule";
      tr.onclick = () => {
        setState("cellule", {
          celluleNumber: row.celluleNumber,
          chariotNumber: row.chariotNumber
        });
      };

      [
        row.celluleNumber,
        `Chariot ${row.chariotNumber} / ${row.train}`,
        row.etat,
        row.date,
        row.technicien,
        [row.pieces, row.constat].filter(Boolean).join("\n"),
        row.testStation,
        row.action,
        row.commentaires,
        row.historique,
        row.constatFinal
      ].forEach((value) => {
        const td = document.createElement("td");
        td.textContent = value || "";
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });
  }

  table.appendChild(tbody);
  return table;
}

function printCellulesTerrainTable() {
  const table = document.querySelector(".cellules-terrain-table");
  if (!table) {
    alert("Aucun tableau cellule à imprimer.");
    return;
  }

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Impossible d’ouvrir la fenêtre d’impression. Autorise les pop-ups pour cette page.");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <title>Suivi cellules terrain</title>
        <style>
          @page { size: A4 landscape; margin: 8mm; }
          * { box-sizing: border-box; }
          body { font-family: Arial, sans-serif; color: #111827; }
          h1 { text-align: center; font-size: 20px; margin: 0 0 4px; letter-spacing: .06em; }
          .date { text-align: right; font-size: 11px; margin: 0 0 8px; }
          table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 10px; }
          th, td { border: 1px solid #111827; padding: 5px; vertical-align: top; white-space: pre-line; }
          thead tr:first-child th { background: #e5e7eb; font-size: 12px; text-align: center; font-weight: 900; }
          thead tr:nth-child(2) th { background: #f3f4f6; font-size: 9px; text-align: center; }
          td:nth-child(1), td:nth-child(4), td:nth-child(7), td:nth-child(11) { text-align: center; font-weight: 700; }
          th:nth-child(1), td:nth-child(1) { width: 55px; }
          th:nth-child(2), td:nth-child(2) { width: 85px; }
          th:nth-child(3), td:nth-child(3) { width: 95px; }
          th:nth-child(4), td:nth-child(4) { width: 70px; }
          th:nth-child(5), td:nth-child(5) { width: 70px; }
          th:nth-child(7), td:nth-child(7) { width: 70px; }
          th:nth-child(11), td:nth-child(11) { width: 70px; }
        </style>
      </head>
      <body>
        <h1>SUIVI CELLULES TERRAIN</h1>
        <p class="date">Mis à jour le : ${new Date().toLocaleDateString("fr-FR")}</p>
        ${table.outerHTML}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function renderCellulesTerrainView(etatFilters = ["defaut", "inhibee", "control", "preventif"]) {
  appView.appendChild(createBackButton());

  const activeEtatFilters = Array.isArray(etatFilters) ? etatFilters : ["defaut", "inhibee", "control", "preventif"];
  const rows = collectCellulesTerrainRows(activeEtatFilters);

  const card = createDataCard("Tableau terrain cellules", `${rows.length} cellule(s) à suivre`);

  const actions = document.createElement("div");
  actions.className = "intervention-actions";

  const filtersWrap = createInterventionFiltersGroup(
    [
      { key: "defaut", label: "Défaut" },
      { key: "inhibee", label: "Inhibée" },
      { key: "control", label: "À contrôler J+1" },
      { key: "preventif", label: "Préventif" }
    ],
    activeEtatFilters,
    (filterKey) => {
      setState(
        "cellulesTerrain",
        { etatFilters: toggleInterventionFilter(activeEtatFilters, filterKey) },
        false
      );
    }
  );

  const printBtn = document.createElement("button");
  printBtn.type = "button";
  printBtn.className = "model-save-button";
  printBtn.textContent = "Imprimer tableau cellules";
  printBtn.onclick = printCellulesTerrainTable;

  actions.appendChild(filtersWrap);
  actions.appendChild(printBtn);
  card.appendChild(actions);

  const wrapper = document.createElement("div");
  wrapper.className = "table-wrapper cellules-terrain-table-wrap";
  wrapper.appendChild(createCellulesTerrainTable(rows));

  card.appendChild(wrapper);
  appView.appendChild(card);
}

function renderInterventionView(
  etatFilters = getInterventionDefaultFilters(),
  showManualForm = false,
  familleFilters = getInterventionDefaultFamilles()
) {
  appView.appendChild(createBackButton());

  const activeEtatFilters = sanitizeInterventionEtatFilters(etatFilters);
  const activeFamilleFilters = sanitizeInterventionFamilleFilters(familleFilters);

  const rows = collectInterventionRows(activeEtatFilters, activeFamilleFilters);
  sortInterventionRows(rows);

  const subtitle = `Anomalies détectées : ${rows.length}`;
  const card = createDataCard("Mode intervention", subtitle);

  const actions = document.createElement("div");
  actions.className = "intervention-actions";

  const etatFiltersWrap = createInterventionFiltersGroup(
    [
      { key: "critical", label: "Critique" },
      { key: "warning", label: "À prévoir" },
      { key: "control", label: "À contrôler J+1" },
      { key: "defaut", label: "Défaut" },
      { key: "inhibee", label: "Inhibée" },
      { key: "preventif", label: "Préventif" }
    ],
    activeEtatFilters,
    (filterKey) => {
      const nextFilters = toggleInterventionFilter(activeEtatFilters, filterKey);
      setState(
        "intervention",
        {
          etatFilters: nextFilters,
          familleFilters: activeFamilleFilters,
          showManualForm
        },
        false
      );
    }
  );

  const familleFiltersWrap = createInterventionFiltersGroup(
    [
      { key: "cellule", label: "Cellules" },
      { key: "chariot", label: "Chariots" },
      { key: "groupeMoteur", label: "Groupes moteur" },
      { key: "energybox", label: "EnergyBox" },
      { key: "injecteur", label: "Injecteurs" },
      { key: "sortie", label: "Sorties" },
      { key: "convoyeur", label: "Convoyeurs" },
      { key: "manuel", label: "Manuel" }
    ],
    activeFamilleFilters,
    (filterKey) => {
      const nextFamilleFilters = toggleInterventionFilter(
        activeFamilleFilters,
        filterKey
      );
      setState(
        "intervention",
        {
          etatFilters: activeEtatFilters,
          familleFilters: nextFamilleFilters,
          showManualForm
        },
        false
      );
    }
  );

  const addManualBtn = document.createElement("button");
  addManualBtn.type = "button";
  addManualBtn.className = "model-save-button";
  addManualBtn.textContent = showManualForm
    ? "Fermer le formulaire"
    : "Ajouter une ligne manuellement";
  addManualBtn.onclick = () => {
    setState(
      "intervention",
      {
        etatFilters: activeEtatFilters,
        familleFilters: activeFamilleFilters,
        showManualForm: !showManualForm
      },
      false
    );
  };

  const cellulesTerrainBtn = document.createElement("button");
  cellulesTerrainBtn.type = "button";
  cellulesTerrainBtn.className = "model-save-button";
  cellulesTerrainBtn.textContent = "Tableau terrain cellules";
  cellulesTerrainBtn.onclick = () => {
    setState("cellulesTerrain", {
      etatFilters: ["defaut", "inhibee", "control", "preventif"]
    });
  };

  const printBtn = document.createElement("button");
  printBtn.type = "button";
  printBtn.className = "model-save-button";
  printBtn.textContent = "Imprimer le récap";
  printBtn.onclick = printInterventionTable;

  actions.appendChild(etatFiltersWrap);
  actions.appendChild(familleFiltersWrap);
  actions.appendChild(addManualBtn);
  actions.appendChild(cellulesTerrainBtn);
  actions.appendChild(printBtn);
  card.appendChild(actions);

  if (showManualForm) {
    card.appendChild(
      createManualInterventionEditor(activeEtatFilters, activeFamilleFilters)
    );
  }

  const wrapper = document.createElement("div");
  wrapper.className = "table-wrapper intervention-table-wrap";

  const table = document.createElement("table");
  table.className = "parts-table intervention-table";
  table.appendChild(createInterventionTableHead());

  const tbody = document.createElement("tbody");

  if (rows.length === 0) {
    tbody.appendChild(createEmptyTableRow(12, "Aucune ligne à traiter."));
  } else {
    rows.forEach((item) => {
      const tr = document.createElement("tr");
      const flags = item._flags || {};
      const rowClass = getInterventionRowClass(flags);

      if (rowClass) {
        tr.classList.add(rowClass);
      }

      if (item._gotoType) {
        tr.classList.add("intervention-row-clickable");
        tr.title = "Appuie pour ouvrir l’élément concerné";
        tr.onclick = (e) => {
          if (e.target.closest("textarea, button, input, select")) {
            return;
          }
          navigateFromInterventionRow(item);
        };
      }

      const tdEmplacement = document.createElement("td");
      tdEmplacement.textContent = item.emplacement || "";

      const tdElement = document.createElement("td");
      tdElement.textContent = item.element || "";

      const tdDetail = document.createElement("td");
      tdDetail.textContent = item.detail || "";

      const tdDate = document.createElement("td");
      tdDate.textContent = item.dateCtrl || "";

      const tdComment = document.createElement("td");
      const commentInput = document.createElement("textarea");
      commentInput.className = "model-input";
      commentInput.rows = 2;
      commentInput.value = item.commentaire || "";
      commentInput.placeholder = "Note / précision";
      commentInput.oninput = (e) => {
        item.commentaire = e.target.value;

        if (item._famille === "manuel") {
          const manualIndex = item._pieceOrder;
          if (MANUAL_INTERVENTION_ROWS[manualIndex]) {
            MANUAL_INTERVENTION_ROWS[manualIndex].commentaire = e.target.value;
          }
        } else {
          if (
            !INTERVENTION_COMMENT_OVERRIDES ||
            typeof INTERVENTION_COMMENT_OVERRIDES !== "object"
          ) {
            INTERVENTION_COMMENT_OVERRIDES = {};
          }

          INTERVENTION_COMMENT_OVERRIDES[item._aggregateKey] = e.target.value;
        }

        saveAll();
      };
      tdComment.appendChild(commentInput);

      tr.appendChild(tdEmplacement);
      tr.appendChild(tdElement);
      tr.appendChild(tdDetail);
      tr.appendChild(tdDate);
      tr.appendChild(createEtatIndicatorCell(flags.critique, "etat-critical"));
      tr.appendChild(createEtatIndicatorCell(flags.aPrevoir, "etat-warning"));
      tr.appendChild(createEtatIndicatorCell(flags.aControler, "etat-control"));
      tr.appendChild(createEtatIndicatorCell(flags.celluleDefaut, "etat-defaut"));
      tr.appendChild(createEtatIndicatorCell(flags.celluleInhibee, "etat-inhibee"));
      tr.appendChild(createEtatIndicatorCell(flags.controlePreventif, "etat-preventif"));
      tr.appendChild(tdComment);
      tr.appendChild(createInterventionActionCell(item));

      tbody.appendChild(tr);
    });
  }

  table.appendChild(tbody);
  wrapper.appendChild(table);

  card.appendChild(wrapper);
  appView.appendChild(card);
}

if (typeof window !== "undefined") {
  window.collectInterventionRows = collectInterventionRows;
  window.renderInterventionView = renderInterventionView;
  if (typeof renderCellulesTerrainView === "function") {
    window.renderCellulesTerrainView = renderCellulesTerrainView;
  }
}
