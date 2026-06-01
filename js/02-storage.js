const APP_STORAGE_VERSION = 1;
const STORAGE_BACKUP_SUFFIX = "_backup";

const EXPORT_DIRTY_SUFFIX = "_export_dirty";
const EXPORT_LAST_AT_SUFFIX = "_export_last_at";
const EXPORT_LAST_NAME_SUFFIX = "_export_last_name";

const IMPORT_SESSION_DONE_SUFFIX = "_import_session_done";
const IMPORT_LAST_AT_SUFFIX = "_import_last_at";
const IMPORT_LAST_NAME_SUFFIX = "_import_last_name";
let startupImportReminderShown = false;

function getExportDirtyStorageKey() {
  return `${CONFIG_APP.STORAGE_KEY}${EXPORT_DIRTY_SUFFIX}`;
}

function getExportLastAtStorageKey() {
  return `${CONFIG_APP.STORAGE_KEY}${EXPORT_LAST_AT_SUFFIX}`;
}

function getExportLastNameStorageKey() {
  return `${CONFIG_APP.STORAGE_KEY}${EXPORT_LAST_NAME_SUFFIX}`;
}

function getImportSessionDoneStorageKey() {
  return `${CONFIG_APP.STORAGE_KEY}${IMPORT_SESSION_DONE_SUFFIX}`;
}

function getImportLastAtStorageKey() {
  return `${CONFIG_APP.STORAGE_KEY}${IMPORT_LAST_AT_SUFFIX}`;
}

function getImportLastNameStorageKey() {
  return `${CONFIG_APP.STORAGE_KEY}${IMPORT_LAST_NAME_SUFFIX}`;
}

function notifyExportStatusChanged() {
  try {
    window.dispatchEvent(new CustomEvent("export-status-changed"));
  } catch (error) {
    console.warn("Notification export-status-changed impossible", error);
  }
}

function notifyImportStatusChanged() {
  try {
    window.dispatchEvent(new CustomEvent("import-status-changed"));
  } catch (error) {
    console.warn("Notification import-status-changed impossible", error);
  }
}

function isImportRequiredThisSession() {
  try {
    const lastImportAt = localStorage.getItem(getImportLastAtStorageKey());
    return !lastImportAt;
  } catch (error) {
    console.warn("Lecture statut import impossible", error);
    return true;
  }
}

function markImportDone(fileName = "") {
  try {
    sessionStorage.setItem(getImportSessionDoneStorageKey(), "1");
  } catch (error) {
    console.warn("Statut import session non enregistré", error);
  }

  try {
    localStorage.setItem(getImportLastAtStorageKey(), new Date().toISOString());

    if (fileName) {
      localStorage.setItem(getImportLastNameStorageKey(), fileName);
    }
  } catch (error) {
    console.warn("Statut import non enregistré", error);
  }

  notifyImportStatusChanged();
}

function getLastImportAt() {
  try {
    return localStorage.getItem(getImportLastAtStorageKey()) || "";
  } catch (error) {
    return "";
  }
}

function getLastImportFileName() {
  try {
    return localStorage.getItem(getImportLastNameStorageKey()) || "";
  } catch (error) {
    return "";
  }
}

function hasPendingExportChanges() {
  try {
    const value = localStorage.getItem(getExportDirtyStorageKey());

    if (value === "1") {
      return true;
    }

    if (value === "0") {
      return false;
    }

    return !!localStorage.getItem(CONFIG_APP.STORAGE_KEY);
  } catch (error) {
    console.warn("Lecture statut export impossible", error);
    return false;
  }
}

function markExportDirty() {
  try {
    localStorage.setItem(getExportDirtyStorageKey(), "1");
  } catch (error) {
    console.warn("Statut export non enregistré", error);
  }

  notifyExportStatusChanged();
}

function markExportClean(fileName = "") {
  try {
    localStorage.setItem(getExportDirtyStorageKey(), "0");
    localStorage.setItem(getExportLastAtStorageKey(), new Date().toISOString());

    if (fileName) {
      localStorage.setItem(getExportLastNameStorageKey(), fileName);
    }
  } catch (error) {
    console.warn("Statut export non enregistré", error);
  }

  notifyExportStatusChanged();
}

