const ADMIN_PASSWORD = "1234";

const INJECTEUR_IDS = Object.freeze([530, 531, 532, 533]);

const CONFIG_APP = Object.freeze({
  CHARIOT_MIN: 1,
  CHARIOT_MAX: 155,

  TRAIN_1_START: 1,
  TRAIN_1_END: 77,

  TRAIN_2_START: 78,
  TRAIN_2_END: 155,

  ENERGYBOX_TRAIN_1_START: 1,
  ENERGYBOX_TRAIN_1_END: 6,

  ENERGYBOX_TRAIN_2_START: 7,
  ENERGYBOX_TRAIN_2_END: 12,

  GROUPE_MOTEUR_MIN: 1,
  GROUPE_MOTEUR_MAX: 7,

  INJECTEUR_MIN: 530,
  INJECTEUR_MAX: 533,
  INJECTEUR_IDS,

  SORTIE_MIN: 39,
  SORTIE_MAX: 51,

  CONVOYEUR_MIN: 1,
  CONVOYEUR_MAX: 10,  // Sera mis à jour quand les portions seront définies

  CELLULE_MIN: 0,
  CELLULE_MAX: 309,

  STORAGE_KEY: "TCC_APP"
});

/* =========================
   LIBELLÉS SORTIES
========================= */

const SORTIE_LABELS = Object.freeze({
  39: "TB ST 3901",
  40: "TB ST 4001",
  41: "TB ST 4101",
  42: "TB ST 4201",
  43: "TB ST 4301",
  44: "TB ST 4401",
  45: "TB ST 4501",
  46: "TB ST 4601",
  47: "TB ST 4701",
  48: "TB ST 4801",
  49: "TB ST 4901",
  50: "TB ST 5001",
  51: "TB ST 5101"
});

/* =========================
   CONVOYEURS — PORTIONS
   (Noms provisoires — à mettre à jour)
========================= */

const CONVOYEUR_LABELS = Object.freeze({
  1:  "Portion 1",
  2:  "Portion 2",
  3:  "Portion 3",
  4:  "Portion 4",
  5:  "Portion 5",
  6:  "Portion 6",
  7:  "Portion 7",
  8:  "Portion 8",
  9:  "Portion 9",
  10: "Portion 10"
});

/* =========================
   INJECTEURS
========================= */

const INJECTEUR_CONVOYEURS = Object.freeze([
  Object.freeze({
    key: "orientation_60",
    label: "Convoyeur à bande d'orientation 60°"
  }),
  Object.freeze({
    key: "reception",
    label: "Convoyeur à bande réception"
  }),
  Object.freeze({
    key: "synchronisation",
    label: "Convoyeur à bande de synchronisation"
  }),
  Object.freeze({
    key: "lancement_30",
    label: "Convoyeur à bande de lancement 30°"
  })
]);

/* =========================
   SCHEMAS
========================= */

const SCHEMA_PATHS = Object.freeze({
  cellule: "schemas/cellule.png",
  chariot: "schemas/chariot.png",
  groupeMoteur: "schemas/groupe-moteur.png",
  sortie: "schemas/sortie.png",

  injecteurs: Object.freeze({
    general: "schemas/injecteurs/general.png",
    motorisation: "schemas/injecteurs/motorisation.png",

    convoyeurs: Object.freeze({
      orientation_60: "schemas/injecteurs/orientation-60.png",
      reception: "schemas/injecteurs/reception.png",
      synchronisation: "schemas/injecteurs/synchronisation.png",
      lancement_30: "schemas/injecteurs/lancement-30.png"
    })
  })
});