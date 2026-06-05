const stateHistory = [];

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function shallowEqualStateData(aData, bData) {
  const aKeys = Object.keys(aData);
  const bKeys = Object.keys(bData);

  if (aKeys.length !== bKeys.length) {
    return false;
  }

  return aKeys.every((key) => aData[key] === bData[key]);
}

function isSameState(a, b) {
  if (!a || !b) {
    return false;
  }

  if (a.type !== b.type) {
    return false;
  }

  const aData = isPlainObject(a.data) ? a.data : {};
  const bData = isPlainObject(b.data) ? b.data : {};

  return shallowEqualStateData(aData, bData);
}

function normalizeState(type, data = {}) {
  const safeType =
    typeof type === "string" && type.trim() ? type.trim() : "home";

  const safeData = isPlainObject(data) ? data : {};

  return {
    type: safeType,
    data: safeData
  };
}

function setState(type, data = {}, addToHistory = true) {
  const newState = normalizeState(type, data);

  if (addToHistory) {
    const lastState = stateHistory[stateHistory.length - 1];
    if (!isSameState(lastState, newState)) {
      stateHistory.push(newState);
    }
  } else if (stateHistory.length === 0) {
    stateHistory.push(newState);
  } else {
    stateHistory[stateHistory.length - 1] = newState;
  }

  currentState = newState;
  renderCurrentState();
}

function goBack() {
  if (stateHistory.length <= 1) {
    setState("home", {}, false);
    return;
  }

  stateHistory.pop();
  currentState = stateHistory[stateHistory.length - 1] || normalizeState("home");
  renderCurrentState();
}

function clearView() {
  appView.replaceChildren();
}

function createBackButton() {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "back-button";
  button.textContent = "← Retour";
  button.onclick = goBack;
  return button;
}

function createDataCard(title, subtitle = "") {
  const card = document.createElement("div");
  card.className = "data-card";

  const headerRow = document.createElement("div");
  headerRow.className = "data-card-header";

  const h2 = document.createElement("h2");
  h2.textContent = title;
  headerRow.appendChild(h2);

  if (subtitle) {
    const badge = document.createElement("div");
    badge.className = "badge badge-inline";
    badge.textContent = subtitle;
    headerRow.appendChild(badge);
  }

  card.appendChild(headerRow);
  return card;
}

function createInfoCard(title, text) {
  const card = document.createElement("div");
  card.className = "info-card";

  const h2 = document.createElement("h2");
  h2.textContent = title;

  const p = document.createElement("p");
  p.textContent = text;

  card.appendChild(h2);
  card.appendChild(p);

  return card;
}

function createSectionTitle(text) {
  const el = document.createElement("div");
  el.className = "section-title";
  el.textContent = text;
  return el;
}

function createStatusLight(isActive = false) {
  const light = document.createElement("span");
  light.className = `status-light${isActive ? " is-active" : ""}`;
  light.setAttribute("aria-hidden", "true");
  return light;
}

function getCelluleKey(celluleNumber) {
  return `cellule_${celluleNumber}`;
}

function getChariotKey(chariotNumber) {
  return `chariot_${chariotNumber}`;
}

function getGroupeMoteurRange(groupNumber) {
  const start = (groupNumber - 1) * 2 + 1;
  const end = groupNumber * 2;
  return `${start}-${end}`;
}

function getGroupeMoteurKey(groupNumber) {
  return `groupe_moteur_${groupNumber}`;
}

function getEnergyBoxKey(boxNumber) {
  return `energybox_${boxNumber}`;
}

function getInjecteurKey(injecteurNumber) {
  return `injecteur_${injecteurNumber}`;
}

function getInjecteurConvoyeurKey(injecteurNumber, convoyeurKey) {
  return `injecteur_${injecteurNumber}_${convoyeurKey}`;
}

function getInjecteurMotorisationKey(injecteurNumber, convoyeurKey) {
  return `injecteur_${injecteurNumber}_${convoyeurKey}_motorisation`;
}

function getSortieKey(sortieNumber) {
  return `sortie_${sortieNumber}`;
}

function getConvoyeurKey(convoyeurNumber) {
  return `convoyeur_${convoyeurNumber}`;
}

function getConvoyeurLabel(convoyeurNumber) {
  if (typeof CONVOYEUR_LABELS !== "undefined" && CONVOYEUR_LABELS[convoyeurNumber]) {
    return CONVOYEUR_LABELS[convoyeurNumber];
  }
  return `Portion ${convoyeurNumber}`;
}