function getLastExportAt() {
  try {
    return localStorage.getItem(getExportLastAtStorageKey()) || "";
  } catch (error) {
    return "";
  }
}

function getLastExportFileName() {
  try {
    return localStorage.getItem(getExportLastNameStorageKey()) || "";
  } catch (error) {
    return "";
  }
}

function formatDateTimeForDisplay(isoValue) {
  if (!isoValue) {
    return "";
  }

  const date = new Date(isoValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getExportStatusSubtext() {
  if (hasPendingExportChanges()) {
    return "À exporter : modifications non sauvegardées en fichier";
  }

  const lastExport = formatDateTimeForDisplay(getLastExportAt());

  if (lastExport) {
    return `Export à jour • ${lastExport}`;
  }

  return "Export à jour";
}

function getImportStatusSubtext() {
  if (isImportRequiredThisSession()) {
    return "À l’ouverture : importer le dernier JSON partagé";
  }

  const lastImport = formatDateTimeForDisplay(getLastImportAt());
  const lastFile = getLastImportFileName();

  if (lastImport && lastFile) {
    return `Import effectué • ${lastImport} • ${lastFile}`;
  }

  if (lastImport) {
    return `Import effectué • ${lastImport}`;
  }

  return "Import effectué pour cette session";
}

function createBackupTimestamp() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");

  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate())
  ].join("-") + "_" + [
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds())
  ].join("-");
}

function createBackupFileName() {
  return `suivi-tcc-transitique_${createBackupTimestamp()}.json`;
}

function closeImportExportOverlay() {
  const existing = document.getElementById("importExportOverlay");
  if (existing) {
    existing.remove();
  }
}

function refreshApplicationAfterImport() {
  try {
    if (Array.isArray(stateHistory)) {
      stateHistory.length = 0;
    }

    if (typeof setState === "function") {
      setState("home", {}, false);
    } else if (typeof renderCurrentState === "function") {
      currentState = { type: "home", data: {} };
      renderCurrentState();
    }

    if (typeof refreshHomeImportButtonStatus === "function") {
      refreshHomeImportButtonStatus();
    }

    if (typeof refreshHomeExportButtonStatus === "function") {
      refreshHomeExportButtonStatus();
    }
  } catch (error) {
    console.warn("Rafraîchissement écran après import impossible", error);

    try {
      window.location.href = window.location.href.split("#")[0];
    } catch (navigationError) {
      console.warn("Rechargement de secours impossible", navigationError);
    }
  }
}

function createImportExportOverlay(titleText) {
  closeImportExportOverlay();

  const overlay = document.createElement("div");
  overlay.id = "importExportOverlay";
  overlay.className = "history-overlay import-export-overlay";

  const box = document.createElement("div");
  box.className = "history-box import-export-box";

  const title = document.createElement("h3");
  title.textContent = titleText;
  box.appendChild(title);

  overlay.appendChild(box);

  overlay.onclick = (e) => {
    if (e.target === overlay) {
      closeImportExportOverlay();
    }
  };

  document.body.appendChild(overlay);
  return box;
}

function createInstructionList(items) {
  const list = document.createElement("ol");
  list.className = "import-export-steps";

  items.forEach((text) => {
    const item = document.createElement("li");
    item.textContent = text;
    list.appendChild(item);
  });

  return list;
}

function createPopupButton(className, text, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = text;
  button.onclick = onClick;
  return button;
}

function downloadCurrentBackupJson() {
  const raw = JSON.stringify(buildPayload(), null, 2);
  const fileName = createBackupFileName();
  const blob = new Blob([raw], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1200);

  markExportClean(fileName);
  return fileName;
}

