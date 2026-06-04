let MODELE_CELLULE = [];
let MODELE_CHARIOT_STANDARD = [];
let MODELE_GROUPE_MOTEUR = [];
let MODELE_SORTIE = [];
const SPECIAL_CHARIOTS = {};

function getConfiguredInjecteurIds() {
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

function createEmptyInjecteurSection() {
  return {
    convoyeur: [],
    motorisation: []
  };
}

function createEmptyInjecteurConvoyeurBlock() {
  const block = {};

  INJECTEUR_CONVOYEURS.forEach((conv) => {
    block[conv.key] = createEmptyInjecteurSection();
  });

  return block;
}

function createInjecteurConvoyeurRoot() {
  const root = {};

  getConfiguredInjecteurIds().forEach((injecteurId) => {
    root[injecteurId] = createEmptyInjecteurConvoyeurBlock();
  });

  return root;
}

const MODELE_INJECTEUR_CONVOYEURS = createInjecteurConvoyeurRoot();

let SCHEMA_CELLULE = null;
let SCHEMA_CHARIOT_STANDARD = null;
let SCHEMA_GROUPE_MOTEUR = null;
let SCHEMA_SORTIE = null;

const DATA_CELLULES = {};
const DATA_CHARIOTS = {};
const DATA_ENERGYBOX = {};
const DATA_GROUPE_MOTEUR = {};
const DATA_SORTIES = {};

const COMMENTS_CELLULES = {};
const COMMENTS_CHARIOTS = {};
const COMMENTS_GROUPE_MOTEUR = {};
const COMMENTS_INJECTEURS = {};
const COMMENTS_SORTIES = {};

const DATA_INJECTEUR_CONVOYEURS = createInjecteurConvoyeurRoot();

const GLOBAL_PROBLEMS = [];
const GLOBAL_PROBLEMS_ARCHIVE = [];

// Plans préventifs programmés
const DATA_PLANS_PREVENTIFS = [];

// Modèles de formulaires préventifs
const DATA_MODELES_FORMULAIRES = [];

/* ---- Modèles de sections disponibles ----
  ok_nok              : □ OK  □ NOK
  ok_nok_urgent       : □ OK  □ NOK → Urgent ? □ Oui □ Non
  ok_nok_multiple     : liste d'items avec chacun □ OK □ NOK
  ok_nok_urgent_precision : □ OK □ NOK + urgent + cases précisions
  texte_libre         : ligne(s) texte libre
  checkbox_liste      : liste de cases à cocher
  numerique           : valeur numérique à renseigner
*/

function generateFormulaireId() {
  return "form_" + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function normalizeFormulaireSection(sec = {}) {
  const s = sec && typeof sec === "object" ? sec : {};
  return {
    id:        s.id        || generateFormulaireId(),
    titre:     s.titre     || "",
    type:      s.type      || "ok_nok",
    items:     Array.isArray(s.items)      ? [...s.items]      : [],
    precisions: Array.isArray(s.precisions) ? [...s.precisions] : [],
    anomalie:  s.anomalie  || "aucune",  // critique | aPrevoir | aucune
    lignes:    typeof s.lignes === "number" ? s.lignes : 2  // pour texte_libre
  };
}

function normalizeModeleFormulaire(f = {}) {
  const safe = f && typeof f === "object" ? f : {};
  return {
    id:            safe.id            || generateFormulaireId(),
    nom:           safe.nom           || "Formulaire sans nom",
    typeEquipement: safe.typeEquipement || "injecteur",
    sections:      Array.isArray(safe.sections)
      ? safe.sections.map(normalizeFormulaireSection)
      : []
  };
}

function getModeleFormulaire(id) {
  return DATA_MODELES_FORMULAIRES.find((f) => f.id === id) || null;
}

function getModelesForEquipement(typeEquipement) {
  return DATA_MODELES_FORMULAIRES.filter(
    (f) => !typeEquipement || f.typeEquipement === typeEquipement
  );
}

/* ---- Modèles pré-créés ---- */
function initDefaultFormulaires() {
  if (DATA_MODELES_FORMULAIRES.length > 0) return;

  const defaults = [
    {
      id: "form_default_ronde_injecteur",
      nom: "Ronde sensorielle",
      typeEquipement: "injecteur",
      sections: [
        { id: "s1", titre: "État des bandes", type: "ok_nok_urgent", anomalie: "critique" },
        { id: "s2", titre: "Protection anti-pince doigt", type: "ok_nok_multiple",
          items: ["Position 1", "Position 2", "Position 3"], anomalie: "critique" },
        { id: "s3", titre: "Propreté générale", type: "ok_nok", anomalie: "aPrevoir" },
        { id: "s4", titre: "Vibrations / bruits anormaux", type: "ok_nok_urgent_precision",
          precisions: ["Rouleau moteur", "Rouleau tendeur", "Palier", "Autre"],
          anomalie: "critique" },
        { id: "s5", titre: "Commentaires généraux", type: "texte_libre", lignes: 3 }
      ]
    },
    {
      id: "form_default_ronde_chariot",
      nom: "Ronde sensorielle",
      typeEquipement: "chariot",
      sections: [
        { id: "s1", titre: "État général du chariot", type: "ok_nok_urgent", anomalie: "critique" },
        { id: "s2", titre: "Fixation et assemblage", type: "ok_nok", anomalie: "critique" },
        { id: "s3", titre: "Guidage et roulement", type: "ok_nok_urgent_precision",
          precisions: ["Galets", "Rails", "Roulement", "Autre"], anomalie: "critique" },
        { id: "s4", titre: "Propreté générale", type: "ok_nok", anomalie: "aPrevoir" },
        { id: "s5", titre: "Commentaires", type: "texte_libre", lignes: 2 }
      ]
    },
    {
      id: "form_default_ronde_groupeMoteur",
      nom: "Ronde sensorielle",
      typeEquipement: "groupeMoteur",
      sections: [
        { id: "s1", titre: "État moteur", type: "ok_nok_urgent", anomalie: "critique" },
        { id: "s2", titre: "Courroies / transmission", type: "ok_nok_urgent",
          anomalie: "critique" },
        { id: "s3", titre: "Vibrations / bruits", type: "ok_nok_urgent_precision",
          precisions: ["Moteur", "Réducteur", "Courroie", "Palier", "Autre"],
          anomalie: "critique" },
        { id: "s4", titre: "Température anormale", type: "ok_nok", anomalie: "critique" },
        { id: "s5", titre: "Propreté générale", type: "ok_nok", anomalie: "aPrevoir" },
        { id: "s6", titre: "Commentaires", type: "texte_libre", lignes: 2 }
      ]
    },
    {
      id: "form_default_ronde_sortie",
      nom: "Ronde sensorielle",
      typeEquipement: "sortie",
      sections: [
        { id: "s1", titre: "État général", type: "ok_nok_urgent", anomalie: "critique" },
        { id: "s2", titre: "Capteurs / détecteurs", type: "ok_nok_multiple",
          items: ["Capteur entrée", "Capteur sortie"], anomalie: "critique" },
        { id: "s3", titre: "Propreté générale", type: "ok_nok", anomalie: "aPrevoir" },
        { id: "s4", titre: "Commentaires", type: "texte_libre", lignes: 2 }
      ]
    },
    {
      id: "form_default_controle_visuel",
      nom: "Contrôle visuel",
      typeEquipement: "injecteur",
      sections: [
        { id: "s1", titre: "Aspect général", type: "ok_nok_urgent", anomalie: "critique" },
        { id: "s2", titre: "Présence de corps étrangers", type: "ok_nok", anomalie: "critique" },
        { id: "s3", titre: "État des protections", type: "ok_nok", anomalie: "critique" },
        { id: "s4", titre: "Signalisation et étiquetage", type: "ok_nok", anomalie: "aPrevoir" },
        { id: "s5", titre: "Observations", type: "texte_libre", lignes: 3 }
      ]
    },
    {
      id: "form_default_nettoyage",
      nom: "Nettoyage",
      typeEquipement: "injecteur",
      sections: [
        { id: "s1", titre: "Nettoyage bandes", type: "ok_nok", anomalie: "aPrevoir" },
        { id: "s2", titre: "Nettoyage châssis", type: "ok_nok", anomalie: "aPrevoir" },
        { id: "s3", titre: "Évacuation déchets", type: "ok_nok", anomalie: "aPrevoir" },
        { id: "s4", titre: "Anomalie découverte pendant nettoyage",
          type: "ok_nok_urgent", anomalie: "critique" },
        { id: "s5", titre: "Observations", type: "texte_libre", lignes: 2 }
      ]
    }
  ];

  defaults.forEach((d) => DATA_MODELES_FORMULAIRES.push(normalizeModeleFormulaire(d)));
}

let MANUAL_INTERVENTION_ROWS = [];
let INTERVENTION_COMMENT_OVERRIDES = {};

function normalizeBoolean(value) {
  return value === true || value === "true";
}

function generatePlanId() {
  return "plan_" + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

const RECURRENCES = [
  { key: "ponctuel",    label: "Ponctuel (une seule fois)" },
  { key: "semaine",     label: "Toutes les semaines",      jours: 7  },
  { key: "2semaines",   label: "Toutes les 2 semaines",    jours: 14 },
  { key: "3semaines",   label: "Toutes les 3 semaines",    jours: 21 },
  { key: "mensuel",     label: "Tous les mois",            mois: 1   },
  { key: "trimestriel", label: "Tous les trimestres",      mois: 3   }
];

function getRecurrenceLabel(key) {
  const r = RECURRENCES.find((r) => r.key === key);
  return r ? r.label : key;
}

function calcProchaineDateEcheance(dateRealiseeStr, recurrenceKey) {
  const r = RECURRENCES.find((r) => r.key === recurrenceKey);
  if (!r || recurrenceKey === "ponctuel") return null;
  const d = new Date(dateRealiseeStr);
  if (isNaN(d.getTime())) return null;
  if (r.jours) {
    d.setDate(d.getDate() + r.jours);
  } else if (r.mois) {
    d.setMonth(d.getMonth() + r.mois);
  }
  return d.toISOString().split("T")[0];
}

function normalizePlanPreventif(plan = {}) {
  const safePlan = plan && typeof plan === "object" ? plan : {};
  return {
    id:               safePlan.id || generatePlanId(),
    nom:              safePlan.nom || "Préventif",
    recurrence:       safePlan.recurrence || "ponctuel",
    dateCreation:     safePlan.dateCreation || "",
    prochaineEcheance: safePlan.prochaineEcheance || "",
    equipements:      Array.isArray(safePlan.equipements) ? safePlan.equipements : [],
    statut:           safePlan.statut || "actif",
    formulaireId:     safePlan.formulaireId || null,
    reponsesEnCours:  safePlan.reponsesEnCours && typeof safePlan.reponsesEnCours === "object" && !Array.isArray(safePlan.reponsesEnCours)
      ? { ...safePlan.reponsesEnCours }
      : {},
    historiqueRealisations: Array.isArray(safePlan.historiqueRealisations) ? safePlan.historiqueRealisations : []
  };
}

function isPlanEchu(plan) {
  if (!plan || plan.statut !== "actif") return false;
  if (!plan.prochaineEcheance) return false;
  // Comparaison directe YYYY-MM-DD évite le bug timezone UTC
  const today = new Date();
  const todayStr = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
  ].join("-");
  return plan.prochaineEcheance <= todayStr;
}

function getPlansForEquipement(type, id, convoyeurKey, tableauType) {
  const numId = typeof id === "string" ? parseInt(id, 10) : id;
  return DATA_PLANS_PREVENTIFS.filter((plan) => {
    if (!plan || plan.statut !== "actif") return false;
    return plan.equipements.some((eq) => {
      if (eq.type !== type) return false;
      if (type === "injecteur") {
        const eqId = typeof eq.injecteurId === "string" ? parseInt(eq.injecteurId, 10) : eq.injecteurId;
        return eqId === numId
          && (!convoyeurKey || eq.convoyeurKey === convoyeurKey)
          && (!tableauType || eq.tableauType === tableauType);
      }
      return Array.isArray(eq.ids) && eq.ids.some((i) => {
        const ni = typeof i === "string" ? parseInt(i, 10) : i;
        return ni === numId;
      });
    });
  });
}

function cloneStringArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function normalizeEnergyNode(node = {}, type = "energyBox") {
  const safeNode = node && typeof node === "object" ? node : {};

  if (type === "energyBox") {
    return {
      emplacement: safeNode.emplacement || "",
      article: safeNode.article || "",
      dateChgt: safeNode.dateChgt || "",
      dateDefaut: safeNode.dateDefaut || "",
      aChanger: safeNode.aChanger === true,
      historiqueChgt: cloneStringArray(safeNode.historiqueChgt),
      historiqueDefaut: cloneStringArray(safeNode.historiqueDefaut)
    };
  }

  return {
    emplacement: safeNode.emplacement || "",
    reference: safeNode.reference || "",
    dateChgt: safeNode.dateChgt || "",
    aChanger: safeNode.aChanger === true,
    historiqueChgt: cloneStringArray(safeNode.historiqueChgt)
  };
}

function normalizeEnergyBoxRecord(record = {}) {
  const safeRecord = record && typeof record === "object" ? record : {};

  return {
    energyBox: normalizeEnergyNode(safeRecord.energyBox, "energyBox"),
    pickup1: normalizeEnergyNode(safeRecord.pickup1, "pickup"),
    pickup2: normalizeEnergyNode(safeRecord.pickup2, "pickup")
  };
}

function createEmptyLocalRow() {
  return {
    dateChgt: "",
    dateCtrl: "",
    critique: false,
    aPrevoir: false,
    aControler: false,
    controlePreventif: false,
    historiqueChgt: [],
    historiqueCtrl: []
  };
}

function createEmptyInjecteurPieceRow() {
  return {
    dateChgt: "",
    dateCtrl: "",
    critique: false,
    aPrevoir: false,
    aControler: false,
    controlePreventif: false,
    commentaire: "",
    historiqueChgt: [],
    historiqueCtrl: []
  };
}

function createEmptyCommentItem() {
  return {
    text: "",
    elementConcerne: "",
    date: "",
    critique: false,
    aPrevoir: false,
    aControler: false,
    celluleDefaut: false,
    celluleInhibee: false,
    controlePreventif: false,
    suiviType: "",
    cycleId: 0,
    jour: "",
    label: "",
    technicien: "",
    constat: "",
    action: "",
    observation: "",
    acquittee: false,
    inhibition: false,
    deinhibee: false,
    ok: false,
    issue: "",
    archivee: false,
    validatedAt: ""
  };
}

function createEmptyGlobalProblematique() {
  return {
    date: "",
    numero: "",
    texte: "",
    statut: "ouverte",
    actions: []
  };
}

function createEmptyGlobalAction() {
  return {
    date: "",
    texte: ""
  };
}

function normalizeGlobalAction(action = {}) {
  const safeAction = action && typeof action === "object" ? action : {};

  return {
    date: safeAction.date || "",
    texte: safeAction.texte || ""
  };
}

function normalizeGlobalProblematique(probleme = {}, archived = false) {
  const safeProbleme = probleme && typeof probleme === "object" ? probleme : {};

  return {
    date: safeProbleme.date || "",
    numero: safeProbleme.numero || "",
    texte: safeProbleme.texte || "",
    statut: archived
      ? "résolue"
      : safeProbleme.statut === "résolue"
        ? "résolue"
        : "ouverte",
    dateArchivage: archived ? safeProbleme.dateArchivage || "" : undefined,
    actions: Array.isArray(safeProbleme.actions)
      ? safeProbleme.actions.map(normalizeGlobalAction)
      : []
  };
}

function ensureGlobalProblems() {
  for (let i = 0; i < GLOBAL_PROBLEMS.length; i++) {
    GLOBAL_PROBLEMS[i] = normalizeGlobalProblematique(GLOBAL_PROBLEMS[i], false);
  }
}

function ensureGlobalProblemsArchive() {
  for (let i = 0; i < GLOBAL_PROBLEMS_ARCHIVE.length; i++) {
    GLOBAL_PROBLEMS_ARCHIVE[i] = normalizeGlobalProblematique(
      GLOBAL_PROBLEMS_ARCHIVE[i],
      true
    );
  }
}

function normalizeRow(row = {}) {
  const safeRow = row && typeof row === "object" ? row : {};
  const isLegacyHs = safeRow.aChanger === true || safeRow.statut === "NOK";

  // Plus de migration aControler → on lit uniquement controlePreventif
  // Les anciens JSON avec aControler:true ne remontent plus automatiquement
  const isPreventif = normalizeBoolean(safeRow.controlePreventif);

  return {
    dateChgt: safeRow.dateChgt || "",
    dateCtrl: safeRow.dateCtrl || "",
    critique: safeRow.critique === true || isLegacyHs,
    aPrevoir: safeRow.aPrevoir === true && !(safeRow.critique === true || isLegacyHs),
    aControler: false,
    controlePreventif: isPreventif,
    historiqueChgt: cloneStringArray(safeRow.historiqueChgt),
    historiqueCtrl: cloneStringArray(safeRow.historiqueCtrl)
  };
}

function normalizeInjecteurPieceRow(row = {}) {
  const safeRow = row && typeof row === "object" ? row : {};
  const isLegacyCritical = safeRow.critique === true || safeRow.aChanger === true;

  // Plus de migration aControler → uniquement controlePreventif
  const isPreventif = normalizeBoolean(safeRow.controlePreventif);

  return {
    dateChgt: safeRow.dateChgt || "",
    dateCtrl: safeRow.dateCtrl || "",
    critique: isLegacyCritical,
    aPrevoir: safeRow.aPrevoir === true && !isLegacyCritical,
    aControler: false,
    controlePreventif: isPreventif,
    commentaire: safeRow.commentaire || "",
    historiqueChgt: cloneStringArray(safeRow.historiqueChgt),
    historiqueCtrl: cloneStringArray(safeRow.historiqueCtrl)
  };
}

function normalizeCommentItem(item = {}) {
  const safeItem = item && typeof item === "object" ? item : {};
  const isLegacyCritical = safeItem.critique === true || safeItem.aChanger === true;
  const isLegacyToCheck =
    normalizeBoolean(safeItem.aControler) || normalizeBoolean(safeItem.aVerifier);
  const safeCycleId = Number.isFinite(Number(safeItem.cycleId))
    ? Number(safeItem.cycleId)
    : 0;
  const safeJour = Number.isFinite(Number(safeItem.jour))
    ? Number(safeItem.jour)
    : safeItem.jour || "";

  return {
    text: safeItem.text || "",
    elementConcerne: safeItem.elementConcerne || "",
    date: safeItem.date || "",
    critique: isLegacyCritical,
    aPrevoir: safeItem.aPrevoir === true && !isLegacyCritical,
    aControler: isLegacyToCheck,
    celluleDefaut: safeItem.celluleDefaut === true,
    celluleInhibee: safeItem.celluleInhibee === true,
    controlePreventif: safeItem.controlePreventif === true,
    suiviType: safeItem.suiviType || "",
    cycleId: safeCycleId,
    jour: safeJour,
    label: safeItem.label || "",
    technicien: safeItem.technicien || "",
    constat: safeItem.constat || "",
    action: safeItem.action || "",
    observation: safeItem.observation || "",
    acquittee: safeItem.acquittee === true,
    inhibition: safeItem.inhibition === true,
    deinhibee: safeItem.deinhibee === true || safeItem.issue === "deinhibee",
    ok: safeItem.ok === true || safeItem.celluleOk === true || safeItem.issue === "ok",
    issue: safeItem.issue || "",
    archivee: safeItem.archivee === true,
    validatedAt: safeItem.validatedAt || ""
  };
}

function mutateLocalRow(target, source = {}) {
  target.dateChgt = source.dateChgt || "";
  target.dateCtrl = source.dateCtrl || "";
  target.critique = source.critique === true;
  target.aPrevoir = source.aPrevoir === true;
  target.aControler = false;
  target.controlePreventif =
    source.controlePreventif === true || source.aControler === true;
  target.historiqueChgt = cloneStringArray(source.historiqueChgt);
  target.historiqueCtrl = cloneStringArray(source.historiqueCtrl);
  return target;
}

function mutateInjecteurPieceRow(target, source = {}) {
  target.dateChgt = source.dateChgt || "";
  target.dateCtrl = source.dateCtrl || "";
  target.critique = source.critique === true;
  target.aPrevoir = source.aPrevoir === true;
  target.aControler = false;
  target.controlePreventif =
    source.controlePreventif === true || source.aControler === true;
  target.commentaire = source.commentaire || "";
  target.historiqueChgt = cloneStringArray(source.historiqueChgt);
  target.historiqueCtrl = cloneStringArray(source.historiqueCtrl);
  return target;
}

function mutateCommentItem(target, source = {}) {
  target.text = source.text || "";
  target.elementConcerne = source.elementConcerne || "";
  target.date = source.date || "";
  target.critique = source.critique === true;
  target.aPrevoir = source.aPrevoir === true;
  target.aControler = source.aControler === true;
  target.celluleDefaut = source.celluleDefaut === true;
  target.celluleInhibee = source.celluleInhibee === true;
  target.controlePreventif = source.controlePreventif === true;
  target.suiviType = source.suiviType || "";
  target.cycleId = Number.isFinite(Number(source.cycleId)) ? Number(source.cycleId) : 0;
  target.jour = Number.isFinite(Number(source.jour)) ? Number(source.jour) : source.jour || "";
  target.label = source.label || "";
  target.technicien = source.technicien || "";
  target.constat = source.constat || "";
  target.action = source.action || "";
  target.observation = source.observation || "";
  target.acquittee = source.acquittee === true;
  target.inhibition = source.inhibition === true;
  target.deinhibee = source.deinhibee === true;
  target.ok = source.ok === true;
  target.issue = source.issue || "";
  target.archivee = source.archivee === true;
  target.validatedAt = source.validatedAt || "";
  return target;
}

function ensureLocalRows(store, key, model) {
  if (!Array.isArray(store[key])) {
    store[key] = [];
  }

  while (store[key].length < model.length) {
    store[key].push(createEmptyLocalRow());
  }

  while (store[key].length > model.length) {
    store[key].pop();
  }

  for (let i = 0; i < store[key].length; i++) {
    const normalized = normalizeRow(store[key][i]);
    const current = store[key][i] || createEmptyLocalRow();
    store[key][i] = current;
    mutateLocalRow(current, normalized);
  }
}

function ensureCommentRows(store, key) {
  if (!Array.isArray(store[key])) {
    store[key] = [];
  }

  for (let i = 0; i < store[key].length; i++) {
    const normalized = normalizeCommentItem(store[key][i]);
    const current = store[key][i] || createEmptyCommentItem();
    store[key][i] = current;
    mutateCommentItem(current, normalized);

    if (i === 0) {
      current.text = "";
      current.elementConcerne = "";
      current.date = "";
    }
  }
}

function ensureEnergyBoxData(boxNumber) {
  const key = getEnergyBoxKey(boxNumber);

  if (!DATA_ENERGYBOX[key] || typeof DATA_ENERGYBOX[key] !== "object") {
    DATA_ENERGYBOX[key] = normalizeEnergyBoxRecord({});
    return;
  }

  DATA_ENERGYBOX[key] = normalizeEnergyBoxRecord(DATA_ENERGYBOX[key]);
}

function ensureInjecteurStructure(container, injecteurNumber, convoyeurKey, type) {
  if (!container[injecteurNumber] || typeof container[injecteurNumber] !== "object") {
    container[injecteurNumber] = {};
  }

  if (
    !container[injecteurNumber][convoyeurKey] ||
    typeof container[injecteurNumber][convoyeurKey] !== "object"
  ) {
    container[injecteurNumber][convoyeurKey] = createEmptyInjecteurSection();
  }

  if (!Array.isArray(container[injecteurNumber][convoyeurKey][type])) {
    container[injecteurNumber][convoyeurKey][type] = [];
  }
}

function ensureInjecteurPieceRows(container, injecteurNumber, convoyeurKey, type) {
  ensureInjecteurStructure(MODELE_INJECTEUR_CONVOYEURS, injecteurNumber, convoyeurKey, type);
  ensureInjecteurStructure(container, injecteurNumber, convoyeurKey, type);

  const model = MODELE_INJECTEUR_CONVOYEURS[injecteurNumber][convoyeurKey][type];
  const rows = container[injecteurNumber][convoyeurKey][type];

  while (rows.length < model.length) {
    rows.push(createEmptyInjecteurPieceRow());
  }

  while (rows.length > model.length) {
    rows.pop();
  }

  for (let i = 0; i < rows.length; i++) {
    const normalized = normalizeInjecteurPieceRow(rows[i]);
    const current = rows[i] || createEmptyInjecteurPieceRow();
    rows[i] = current;
    mutateInjecteurPieceRow(current, normalized);
  }
}

function syncStoreWithModel(store, keys, getModelForKey) {
  keys.forEach((key) => {
    ensureLocalRows(store, key, getModelForKey(key));
  });
}

function syncCommentStore(store, keys) {
  keys.forEach((key) => {
    ensureCommentRows(store, key);
  });
}

function syncAllDataWithModels(shouldSave = true) {
  syncStoreWithModel(DATA_CELLULES, Object.keys(DATA_CELLULES), () => MODELE_CELLULE);

  syncStoreWithModel(DATA_CHARIOTS, Object.keys(DATA_CHARIOTS), (key) => {
    const match = key.match(/^chariot_(\d+)$/);
    const chariotNumber = match ? parseInt(match[1], 10) : null;
    return chariotNumber !== null ? getChariotParts(chariotNumber) : MODELE_CHARIOT_STANDARD;
  });

  syncStoreWithModel(
    DATA_GROUPE_MOTEUR,
    Object.keys(DATA_GROUPE_MOTEUR),
    () => MODELE_GROUPE_MOTEUR
  );

  syncStoreWithModel(DATA_SORTIES, Object.keys(DATA_SORTIES), () => MODELE_SORTIE);

  syncCommentStore(COMMENTS_CELLULES, Object.keys(COMMENTS_CELLULES));
  syncCommentStore(COMMENTS_CHARIOTS, Object.keys(COMMENTS_CHARIOTS));
  syncCommentStore(COMMENTS_GROUPE_MOTEUR, Object.keys(COMMENTS_GROUPE_MOTEUR));
  syncCommentStore(COMMENTS_INJECTEURS, Object.keys(COMMENTS_INJECTEURS));
  syncCommentStore(COMMENTS_SORTIES, Object.keys(COMMENTS_SORTIES));

  getConfiguredInjecteurIds().forEach((injecteurNumber) => {
    ensureCommentRows(COMMENTS_INJECTEURS, getInjecteurKey(injecteurNumber));

    INJECTEUR_CONVOYEURS.forEach((conv) => {
      ensureInjecteurPieceRows(
        DATA_INJECTEUR_CONVOYEURS,
        injecteurNumber,
        conv.key,
        "convoyeur"
      );
      ensureInjecteurPieceRows(
        DATA_INJECTEUR_CONVOYEURS,
        injecteurNumber,
        conv.key,
        "motorisation"
      );
    });
  });

  for (
    let sortieNumber = CONFIG_APP.SORTIE_MIN;
    sortieNumber <= CONFIG_APP.SORTIE_MAX;
    sortieNumber++
  ) {
    ensureLocalRows(DATA_SORTIES, getSortieKey(sortieNumber), MODELE_SORTIE);
    ensureCommentRows(COMMENTS_SORTIES, getSortieKey(sortieNumber));
  }

  ensureGlobalProblems();
  ensureGlobalProblemsArchive();

  if (shouldSave) {
    saveAll();
  }
}

function getGlobalProbleme(problemIndex) {
  ensureGlobalProblems();

  if (!GLOBAL_PROBLEMS[problemIndex] || typeof GLOBAL_PROBLEMS[problemIndex] !== "object") {
    return null;
  }

  GLOBAL_PROBLEMS[problemIndex] = normalizeGlobalProblematique(
    GLOBAL_PROBLEMS[problemIndex],
    false
  );

  return GLOBAL_PROBLEMS[problemIndex];
}

function addGlobalProblematique() {
  ensureGlobalProblems();
  GLOBAL_PROBLEMS.push(createEmptyGlobalProblematique());
  saveAll();
  renderCurrentState();
}

function removeGlobalProblematique(problemIndex) {
  ensureGlobalProblems();

  if (!Number.isInteger(problemIndex) || problemIndex < 0 || problemIndex >= GLOBAL_PROBLEMS.length) {
    return;
  }

  GLOBAL_PROBLEMS.splice(problemIndex, 1);
  saveAll();
  renderCurrentState();
}

function addGlobalAction(problemIndex) {
  const probleme = getGlobalProbleme(problemIndex);

  if (!probleme) {
    return;
  }

  if (!Array.isArray(probleme.actions)) {
    probleme.actions = [];
  }

  probleme.actions.push(createEmptyGlobalAction());
  saveAll();
  renderCurrentState();
}

function removeGlobalAction(problemIndex, actionIndex) {
  const probleme = getGlobalProbleme(problemIndex);

  if (!probleme || !Array.isArray(probleme.actions)) {
    return;
  }

  if (!Number.isInteger(actionIndex) || actionIndex < 0 || actionIndex >= probleme.actions.length) {
    return;
  }

  probleme.actions.splice(actionIndex, 1);
  saveAll();
  renderCurrentState();
}

function archiveResolvedGlobalProblems() {
  ensureGlobalProblems();
  ensureGlobalProblemsArchive();

  const kept = [];
  let movedCount = 0;
  const today = new Date().toISOString().slice(0, 10);

  GLOBAL_PROBLEMS.forEach((probleme) => {
    const normalized = normalizeGlobalProblematique(probleme, false);

    if (normalized.statut === "résolue") {
      GLOBAL_PROBLEMS_ARCHIVE.push({
        date: normalized.date,
        numero: normalized.numero,
        texte: normalized.texte,
        statut: "résolue",
        dateArchivage: today,
        actions: normalized.actions.map(normalizeGlobalAction)
      });
      movedCount += 1;
    } else {
      kept.push(normalized);
    }
  });

  GLOBAL_PROBLEMS.length = 0;
  kept.forEach((probleme) => {
    GLOBAL_PROBLEMS.push(probleme);
  });

  saveAll();
  return movedCount;
}