function getConvoyeurState(convoyeurNumber) {
  const key = getConvoyeurKey(convoyeurNumber);
  const stateItem = ensureElementCommentState(COMMENTS_CONVOYEURS, key);
  const rows = DATA_CONVOYEURS[key] || [];
  if (rows.some((r) => r?.critique === true)) return "critical";
  if (rows.some((r) => r?.aPrevoir === true)) return "warning";
  if (stateItem?.controlePreventif === true) return "preventif";
  return "ok";
}

function getCellulesForChariot(chariotNumber) {
  const cell1 = (chariotNumber - 1) * 2;
  return [cell1, cell1 + 1];
}

function getTrainLabelForChariot(chariotNumber) {
  if (chariotNumber === 1) return "Début du Train 1";
  if (chariotNumber >= 2 && chariotNumber <= 76) return "Train 1";
  if (chariotNumber === 77) return "Fin du Train 1";
  if (chariotNumber === 78) return "Début du Train 2";
  if (chariotNumber >= 79 && chariotNumber <= 154) return "Train 2";
  if (chariotNumber === 155) return "Fin du Train 2";
  return "";
}

function getTrainLabelForCellule(celluleNumber) {
  return celluleNumber <= 153 ? "Train 1" : "Train 2";
}

function getSortieLabel(sortieNumber) {
  if (
    typeof CONFIG_APP === "object" &&
    CONFIG_APP &&
    isPlainObject(CONFIG_APP.SORTIE_LABELS) &&
    CONFIG_APP.SORTIE_LABELS[sortieNumber]
  ) {
    return CONFIG_APP.SORTIE_LABELS[sortieNumber];
  }

  if (!Number.isFinite(Number(sortieNumber))) {
    return "";
  }

  return `TB ST ${sortieNumber}01`;
}

function getChariotParts(chariotNumber) {
  const extraParts = Array.isArray(SPECIAL_CHARIOTS[chariotNumber])
    ? SPECIAL_CHARIOTS[chariotNumber]
    : [];
  return [...MODELE_CHARIOT_STANDARD, ...extraParts];
}

function getInjecteurConvoyeurLabel(convoyeurKey) {
  const found = INJECTEUR_CONVOYEURS.find((item) => item.key === convoyeurKey);
  return found ? found.label : convoyeurKey;
}

function pushUniqueHistoryDate(historyArray, value) {
  if (!value) {
    return Array.isArray(historyArray) ? historyArray : [];
  }

  const next = Array.isArray(historyArray) ? [...historyArray] : [];
  next.unshift(value);

  return next
    .filter((date, index, arr) => date && arr.indexOf(date) === index)
    .slice(0, 3);
}

function updateDateValue(row, fieldName, historyFieldName, newDate) {
  if (!isPlainObject(row)) {
    return;
  }

  if (!newDate) {
    row[fieldName] = "";
    saveAll();
    return;
  }

  if (row[fieldName] && row[fieldName] !== newDate) {
    row[historyFieldName] = pushUniqueHistoryDate(
      row[historyFieldName],
      row[fieldName]
    );
  }

  row[fieldName] = newDate;
  saveAll();
}

function updateDateChgt(row, newDate) {
  updateDateValue(row, "dateChgt", "historiqueChgt", newDate);
}

function updateDateCtrl(row, newDate) {
  updateDateValue(row, "dateCtrl", "historiqueCtrl", newDate);
}

function removeHistoryDate(row, type, indexToRemove) {
  if (!isPlainObject(row)) {
    return;
  }

  if (!Number.isInteger(indexToRemove) || indexToRemove < 0) {
    return;
  }

  if (type === "chgt") {
    if (!Array.isArray(row.historiqueChgt)) {
      row.historiqueChgt = [];
    }
    row.historiqueChgt.splice(indexToRemove, 1);
  } else if (type === "ctrl") {
    if (!Array.isArray(row.historiqueCtrl)) {
      row.historiqueCtrl = [];
    }
    row.historiqueCtrl.splice(indexToRemove, 1);
  } else {
    return;
  }

  saveAll();
  showHistoryPopup(row, type);
}

function requireAdminAccess() {
  const password = prompt("Mot de passe admin :");
  return password === ADMIN_PASSWORD;
}

function askAdminPassword() {
  if (!requireAdminAccess()) {
    alert("Mot de passe incorrect");
    return;
  }

  adminUnlocked = true;
  setState("admin");
}