async function copyCurrentBackupJsonToClipboard(textarea, raw) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(raw);
      return true;
    }
  } catch (error) {
    console.warn("Copie navigateur impossible", error);
  }

  try {
    textarea.focus();
    textarea.select();
    return document.execCommand("copy");
  } catch (error) {
    console.warn("Copie fallback impossible", error);
    return false;
  }
}


function clearObject(target) {
  if (!target || typeof target !== "object") {
    return;
  }

  Object.keys(target).forEach((key) => {
    delete target[key];
  });
}

function getInjecteurIds() {
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

function getBackupStorageKey() {
  return `${CONFIG_APP.STORAGE_KEY}${STORAGE_BACKUP_SUFFIX}`;
}

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isValidPayloadObject(data) {
  return isPlainObject(data);
}

function createEmptyInjecteurSection() {
  return {
    convoyeur: [],
    motorisation: []
  };
}

function ensureInjecteurModelsStructure() {
  const injecteurIds = getInjecteurIds();

  injecteurIds.forEach((inj) => {
    if (!isPlainObject(MODELE_INJECTEUR_CONVOYEURS[inj])) {
      MODELE_INJECTEUR_CONVOYEURS[inj] = {};
    }

    INJECTEUR_CONVOYEURS.forEach((conv) => {
      if (!isPlainObject(MODELE_INJECTEUR_CONVOYEURS[inj][conv.key])) {
        MODELE_INJECTEUR_CONVOYEURS[inj][conv.key] = createEmptyInjecteurSection();
        return;
      }

      if (!Array.isArray(MODELE_INJECTEUR_CONVOYEURS[inj][conv.key].convoyeur)) {
        MODELE_INJECTEUR_CONVOYEURS[inj][conv.key].convoyeur = [];
      }

      if (!Array.isArray(MODELE_INJECTEUR_CONVOYEURS[inj][conv.key].motorisation)) {
        MODELE_INJECTEUR_CONVOYEURS[inj][conv.key].motorisation = [];
      }
    });
  });
}

function ensureInjecteurDataStructure() {
  const injecteurIds = getInjecteurIds();

  injecteurIds.forEach((inj) => {
    if (!isPlainObject(DATA_INJECTEUR_CONVOYEURS[inj])) {
      DATA_INJECTEUR_CONVOYEURS[inj] = {};
    }

    INJECTEUR_CONVOYEURS.forEach((conv) => {
      if (!isPlainObject(DATA_INJECTEUR_CONVOYEURS[inj][conv.key])) {
        DATA_INJECTEUR_CONVOYEURS[inj][conv.key] = createEmptyInjecteurSection();
        return;
      }

      if (!Array.isArray(DATA_INJECTEUR_CONVOYEURS[inj][conv.key].convoyeur)) {
        DATA_INJECTEUR_CONVOYEURS[inj][conv.key].convoyeur = [];
      }

      if (!Array.isArray(DATA_INJECTEUR_CONVOYEURS[inj][conv.key].motorisation)) {
        DATA_INJECTEUR_CONVOYEURS[inj][conv.key].motorisation = [];
      }
    });
  });
}

function sanitizeInjecteurSection(source) {
  if (!isPlainObject(source)) {
    return createEmptyInjecteurSection();
  }

  return {
    convoyeur: Array.isArray(source.convoyeur) ? source.convoyeur : [],
    motorisation: Array.isArray(source.motorisation) ? source.motorisation : []
  };
}

function createEmptyPayload() {
  return {
    appVersion: APP_STORAGE_VERSION,

    modeleCellule: [],
    modeleChariotStandard: [],
    modeleGroupeMoteur: [],
    modeleSortie: [],
    specialChariots: {},

    modeleInjecteurConvoyeurs: {},

    dataCellules: {},
    dataChariots: {},
    dataEnergyBox: {},
    dataGroupeMoteur: {},
    dataSorties: {},
    dataInjecteurConvoyeurs: {},

    commentsCellules: {},
    commentsChariots: {},
    commentsGroupeMoteur: {},
    commentsInjecteurs: {},
    commentsSorties: {},

    globalProblems: [],
    globalProblemsArchive: [],

    manualInterventionRows: [],
    interventionCommentOverrides: {}
  };
}

function buildPayload() {
  const normalizedEnergyBoxData = {};

  Object.keys(DATA_ENERGYBOX).forEach((key) => {
    normalizedEnergyBoxData[key] = normalizeEnergyBoxRecord(DATA_ENERGYBOX[key]);
  });

  ensureGlobalProblems();
  ensureGlobalProblemsArchive();

  return {
    appVersion: APP_STORAGE_VERSION,

    modeleCellule: MODELE_CELLULE,
    modeleChariotStandard: MODELE_CHARIOT_STANDARD,
    modeleGroupeMoteur: MODELE_GROUPE_MOTEUR,
    modeleSortie: MODELE_SORTIE,
    specialChariots: SPECIAL_CHARIOTS,

    modeleInjecteurConvoyeurs: MODELE_INJECTEUR_CONVOYEURS,

    dataCellules: DATA_CELLULES,
    dataChariots: DATA_CHARIOTS,
    dataEnergyBox: normalizedEnergyBoxData,
    dataGroupeMoteur: DATA_GROUPE_MOTEUR,
    dataSorties: DATA_SORTIES,
    dataInjecteurConvoyeurs: DATA_INJECTEUR_CONVOYEURS,

    commentsCellules: COMMENTS_CELLULES,
    commentsChariots: COMMENTS_CHARIOTS,
    commentsGroupeMoteur: COMMENTS_GROUPE_MOTEUR,
    commentsInjecteurs: COMMENTS_INJECTEURS,
    commentsSorties: COMMENTS_SORTIES,

    globalProblems: GLOBAL_PROBLEMS,
    globalProblemsArchive: GLOBAL_PROBLEMS_ARCHIVE,

    manualInterventionRows: MANUAL_INTERVENTION_ROWS,
    interventionCommentOverrides: INTERVENTION_COMMENT_OVERRIDES
  };
}

function applyInjecteurModels(sourceRoot) {
  const injecteurIds = getInjecteurIds();

  ensureInjecteurModelsStructure();

  if (!isPlainObject(sourceRoot)) {
    return;
  }

  injecteurIds.forEach((inj) => {
    INJECTEUR_CONVOYEURS.forEach((conv) => {
      MODELE_INJECTEUR_CONVOYEURS[inj][conv.key] = sanitizeInjecteurSection(
        sourceRoot?.[inj]?.[conv.key]
      );
    });
  });
}

function applyInjecteurData(sourceRoot) {
  const injecteurIds = getInjecteurIds();

  ensureInjecteurDataStructure();

  if (!isPlainObject(sourceRoot)) {
    return;
  }

  injecteurIds.forEach((inj) => {
    INJECTEUR_CONVOYEURS.forEach((conv) => {
      DATA_INJECTEUR_CONVOYEURS[inj][conv.key] = sanitizeInjecteurSection(
        sourceRoot?.[inj]?.[conv.key]
      );
    });
  });
}

function saveLocalBackup(payload) {
  const serialized = JSON.stringify(payload);

  localStorage.setItem(CONFIG_APP.STORAGE_KEY, serialized);
  localStorage.setItem(getBackupStorageKey(), serialized);
}

function applyLoadedArray(targetArray, sourceArray) {
  targetArray.length = 0;

  if (!Array.isArray(sourceArray)) {
    return;
  }

  sourceArray.forEach((item) => {
    targetArray.push(item);
  });
}

function applyLoadedData(data) {
  if (!isValidPayloadObject(data)) {
    throw new Error("Données invalides");
  }

  MODELE_CELLULE = Array.isArray(data.modeleCellule) ? data.modeleCellule : [];
  MODELE_CHARIOT_STANDARD = Array.isArray(data.modeleChariotStandard)
    ? data.modeleChariotStandard
    : [];
  MODELE_GROUPE_MOTEUR = Array.isArray(data.modeleGroupeMoteur)
    ? data.modeleGroupeMoteur
    : [];
  MODELE_SORTIE = Array.isArray(data.modeleSortie) ? data.modeleSortie : [];

  clearObject(SPECIAL_CHARIOTS);
  if (isPlainObject(data.specialChariots)) {
    Object.assign(SPECIAL_CHARIOTS, data.specialChariots);
  }

  applyInjecteurModels(data.modeleInjecteurConvoyeurs);

  clearObject(DATA_CELLULES);
  clearObject(DATA_CHARIOTS);
  clearObject(DATA_ENERGYBOX);
  clearObject(DATA_GROUPE_MOTEUR);
  clearObject(DATA_SORTIES);

  if (isPlainObject(data.dataCellules)) {
    Object.assign(DATA_CELLULES, data.dataCellules);
  }

  if (isPlainObject(data.dataChariots)) {
    Object.assign(DATA_CHARIOTS, data.dataChariots);
  }

  if (isPlainObject(data.dataGroupeMoteur)) {
    Object.assign(DATA_GROUPE_MOTEUR, data.dataGroupeMoteur);
  }

  if (isPlainObject(data.dataSorties)) {
    Object.assign(DATA_SORTIES, data.dataSorties);
  }

  if (isPlainObject(data.dataEnergyBox)) {
    Object.keys(data.dataEnergyBox).forEach((key) => {
      DATA_ENERGYBOX[key] = normalizeEnergyBoxRecord(data.dataEnergyBox[key]);
    });
  }

  applyInjecteurData(data.dataInjecteurConvoyeurs);

  clearObject(COMMENTS_CELLULES);
  clearObject(COMMENTS_CHARIOTS);
  clearObject(COMMENTS_GROUPE_MOTEUR);
  clearObject(COMMENTS_INJECTEURS);
  clearObject(COMMENTS_SORTIES);

  if (isPlainObject(data.commentsCellules)) {
    Object.assign(COMMENTS_CELLULES, data.commentsCellules);
  }

  if (isPlainObject(data.commentsChariots)) {
    Object.assign(COMMENTS_CHARIOTS, data.commentsChariots);
  }

  if (isPlainObject(data.commentsGroupeMoteur)) {
    Object.assign(COMMENTS_GROUPE_MOTEUR, data.commentsGroupeMoteur);
  }

  if (isPlainObject(data.commentsInjecteurs)) {
    Object.assign(COMMENTS_INJECTEURS, data.commentsInjecteurs);
  }

  if (isPlainObject(data.commentsSorties)) {
    Object.assign(COMMENTS_SORTIES, data.commentsSorties);
  }

  applyLoadedArray(GLOBAL_PROBLEMS, data.globalProblems);
  applyLoadedArray(GLOBAL_PROBLEMS_ARCHIVE, data.globalProblemsArchive);

  ensureGlobalProblems();
  ensureGlobalProblemsArchive();

  MANUAL_INTERVENTION_ROWS = Array.isArray(data.manualInterventionRows)
    ? data.manualInterventionRows
    : [];

  INTERVENTION_COMMENT_OVERRIDES = isPlainObject(data.interventionCommentOverrides)
    ? data.interventionCommentOverrides
    : {};

  syncAllDataWithModels(false);
}

function saveAll() {
  try {
    const payload = buildPayload();
    saveLocalBackup(payload);
    markExportDirty();
  } catch (error) {
    console.error("Erreur lors de la sauvegarde locale :", error);
    alert("La sauvegarde locale a échoué.");
  }
}

function loadAll() {
  const mainKey = CONFIG_APP.STORAGE_KEY;
  const backupKey = getBackupStorageKey();

  try {
    const raw = localStorage.getItem(mainKey);

    if (!raw) {
      return;
    }

    const data = JSON.parse(raw);
    applyLoadedData(data);
  } catch (mainError) {
    console.error("LocalStorage principal corrompu :", mainError);

    try {
      const backupRaw = localStorage.getItem(backupKey);

      if (!backupRaw) {
        localStorage.removeItem(mainKey);
        alert("Les données locales sont corrompues.");
        return;
      }

      const backupData = JSON.parse(backupRaw);
      applyLoadedData(backupData);

      localStorage.setItem(mainKey, JSON.stringify(buildPayload()));
      alert("La sauvegarde principale était corrompue. La copie de secours a été restaurée.");
    } catch (backupError) {
      console.error("Backup local corrompu :", backupError);
      localStorage.removeItem(mainKey);
      localStorage.removeItem(backupKey);
      alert("Les données locales sont corrompues.");
    }
  }
}

function showStartupImportReminder() {
  if (startupImportReminderShown || !isImportRequiredThisSession()) {
    return;
  }

  startupImportReminderShown = true;

  const box = createImportExportOverlay("Import des données au démarrage");

  const warning = document.createElement("div");
  warning.className = "import-export-status pending";
  warning.textContent =
    "Rappel : avant de travailler, importe le dernier fichier .json partagé pour récupérer les données les plus récentes.";
  box.appendChild(warning);

  const intro = document.createElement("p");
  intro.className = "import-export-intro";
  intro.textContent =
    "Ce rappel apparaît tant qu’aucun import réussi n’a été enregistré sur cet appareil. Après un import valide, le bouton Importer redevient normal et reste normal à la prochaine ouverture.";
  box.appendChild(intro);

  box.appendChild(
    createInstructionList([
      "Va dans le dossier commun où les exports JSON sont rangés.",
      "Choisis toujours le fichier .json le plus récent.",
      "Importe-le avant de modifier des données, sinon tu risques de repartir d’une ancienne version.",
      "Après import réussi, le bouton Importer redevient normal."
    ])
  );

  const actions = document.createElement("div");
  actions.className = "import-export-actions";

  actions.appendChild(
    createPopupButton("model-save-button", "📥 Importer maintenant", () => {
      closeImportExportOverlay();
      openImportWorkflow();
    })
  );

  actions.appendChild(
    createPopupButton("history-close", "Fermer le rappel", () => {
      closeImportExportOverlay();
    })
  );

  box.appendChild(actions);
}

function exportData() {
  try {
    const raw = JSON.stringify(buildPayload(), null, 2);
    const box = createImportExportOverlay("Exporter les données");

    const status = document.createElement("div");
    status.className = hasPendingExportChanges()
      ? "import-export-status pending"
      : "import-export-status clean";
    status.textContent = hasPendingExportChanges()
      ? "Modifications détectées : export conseillé maintenant."
      : "Aucune modification en attente d’export.";
    box.appendChild(status);

    const intro = document.createElement("p");
    intro.className = "import-export-intro";
    intro.textContent =
      "L’export crée un fichier .json contenant toute l’application : modèles, dates, états, commentaires, problématiques et interventions.";
    box.appendChild(intro);

    box.appendChild(
      createInstructionList([
        "Clique sur “Télécharger le fichier JSON”.",
        "Range le fichier dans ton dossier commun, SharePoint ou OneDrive.",
        "Utilise toujours le fichier le plus récent pour repartir sur un autre appareil.",
        "Une fois l’export généré, le bouton rouge de la page principale redevient normal."
      ])
    );

    const textarea = document.createElement("textarea");
    textarea.className = "import-export-json-preview";
    textarea.value = raw;
    textarea.readOnly = true;
    box.appendChild(textarea);

    const actions = document.createElement("div");
    actions.className = "import-export-actions";

    actions.appendChild(
      createPopupButton("model-save-button", "📤 Télécharger le fichier JSON", () => {
        try {
          const fileName = downloadCurrentBackupJson();
          alert("Export généré : " + fileName + "\n\nPlace ce fichier dans ton dossier de sauvegarde partagé.");
          closeImportExportOverlay();
        } catch (error) {
          console.error("Téléchargement export impossible :", error);
          alert("Le téléchargement a échoué. Utilise la copie manuelle du JSON.");
        }
      })
    );

    actions.appendChild(
      createPopupButton("model-add-button", "Copier le JSON", async () => {
        const copied = await copyCurrentBackupJsonToClipboard(textarea, raw);
        if (copied) {
          alert("JSON copié. Colle-le dans un fichier .json puis enregistre-le dans le dossier partagé.");
        } else {
          textarea.focus();
          textarea.select();
          alert("Copie automatique impossible. Sélectionne le texte puis copie-le manuellement.");
        }
      })
    );

    actions.appendChild(
      createPopupButton("model-add-button", "✅ J’ai sauvegardé le JSON", () => {
        const fileName = getLastExportFileName() || "export manuel";
        markExportClean(fileName);
        alert("Export marqué comme effectué.");
        closeImportExportOverlay();
      })
    );

    actions.appendChild(
      createPopupButton("history-close", "Fermer", () => {
        closeImportExportOverlay();
      })
    );

    box.appendChild(actions);

    textarea.focus();
    textarea.select();
  } catch (error) {
    console.error("Erreur export :", error);
    alert("L'export a échoué.");
  }
}

function openImportWorkflow() {
  const box = createImportExportOverlay("Importer une sauvegarde");

  const warning = document.createElement("div");
  warning.className = "import-export-status pending";
  warning.textContent = "Attention : l’import remplace les données actuellement enregistrées sur cet appareil.";
  box.appendChild(warning);

  const intro = document.createElement("p");
  intro.className = "import-export-intro";
  intro.textContent =
    "L’import sert à récupérer une sauvegarde .json exportée depuis cette application.";
  box.appendChild(intro);

  box.appendChild(
    createInstructionList([
      "Prends le fichier .json le plus récent dans ton dossier partagé.",
      "Clique sur “Choisir le fichier JSON”.",
      "Valide l’import uniquement si tu veux remplacer les données locales.",
      "Après l’import, l’application se recharge automatiquement."
    ])
  );

  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json,.json";
  input.hidden = true;

  input.onchange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      return;
    }

    closeImportExportOverlay();
    importDataFromFile(file);
    input.value = "";
  };

  const actions = document.createElement("div");
  actions.className = "import-export-actions";

  actions.appendChild(
    createPopupButton("model-save-button", "📥 Choisir le fichier JSON", () => {
      input.click();
    })
  );

  actions.appendChild(
    createPopupButton("history-close", "Annuler", () => {
      closeImportExportOverlay();
    })
  );

  box.appendChild(actions);
  box.appendChild(input);
}

