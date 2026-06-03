function makeCounters(
  critical = 0,
  warning = 0,
  control = 0,
  comments = 0,
  openProblems = 0,
  celluleDefaut = 0,
  celluleInhibee = 0,
  controlePreventif = 0
) {
  return {
    critical,
    warning,
    control,
    comments,
    openProblems,
    celluleDefaut,
    celluleInhibee,
    controlePreventif
  };
}

function createEmptyCounters() {
  return makeCounters(0, 0, 0, 0, 0, 0, 0);
}

function addCounters(a, b) {
  return makeCounters(
    (a?.critical || 0) + (b?.critical || 0),
    (a?.warning || 0) + (b?.warning || 0),
    (a?.control || 0) + (b?.control || 0),
    (a?.comments || 0) + (b?.comments || 0),
    (a?.openProblems || 0) + (b?.openProblems || 0),
    (a?.celluleDefaut || 0) + (b?.celluleDefaut || 0),
    (a?.celluleInhibee || 0) + (b?.celluleInhibee || 0),
    (a?.controlePreventif || 0) + (b?.controlePreventif || 0)
  );
}

function getInjecteurIdsForCounters() {
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

function getSafeArray(value) {
  return Array.isArray(value) ? value : [];
}

function isSystemFollowUpCommentRow(item) {
  return !!(
    item &&
    typeof item.suiviType === "string" &&
    item.suiviType.trim() !== ""
  );
}

function hasAnyCommentText(commentItem) {
  if (!commentItem || typeof commentItem !== "object") {
    return false;
  }

  return (
    (typeof commentItem.text === "string" && commentItem.text.trim() !== "") ||
    (typeof commentItem.elementConcerne === "string" &&
      commentItem.elementConcerne.trim() !== "") ||
    (typeof commentItem.date === "string" && commentItem.date.trim() !== "")
  );
}

function hasInjecteurPieceComment(row) {
  return !!(
    row &&
    typeof row.commentaire === "string" &&
    row.commentaire.trim() !== ""
  );
}

function getCommentRows(store, key) {
  ensureCommentRows(store, key);
  return getSafeArray(store?.[key]);
}

function countRowsFlags(rows, options = {}) {
  const { includeComments = false } = options;
  const safeRows = getSafeArray(rows);

  return makeCounters(
    safeRows.some((row) => row?.critique === true) ? 1 : 0,
    safeRows.some((row) => row?.aPrevoir === true) ? 1 : 0,
    0,
    0,
    0,
    0,
    0,
    safeRows.some((row) => row?.controlePreventif === true || row?.aControler === true) ? 1 : 0
  );
}

function countCommentEntries(store, key, options = {}) {
  const { includeCelluleStates = false } = options;
  const rows = getCommentRows(store, key);

  const headerRow = rows.length > 0 ? rows[0] : null;
  const visibleRows = rows.length > 1
    ? rows.slice(1).filter((item) => !isSystemFollowUpCommentRow(item))
    : [];

  const hasCritical =
    !!headerRow?.critique || visibleRows.some((item) => item?.critique === true);

  const hasWarning =
    !!headerRow?.aPrevoir || visibleRows.some((item) => item?.aPrevoir === true);

  const hasControl = includeCelluleStates
    ? !!headerRow?.aControler || visibleRows.some((item) => item?.aControler === true)
    : false;

  const hasPreventif =
    !!headerRow?.controlePreventif ||
    visibleRows.some((item) => item?.controlePreventif === true || item?.aControler === true);

  const hasComments = false;

  const hasCelluleDefaut = includeCelluleStates
    ? !!headerRow?.celluleDefaut ||
      visibleRows.some((item) => item?.celluleDefaut === true)
    : false;

  const hasCelluleInhibee = includeCelluleStates
    ? !!headerRow?.celluleInhibee ||
      visibleRows.some((item) => item?.celluleInhibee === true)
    : false;

  return makeCounters(
    hasCritical ? 1 : 0,
    hasWarning ? 1 : 0,
    hasControl ? 1 : 0,
    0,
    0,
    hasCelluleDefaut ? 1 : 0,
    hasCelluleInhibee ? 1 : 0,
    hasPreventif ? 1 : 0
  );
}

function countModelRowsAndComments(dataStore, commentStore, key, model, options = {}) {
  const {
    includeCelluleStates = false,
    includeRowComments = false
  } = options;

  ensureLocalRows(dataStore, key, model);

  const rowCounters = countRowsFlags(dataStore[key], {
    includeComments: includeRowComments
  });

  const commentCounters = countCommentEntries(commentStore, key, {
    includeCelluleStates
  });

  return makeCounters(
    rowCounters.critical || commentCounters.critical ? 1 : 0,
    rowCounters.warning || commentCounters.warning ? 1 : 0,
    rowCounters.control || commentCounters.control ? 1 : 0,
    0,
    0,
    includeCelluleStates && commentCounters.celluleDefaut ? 1 : 0,
    includeCelluleStates && commentCounters.celluleInhibee ? 1 : 0,
    rowCounters.controlePreventif || commentCounters.controlePreventif ? 1 : 0
  );
}

function countCelluleCounters(celluleNumber) {
  const key = getCelluleKey(celluleNumber);
  const rows = getCommentRows(COMMENTS_CELLULES, key);
  const headerRow = rows.length > 0 ? rows[0] : null;

  return makeCounters(
    headerRow?.critique === true ? 1 : 0,
    headerRow?.aPrevoir === true ? 1 : 0,
    headerRow?.aControler === true ? 1 : 0,
    0,
    0,
    headerRow?.celluleDefaut === true ? 1 : 0,
    headerRow?.celluleInhibee === true ? 1 : 0,
    headerRow?.controlePreventif === true ? 1 : 0
  );
}

function countChariotDirectCounters(chariotNumber) {
  const key = getChariotKey(chariotNumber);
  const parts = getChariotParts(chariotNumber);

  return countModelRowsAndComments(
    DATA_CHARIOTS,
    COMMENTS_CHARIOTS,
    key,
    parts,
    {
      includeCelluleStates: false,
      includeRowComments: false
    }
  );
}

function countChariotTotalCounters(chariotNumber) {
  const [cell1, cell2] = getCellulesForChariot(chariotNumber);

  let total = createEmptyCounters();
  total = addCounters(total, countCelluleCounters(cell1));
  total = addCounters(total, countCelluleCounters(cell2));
  total = addCounters(total, countChariotDirectCounters(chariotNumber));

  return total;
}

function countGroupeMoteurCounters(groupNumber) {
  const key = getGroupeMoteurKey(groupNumber);

  return countModelRowsAndComments(
    DATA_GROUPE_MOTEUR,
    COMMENTS_GROUPE_MOTEUR,
    key,
    MODELE_GROUPE_MOTEUR
  );
}

function countSortieCounters(sortieNumber) {
  const key = getSortieKey(sortieNumber);

  return countModelRowsAndComments(
    DATA_SORTIES,
    COMMENTS_SORTIES,
    key,
    MODELE_SORTIE
  );
}

function sumCountersOverRange(start, end, counterFn) {
  let total = createEmptyCounters();

  for (let i = start; i <= end; i++) {
    total = addCounters(total, counterFn(i));
  }

  return total;
}

function countAllSortiesCounters() {
  return sumCountersOverRange(
    CONFIG_APP.SORTIE_MIN,
    CONFIG_APP.SORTIE_MAX,
    countSortieCounters
  );
}

function countAllGroupesMoteurCounters() {
  return sumCountersOverRange(
    CONFIG_APP.GROUPE_MOTEUR_MIN,
    CONFIG_APP.GROUPE_MOTEUR_MAX,
    countGroupeMoteurCounters
  );
}

function countEnergyBoxSingleCounters(boxNumber) {
  ensureEnergyBoxData(boxNumber);
  const key = getEnergyBoxKey(boxNumber);
  const data = DATA_ENERGYBOX[key];

  const hasCritical =
    data?.energyBox?.aChanger === true ||
    data?.pickup1?.aChanger === true ||
    data?.pickup2?.aChanger === true;

  return makeCounters(hasCritical ? 1 : 0, 0, 0, 0, 0, 0, 0);
}

function countEnergyTrain1Counters() {
  return sumCountersOverRange(
    CONFIG_APP.ENERGYBOX_TRAIN_1_START,
    CONFIG_APP.ENERGYBOX_TRAIN_1_END,
    countEnergyBoxSingleCounters
  );
}

function countEnergyTrain2Counters() {
  return sumCountersOverRange(
    CONFIG_APP.ENERGYBOX_TRAIN_2_START,
    CONFIG_APP.ENERGYBOX_TRAIN_2_END,
    countEnergyBoxSingleCounters
  );
}

function countTrain1ChariotsCounters() {
  return sumCountersOverRange(
    CONFIG_APP.TRAIN_1_START,
    CONFIG_APP.TRAIN_1_END,
    countChariotTotalCounters
  );
}

function countTrain2ChariotsCounters() {
  return sumCountersOverRange(
    CONFIG_APP.TRAIN_2_START,
    CONFIG_APP.TRAIN_2_END,
    countChariotTotalCounters
  );
}

function countTrain1Counters() {
  let total = createEmptyCounters();
  total = addCounters(total, countEnergyTrain1Counters());
  total = addCounters(total, countTrain1ChariotsCounters());
  return total;
}

function countTrain2Counters() {
  let total = createEmptyCounters();
  total = addCounters(total, countEnergyTrain2Counters());
  total = addCounters(total, countTrain2ChariotsCounters());
  return total;
}

function countTrieurCounters() {
  let total = createEmptyCounters();
  total = addCounters(total, countTrain1Counters());
  total = addCounters(total, countTrain2Counters());
  total = addCounters(total, countAllGroupesMoteurCounters());
  return total;
}

function countInjecteurJournalCounters(injecteurNumber) {
  const key = getInjecteurKey(injecteurNumber);
  return countCommentEntries(COMMENTS_INJECTEURS, key);
}

function countInjecteurPieceCounters(injecteurNumber, convoyeurKey, type) {
  ensureInjecteurPieceRows(
    DATA_INJECTEUR_CONVOYEURS,
    injecteurNumber,
    convoyeurKey,
    type
  );

  const rows =
    DATA_INJECTEUR_CONVOYEURS[injecteurNumber]?.[convoyeurKey]?.[type] || [];

  return countRowsFlags(rows, { includeComments: true });
}

function countInjecteurConvoyeurHeaderCounters(injecteurNumber, convoyeurKey) {
  const key = getInjecteurConvoyeurKey(injecteurNumber, convoyeurKey);
  return countCommentEntries(COMMENTS_INJECTEURS, key);
}

function countInjecteurConvoyeurCounters(injecteurNumber, convoyeurKey) {
  let total = createEmptyCounters();

  total = addCounters(
    total,
    countInjecteurConvoyeurHeaderCounters(injecteurNumber, convoyeurKey)
  );

  total = addCounters(
    total,
    countInjecteurPieceCounters(injecteurNumber, convoyeurKey, "convoyeur")
  );

  total = addCounters(
    total,
    countInjecteurPieceCounters(injecteurNumber, convoyeurKey, "motorisation")
  );

  return total;
}

function countInjecteurTotalCounters(injecteurNumber) {
  let total = createEmptyCounters();

  total = addCounters(total, countInjecteurJournalCounters(injecteurNumber));

  INJECTEUR_CONVOYEURS.forEach((conv) => {
    total = addCounters(
      total,
      countInjecteurConvoyeurCounters(injecteurNumber, conv.key)
    );
  });

  return total;
}

function countAllInjecteursCounters() {
  let total = createEmptyCounters();

  getInjecteurIdsForCounters().forEach((injecteurNumber) => {
    total = addCounters(total, countInjecteurTotalCounters(injecteurNumber));
  });

  return total;
}

function countGlobalProblems() {
  if (!Array.isArray(GLOBAL_PROBLEMS)) {
    return 0;
  }

  let openProblems = 0;

  GLOBAL_PROBLEMS.forEach((probleme) => {
    if ((probleme?.statut || "ouverte") === "ouverte") {
      openProblems += 1;
    }
  });

  return openProblems;
}

function countTccCounters() {
  let total = createEmptyCounters();
  total = addCounters(total, countTrieurCounters());
  total = addCounters(total, countAllInjecteursCounters());
  total = addCounters(total, countAllSortiesCounters());
  return total;
}

function countTccRawCounters() {
  const total = countTccCounters();
  total.openProblems = countGlobalProblems();
  return total;
}

// Compte les plans préventifs échus (toutes familles confondues)
function countPlansEchus() {
  if (
    typeof DATA_PLANS_PREVENTIFS === "undefined" ||
    typeof isPlanEchu !== "function"
  ) return 0;
  return DATA_PLANS_PREVENTIFS.filter((p) => isPlanEchu(p)).length;
}

function countTransitiqueRawCounters() {
  return createEmptyCounters();
}

function countTransitiqueCounters() {
  return countTransitiqueRawCounters();
}

function getStateFromCounters(counters, options = {}) {
  const { includeCelluleStates = false } = options;

  if ((counters?.critical || 0) > 0) {
    return "red";
  }

  if ((counters?.warning || 0) > 0) {
    return "orange";
  }

  if (
    (counters?.control || 0) > 0 ||
    (includeCelluleStates &&
      ((counters?.celluleDefaut || 0) > 0 ||
        (counters?.celluleInhibee || 0) > 0 ||
        (counters?.controlePreventif || 0) > 0))
  ) {
    return "control";
  }

  return "off";
}

function getButtonStateClassFromCounters(counters) {
  if ((counters?.critical || 0) > 0) {
    return "state-red";
  }

  if ((counters?.warning || 0) > 0) {
    return "state-orange";
  }

  if ((counters?.celluleDefaut || 0) > 0) {
    return "state-red";
  }

  if ((counters?.celluleInhibee || 0) > 0) {
    return "state-inhibee";
  }

  if ((counters?.control || 0) > 0) {
    return "state-control";
  }

  if ((counters?.controlePreventif || 0) > 0) {
    return "state-preventif";
  }

  return "";
}

function getCelluleState(celluleNumber) {
  return getStateFromCounters(countCelluleCounters(celluleNumber), {
    includeCelluleStates: true
  });
}

function getChariotDirectState(chariotNumber) {
  return getStateFromCounters(countChariotDirectCounters(chariotNumber));
}

function getGroupeMoteurState(groupNumber) {
  return getStateFromCounters(countGroupeMoteurCounters(groupNumber));
}

function getSortieState(sortieNumber) {
  return getStateFromCounters(countSortieCounters(sortieNumber));
}

function getInjecteurCommentsState(injecteurNumber) {
  return getStateFromCounters(countInjecteurJournalCounters(injecteurNumber));
}

function getInjecteurPieceState(injecteurNumber, convoyeurKey, type) {
  return getStateFromCounters(
    countInjecteurPieceCounters(injecteurNumber, convoyeurKey, type)
  );
}

function getInjecteurConvoyeurState(injecteurNumber, convoyeurKey) {
  return getStateFromCounters(
    countInjecteurConvoyeurCounters(injecteurNumber, convoyeurKey)
  );
}

function getEnergyBoxState(boxNumber) {
  const counters = countEnergyBoxSingleCounters(boxNumber);
  return counters.critical > 0 ? "red" : "off";
}

function getCelluleButtonClasses(celluleNumber) {
  return getButtonStateClassFromCounters(countCelluleCounters(celluleNumber));
}

function getChariotButtonClasses(chariotNumber) {
  const classes = ["chariot-compact"];

  if (
    chariotNumber >= CONFIG_APP.TRAIN_1_START &&
    chariotNumber <= CONFIG_APP.TRAIN_1_END
  ) {
    classes.push("chariot-train-1");
  } else if (
    chariotNumber >= CONFIG_APP.TRAIN_2_START &&
    chariotNumber <= CONFIG_APP.TRAIN_2_END
  ) {
    classes.push("chariot-train-2");
  }

  const stateClass = getButtonStateClassFromCounters(
    countChariotTotalCounters(chariotNumber)
  );

  if (stateClass) {
    classes.push(stateClass);
  }

  return classes.join(" ");
}

function getChariotPiecesButtonClasses(chariotNumber) {
  return getButtonStateClassFromCounters(
    countChariotDirectCountersWithPlans(chariotNumber)
  );
}

function getGroupeMoteurButtonClasses(groupNumber) {
  return getButtonStateClassFromCounters(countGroupeMoteurCountersWithPlans(groupNumber));
}

function getSortieButtonClasses(sortieNumber) {
  return getButtonStateClassFromCounters(countSortieCountersWithPlans(sortieNumber));
}

function getInjecteurButtonClasses(injecteurNumber) {
  return getButtonStateClassFromCounters(countInjecteurTotalCountersWithPlans(injecteurNumber));
}

function getInjecteurConvoyeurButtonClasses(injecteurNumber, convoyeurKey) {
  return getButtonStateClassFromCounters(
    countInjecteurConvoyeurCounters(injecteurNumber, convoyeurKey)
  );
}

function getEnergyBoxButtonClasses(boxNumber) {
  return getButtonStateClassFromCounters(countEnergyBoxSingleCounters(boxNumber));
}

function countCelluleStatesGlobal() {
  let defaut = 0;
  let inhibee = 0;
  let aControler = 0;
  let controlePreventif = 0;

  for (
    let celluleNumber = CONFIG_APP.CELLULE_MIN;
    celluleNumber <= CONFIG_APP.CELLULE_MAX;
    celluleNumber++
  ) {
    const key = getCelluleKey(celluleNumber);
    const rows = getCommentRows(COMMENTS_CELLULES, key);

    const headerRow = rows.length > 0 ? rows[0] : null;

    if (headerRow?.celluleDefaut === true) {
      defaut += 1;
    }

    if (headerRow?.celluleInhibee === true) {
      inhibee += 1;
    }

    if (headerRow?.aControler === true) {
      aControler += 1;
    }

    if (headerRow?.controlePreventif === true) {
      controlePreventif += 1;
    }
  }

  return { defaut, inhibee, aControler, controlePreventif };
}
// Compte les plans échus pour un type d'équipement donné
function countPlansEchusByType(type) {
  if (
    typeof DATA_PLANS_PREVENTIFS === "undefined" ||
    typeof isPlanEchu !== "function"
  ) return 0;
  return DATA_PLANS_PREVENTIFS.filter((p) => {
    if (!isPlanEchu(p)) return false;
    return p.equipements && p.equipements.some((eq) => eq.type === type);
  }).length;
}

// Ajoute le controlePreventif des plans échus pour un équipement donné
function addPlanEchuToCounters(counters, type, id, convoyeurKey, tableauType) {
  if (
    typeof DATA_PLANS_PREVENTIFS === "undefined" ||
    typeof isPlanEchu !== "function" ||
    typeof getPlansForEquipement !== "function"
  ) return counters;

  const plans = getPlansForEquipement(type, id, convoyeurKey, tableauType);
  const nbEchus = plans.filter((p) => isPlanEchu(p)).length;
  if (nbEchus === 0) return counters;

  return addCounters(counters, normalizeCountersObject({ controlePreventif: nbEchus }));
}

// Versions enrichies des compteurs par équipement (incluent les plans échus)
function countChariotDirectCountersWithPlans(chariotNumber) {
  return addPlanEchuToCounters(
    countChariotDirectCounters(chariotNumber),
    "chariot", chariotNumber
  );
}

function countGroupeMoteurCountersWithPlans(groupNumber) {
  return addPlanEchuToCounters(
    countGroupeMoteurCounters(groupNumber),
    "groupeMoteur", groupNumber
  );
}

function countSortieCountersWithPlans(sortieNumber) {
  return addPlanEchuToCounters(
    countSortieCounters(sortieNumber),
    "sortie", sortieNumber
  );
}

function countInjecteurTotalCountersWithPlans(injecteurNumber) {
  let base = countInjecteurTotalCounters(injecteurNumber);
  // Agrège les plans échus de tous les convoyeurs de cet injecteur
  if (
    typeof DATA_PLANS_PREVENTIFS !== "undefined" &&
    typeof isPlanEchu === "function" &&
    typeof getPlansForEquipement === "function"
  ) {
    const plans = DATA_PLANS_PREVENTIFS.filter((p) => {
      if (!isPlanEchu(p)) return false;
      return p.equipements && p.equipements.some((eq) =>
        eq.type === "injecteur" && (
          typeof eq.injecteurId === "string"
            ? parseInt(eq.injecteurId, 10)
            : eq.injecteurId
        ) === injecteurNumber
      );
    });
    if (plans.length > 0) {
      base = addCounters(base, normalizeCountersObject({ controlePreventif: plans.length }));
    }
  }
  return base;
}

// Version WithPlans de countChariotTotalCounters (inclut cellules + plans échus)
function countChariotTotalCountersWithPlans(chariotNumber) {
  return addPlanEchuToCounters(
    countChariotTotalCounters(chariotNumber),
    "chariot", chariotNumber
  );
}