function importDataFromFile(file) {
  if (!file) {
    return;
  }

  const reader = new FileReader();

  reader.onload = function () {
    try {
      const parsed = JSON.parse(reader.result);

      if (!isValidPayloadObject(parsed)) {
        throw new Error("Contenu invalide");
      }

      const ok = confirm(
        "Importer va écraser les données actuelles de cet appareil.\n\n" +
          "Fichier sélectionné : " + file.name + "\n\n" +
          "Continuer ?"
      );

      if (!ok) {
        return;
      }

      applyLoadedData(parsed);

      const normalizedPayload = buildPayload();
      saveLocalBackup(normalizedPayload);
      markImportDone(file.name || "import JSON");
      markExportClean(file.name || "import JSON");

      alert("Import réussi. L’application revient à l’accueil avec les données importées.");
      refreshApplicationAfterImport();
    } catch (error) {
      console.error("Erreur import :", error);

      let message = "Erreur inconnue";
      if (error && error.message) {
        message = error.message;
      }

      alert("Import impossible : " + message);
    }
  };

  reader.onerror = function () {
    alert("Impossible de lire le fichier sélectionné.");
  };

  reader.readAsText(file);
}

function resetApplication() {
  const ok = confirm(
    "Tout réinitialiser ? Cela supprimera les modèles, commentaires et données enregistrées."
  );

  if (!ok) {
    return;
  }

  try {
    localStorage.removeItem(CONFIG_APP.STORAGE_KEY);
    localStorage.removeItem(getBackupStorageKey());
    alert("Réinitialisation effectuée.");
    location.reload();
  } catch (error) {
    console.error("Erreur reset :", error);
    alert("La réinitialisation locale a échoué.");
  }
}