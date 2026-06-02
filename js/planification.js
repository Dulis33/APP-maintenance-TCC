/* =====================================================
   PLANIFICATION PRÉVENTIF
   Popup de planification accessible depuis :
   - La page d'accueil (encadrant)
   - Chaque équipement (pré-rempli)
===================================================== */

/**
 * Applique controlePreventif + preventifPlanifieDate sur un tableau de rows
 */
function planifierRows(rows, date) {
  if (!Array.isArray(rows)) return;
  rows.forEach((row) => {
    if (row) {
      row.controlePreventif = true;
      row.preventifPlanifieDate = date;
    }
  });
}

/**
 * Obtenir les rows d'un chariot (pièces directes)
 */
function getChariotRows(chariotNumber) {
  const key = getChariotKey(chariotNumber);
  ensureLocalRows(DATA_CHARIOTS, key, MODELE_CHARIOT_STANDARD);
  return DATA_CHARIOTS[key] || [];
}

/**
 * Obtenir les rows d'un groupe moteur
 */
function getGroupeMoteurRows(groupNumber) {
  const key = getGroupeMoteurKey(groupNumber);
  ensureLocalRows(DATA_GROUPE_MOTEUR, key, MODELE_GROUPE_MOTEUR);
  return DATA_GROUPE_MOTEUR[key] || [];
}

/**
 * Obtenir les rows d'une sortie
 */
function getSortieRows(sortieNumber) {
  const key = getSortieKey(sortieNumber);
  ensureLocalRows(DATA_SORTIES, key, MODELE_SORTIE);
  return DATA_SORTIES[key] || [];
}

/**
 * Obtenir les rows d'un injecteur/convoyeur/type
 */
function getInjecteurConvoyeurRows(injecteurNumber, convoyeurKey, type) {
  ensureInjecteurPieceRows(DATA_INJECTEUR_CONVOYEURS, injecteurNumber, convoyeurKey, type);
  return DATA_INJECTEUR_CONVOYEURS[injecteurNumber]?.[convoyeurKey]?.[type] || [];
}

/* =====================================================
   POPUP PRINCIPALE
===================================================== */

function openPlanificationPopup(preselect = {}) {
  const existing = document.getElementById("planificationPopup");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "planificationPopup";
  overlay.className = "history-overlay planif-overlay";

  const box = document.createElement("div");
  box.className = "history-box planif-box";

  // En-tête
  const header = document.createElement("div");
  header.className = "planif-header";

  const title = document.createElement("h3");
  title.textContent = "📋 Planifier un préventif";

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "cellule-history-large-close";
  closeBtn.textContent = "×";
  closeBtn.onclick = () => overlay.remove();

  header.appendChild(title);
  header.appendChild(closeBtn);
  box.appendChild(header);

  // Date prévue
  const dateSection = document.createElement("div");
  dateSection.className = "planif-section";

  const dateLabel = document.createElement("div");
  dateLabel.className = "planif-section-label";
  dateLabel.textContent = "Date prévue";

  const dateInput = document.createElement("input");
  dateInput.type = "date";
  dateInput.className = "date-input";
  dateInput.value = getTodayDateString();

  dateSection.appendChild(dateLabel);
  dateSection.appendChild(dateInput);
  box.appendChild(dateSection);

  // Sélection équipement
  const equipSection = document.createElement("div");
  equipSection.className = "planif-section";

  const equipLabel = document.createElement("div");
  equipLabel.className = "planif-section-label";
  equipLabel.textContent = "Type d'équipement";

  const equipTabs = document.createElement("div");
  equipTabs.className = "planif-tabs";

  const equipTypes = [
    { id: "chariot", label: "Chariots" },
    { id: "groupeMoteur", label: "Groupes moteurs" },
    { id: "injecteur", label: "Injecteurs" },
    { id: "sortie", label: "Sorties" }
  ];

  let activeEquip = preselect.type || "chariot";
  const tabBtns = {};
  const panelContainer = document.createElement("div");
  panelContainer.className = "planif-panel-container";

  // État de sélection
  const selection = {
    chariot: new Set(preselect.type === "chariot" && preselect.ids ? preselect.ids : []),
    groupeMoteur: new Set(preselect.type === "groupeMoteur" && preselect.ids ? preselect.ids : []),
    sortie: new Set(preselect.type === "sortie" && preselect.ids ? preselect.ids : []),
    injecteur: new Set(preselect.type === "injecteur" && preselect.ids ? preselect.ids : []),
    injecteurConvoyeurs: {},   // { injecteurId: Set of convoyeurKey }
    injecteurTableaux: {}      // { "injecteurId_convoyeurKey": Set("convoyeur"|"motorisation") }
  };

  // Pré-remplir injecteur convoyeurs/tableaux
  if (preselect.type === "injecteur" && preselect.ids) {
    preselect.ids.forEach((id) => {
      selection.injecteurConvoyeurs[id] = new Set(
        preselect.convoyeurs || INJECTEUR_CONVOYEURS.map((c) => c.key)
      );
      INJECTEUR_CONVOYEURS.forEach((conv) => {
        const k = `${id}_${conv.key}`;
        selection.injecteurTableaux[k] = new Set(preselect.tableaux || ["convoyeur", "motorisation"]);
      });
    });
  }

  function switchTab(type) {
    activeEquip = type;
    Object.keys(tabBtns).forEach((t) => {
      tabBtns[t].className = t === type
        ? "planif-tab active"
        : "planif-tab";
    });
    panelContainer.replaceChildren(buildPanel(type));
    updateSummary();
  }

  equipTypes.forEach(({ id, label }) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = id === activeEquip ? "planif-tab active" : "planif-tab";
    btn.textContent = label;
    btn.onclick = () => switchTab(id);
    tabBtns[id] = btn;
    equipTabs.appendChild(btn);
  });

  /* ---------- Builders de panneaux ---------- */

  function buildToggleBtn(label, isActive, onClick) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = isActive ? "planif-select-btn active" : "planif-select-btn";
    btn.textContent = label;
    btn.onclick = () => {
      onClick();
      updateSummary();
    };
    return btn;
  }

  function buildPanel(type) {
    const panel = document.createElement("div");
    panel.className = "planif-panel";

    if (type === "chariot") {
      // Boutons Train 1 / Train 2 / Tous
      const quickRow = document.createElement("div");
      quickRow.className = "planif-quick-row";

      const btnT1 = document.createElement("button");
      btnT1.type = "button";
      btnT1.className = "planif-quick-btn";
      btnT1.textContent = "Train 1 (1-77)";
      btnT1.onclick = () => {
        for (let i = CONFIG_APP.TRAIN_1_START; i <= CONFIG_APP.TRAIN_1_END; i++) {
          selection.chariot.add(i);
        }
        panel.replaceWith(buildPanel("chariot"));
        updateSummary();
      };

      const btnT2 = document.createElement("button");
      btnT2.type = "button";
      btnT2.className = "planif-quick-btn";
      btnT2.textContent = "Train 2 (78-155)";
      btnT2.onclick = () => {
        for (let i = CONFIG_APP.TRAIN_2_START; i <= CONFIG_APP.TRAIN_2_END; i++) {
          selection.chariot.add(i);
        }
        panel.replaceWith(buildPanel("chariot"));
        updateSummary();
      };

      const btnAll = document.createElement("button");
      btnAll.type = "button";
      btnAll.className = "planif-quick-btn";
      btnAll.textContent = "Tous";
      btnAll.onclick = () => {
        for (let i = CONFIG_APP.CHARIOT_MIN; i <= CONFIG_APP.CHARIOT_MAX; i++) {
          selection.chariot.add(i);
        }
        panel.replaceWith(buildPanel("chariot"));
        updateSummary();
      };

      const btnNone = document.createElement("button");
      btnNone.type = "button";
      btnNone.className = "planif-quick-btn planif-quick-reset";
      btnNone.textContent = "Effacer";
      btnNone.onclick = () => {
        selection.chariot.clear();
        panel.replaceWith(buildPanel("chariot"));
        updateSummary();
      };

      quickRow.appendChild(btnT1);
      quickRow.appendChild(btnT2);
      quickRow.appendChild(btnAll);
      quickRow.appendChild(btnNone);
      panel.appendChild(quickRow);

      const grid = document.createElement("div");
      grid.className = "planif-grid-chariots";

      for (let i = CONFIG_APP.CHARIOT_MIN; i <= CONFIG_APP.CHARIOT_MAX; i++) {
        const num = i;
        const active = selection.chariot.has(num);
        const btn = buildToggleBtn(String(num), active, () => {
          if (selection.chariot.has(num)) {
            selection.chariot.delete(num);
          } else {
            selection.chariot.add(num);
          }
          btn.className = selection.chariot.has(num) ? "planif-select-btn active" : "planif-select-btn";
        });
        grid.appendChild(btn);
      }

      panel.appendChild(grid);

    } else if (type === "groupeMoteur") {
      const grid = document.createElement("div");
      grid.className = "planif-grid-small";

      const btnAll = document.createElement("button");
      btnAll.type = "button";
      btnAll.className = "planif-quick-btn";
      btnAll.textContent = "Tous";
      btnAll.onclick = () => {
        for (let i = CONFIG_APP.GROUPE_MOTEUR_MIN; i <= CONFIG_APP.GROUPE_MOTEUR_MAX; i++) {
          selection.groupeMoteur.add(i);
        }
        panel.replaceWith(buildPanel("groupeMoteur"));
        updateSummary();
      };

      const btnNone = document.createElement("button");
      btnNone.type = "button";
      btnNone.className = "planif-quick-btn planif-quick-reset";
      btnNone.textContent = "Effacer";
      btnNone.onclick = () => {
        selection.groupeMoteur.clear();
        panel.replaceWith(buildPanel("groupeMoteur"));
        updateSummary();
      };

      const quickRow = document.createElement("div");
      quickRow.className = "planif-quick-row";
      quickRow.appendChild(btnAll);
      quickRow.appendChild(btnNone);
      panel.appendChild(quickRow);

      for (let i = CONFIG_APP.GROUPE_MOTEUR_MIN; i <= CONFIG_APP.GROUPE_MOTEUR_MAX; i++) {
        const num = i;
        const range = getGroupeMoteurRange(num);
        const active = selection.groupeMoteur.has(num);
        const btn = buildToggleBtn(`GM ${num} (${range})`, active, () => {
          if (selection.groupeMoteur.has(num)) {
            selection.groupeMoteur.delete(num);
          } else {
            selection.groupeMoteur.add(num);
          }
          btn.className = selection.groupeMoteur.has(num) ? "planif-select-btn active" : "planif-select-btn";
        });
        grid.appendChild(btn);
      }

      panel.appendChild(grid);

    } else if (type === "sortie") {
      const quickRow = document.createElement("div");
      quickRow.className = "planif-quick-row";

      const btnAll = document.createElement("button");
      btnAll.type = "button";
      btnAll.className = "planif-quick-btn";
      btnAll.textContent = "Toutes";
      btnAll.onclick = () => {
        for (let i = CONFIG_APP.SORTIE_MIN; i <= CONFIG_APP.SORTIE_MAX; i++) {
          selection.sortie.add(i);
        }
        panel.replaceWith(buildPanel("sortie"));
        updateSummary();
      };

      const btnNone = document.createElement("button");
      btnNone.type = "button";
      btnNone.className = "planif-quick-btn planif-quick-reset";
      btnNone.textContent = "Effacer";
      btnNone.onclick = () => {
        selection.sortie.clear();
        panel.replaceWith(buildPanel("sortie"));
        updateSummary();
      };

      quickRow.appendChild(btnAll);
      quickRow.appendChild(btnNone);
      panel.appendChild(quickRow);

      const grid = document.createElement("div");
      grid.className = "planif-grid-small";

      for (let i = CONFIG_APP.SORTIE_MIN; i <= CONFIG_APP.SORTIE_MAX; i++) {
        const num = i;
        const label = SORTIE_LABELS[num] ? `${num} — ${SORTIE_LABELS[num]}` : String(num);
        const active = selection.sortie.has(num);
        const btn = buildToggleBtn(label, active, () => {
          if (selection.sortie.has(num)) {
            selection.sortie.delete(num);
          } else {
            selection.sortie.add(num);
          }
          btn.className = selection.sortie.has(num) ? "planif-select-btn active" : "planif-select-btn";
        });
        grid.appendChild(btn);
      }

      panel.appendChild(grid);

    } else if (type === "injecteur") {
      CONFIG_APP.INJECTEUR_IDS.forEach((injecteurId) => {
        const injecteurBlock = document.createElement("div");
        injecteurBlock.className = "planif-injecteur-block";

        // En-tête injecteur
        const injecteurHead = document.createElement("div");
        injecteurHead.className = "planif-injecteur-head";

        const injecteurTitle = document.createElement("span");
        injecteurTitle.className = "planif-injecteur-title";
        injecteurTitle.textContent = `Injecteur ${injecteurId}`;

        // Btn "Tout l'injecteur"
        const btnTout = document.createElement("button");
        btnTout.type = "button";
        btnTout.className = "planif-quick-btn";
        btnTout.textContent = "Tout";
        btnTout.onclick = () => {
          selection.injecteur.add(injecteurId);
          if (!selection.injecteurConvoyeurs[injecteurId]) {
            selection.injecteurConvoyeurs[injecteurId] = new Set();
          }
          INJECTEUR_CONVOYEURS.forEach((conv) => {
            selection.injecteurConvoyeurs[injecteurId].add(conv.key);
            const k = `${injecteurId}_${conv.key}`;
            if (!selection.injecteurTableaux[k]) {
              selection.injecteurTableaux[k] = new Set();
            }
            selection.injecteurTableaux[k].add("convoyeur");
            selection.injecteurTableaux[k].add("motorisation");
          });
          injecteurBlock.replaceWith(buildInjecteurBlock(injecteurId));
          updateSummary();
        };

        injecteurHead.appendChild(injecteurTitle);
        injecteurHead.appendChild(btnTout);
        injecteurBlock.appendChild(injecteurHead);

        // Convoyeurs
        INJECTEUR_CONVOYEURS.forEach((conv) => {
          injecteurBlock.appendChild(buildConvoyeurRow(injecteurId, conv));
        });

        panel.appendChild(injecteurBlock);
      });
    }

    return panel;
  }

  function buildInjecteurBlock(injecteurId) {
    const block = document.createElement("div");
    block.className = "planif-injecteur-block";

    const head = document.createElement("div");
    head.className = "planif-injecteur-head";

    const title = document.createElement("span");
    title.className = "planif-injecteur-title";
    title.textContent = `Injecteur ${injecteurId}`;

    const btnTout = document.createElement("button");
    btnTout.type = "button";
    btnTout.className = "planif-quick-btn";
    btnTout.textContent = "Tout";
    btnTout.onclick = () => {
      selection.injecteur.add(injecteurId);
      if (!selection.injecteurConvoyeurs[injecteurId]) {
        selection.injecteurConvoyeurs[injecteurId] = new Set();
      }
      INJECTEUR_CONVOYEURS.forEach((conv) => {
        selection.injecteurConvoyeurs[injecteurId].add(conv.key);
        const k = `${injecteurId}_${conv.key}`;
        if (!selection.injecteurTableaux[k]) {
          selection.injecteurTableaux[k] = new Set();
        }
        selection.injecteurTableaux[k].add("convoyeur");
        selection.injecteurTableaux[k].add("motorisation");
      });
      block.replaceWith(buildInjecteurBlock(injecteurId));
      updateSummary();
    };

    head.appendChild(title);
    head.appendChild(btnTout);
    block.appendChild(head);

    INJECTEUR_CONVOYEURS.forEach((conv) => {
      block.appendChild(buildConvoyeurRow(injecteurId, conv));
    });

    return block;
  }

  function buildConvoyeurRow(injecteurId, conv) {
    const row = document.createElement("div");
    row.className = "planif-convoyeur-row";

    const convLabel = document.createElement("span");
    convLabel.className = "planif-convoyeur-label";
    convLabel.textContent = conv.label;

    const tableauxWrap = document.createElement("div");
    tableauxWrap.className = "planif-tableaux-wrap";

    const k = `${injecteurId}_${conv.key}`;
    if (!selection.injecteurTableaux[k]) {
      selection.injecteurTableaux[k] = new Set();
    }
    if (!selection.injecteurConvoyeurs[injecteurId]) {
      selection.injecteurConvoyeurs[injecteurId] = new Set();
    }

    ["convoyeur", "motorisation"].forEach((type) => {
      const typeLabel = type === "convoyeur" ? "Pièces" : "Motorisation";
      const isActive = selection.injecteurTableaux[k].has(type);

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = isActive ? "planif-select-btn active" : "planif-select-btn";
      btn.textContent = typeLabel;
      btn.onclick = () => {
        if (selection.injecteurTableaux[k].has(type)) {
          selection.injecteurTableaux[k].delete(type);
        } else {
          selection.injecteurTableaux[k].add(type);
          selection.injecteurConvoyeurs[injecteurId].add(conv.key);
          selection.injecteur.add(injecteurId);
        }
        // Si plus aucun tableau pour ce convoyeur, retirer le convoyeur
        if (selection.injecteurTableaux[k].size === 0) {
          selection.injecteurConvoyeurs[injecteurId].delete(conv.key);
        }
        // Si plus aucun convoyeur pour cet injecteur, retirer l'injecteur
        if (selection.injecteurConvoyeurs[injecteurId].size === 0) {
          selection.injecteur.delete(injecteurId);
        }
        btn.className = selection.injecteurTableaux[k].has(type)
          ? "planif-select-btn active"
          : "planif-select-btn";
        updateSummary();
      };

      tableauxWrap.appendChild(btn);
    });

    row.appendChild(convLabel);
    row.appendChild(tableauxWrap);
    return row;
  }

  /* ---------- Résumé ---------- */

  const summaryBox = document.createElement("div");
  summaryBox.className = "planif-summary";

  function updateSummary() {
    const lines = [];

    if (selection.chariot.size > 0) {
      lines.push(`Chariots : ${selection.chariot.size} sélectionné(s)`);
    }
    if (selection.groupeMoteur.size > 0) {
      lines.push(`Groupes moteurs : ${[...selection.groupeMoteur].map((g) => `GM${g}`).join(", ")}`);
    }
    if (selection.sortie.size > 0) {
      lines.push(`Sorties : ${selection.sortie.size} sélectionnée(s)`);
    }
    if (selection.injecteur.size > 0) {
      [...selection.injecteur].forEach((id) => {
        const convs = selection.injecteurConvoyeurs[id];
        if (convs && convs.size > 0) {
          lines.push(`Injecteur ${id} : ${convs.size} convoyeur(s)`);
        }
      });
    }

    if (lines.length === 0) {
      summaryBox.textContent = "Aucun équipement sélectionné.";
      summaryBox.className = "planif-summary planif-summary-empty";
    } else {
      summaryBox.innerHTML = "<strong>Récapitulatif :</strong><br>" + lines.join("<br>");
      summaryBox.className = "planif-summary planif-summary-filled";
    }
  }

  /* ---------- Assemblage ---------- */

  equipSection.appendChild(equipLabel);
  equipSection.appendChild(equipTabs);
  equipSection.appendChild(panelContainer);
  panelContainer.appendChild(buildPanel(activeEquip));

  box.appendChild(equipSection);
  box.appendChild(summaryBox);

  /* ---------- Footer ---------- */

  const footer = document.createElement("div");
  footer.className = "planif-footer";

  const btnAnnuler = document.createElement("button");
  btnAnnuler.type = "button";
  btnAnnuler.className = "back-button";
  btnAnnuler.textContent = "Annuler";
  btnAnnuler.onclick = () => overlay.remove();

  const btnPlanifier = document.createElement("button");
  btnPlanifier.type = "button";
  btnPlanifier.className = "model-save-button planif-btn-confirm";
  btnPlanifier.textContent = "✓ Planifier";
  btnPlanifier.onclick = () => {
    const date = dateInput.value || getTodayDateString();
    let nbTotal = 0;

    // Chariots
    selection.chariot.forEach((num) => {
      const rows = getChariotRows(num);
      planifierRows(rows, date);
      nbTotal += rows.length;
    });

    // Groupes moteurs
    selection.groupeMoteur.forEach((num) => {
      const rows = getGroupeMoteurRows(num);
      planifierRows(rows, date);
      nbTotal += rows.length;
    });

    // Sorties
    selection.sortie.forEach((num) => {
      const rows = getSortieRows(num);
      planifierRows(rows, date);
      nbTotal += rows.length;
    });

    // Injecteurs
    selection.injecteur.forEach((injecteurId) => {
      const convs = selection.injecteurConvoyeurs[injecteurId];
      if (!convs) return;
      convs.forEach((convKey) => {
        const k = `${injecteurId}_${convKey}`;
        const tableaux = selection.injecteurTableaux[k];
        if (!tableaux) return;
        tableaux.forEach((type) => {
          const rows = getInjecteurConvoyeurRows(injecteurId, convKey, type);
          planifierRows(rows, date);
          nbTotal += rows.length;
        });
      });
    });

    if (nbTotal === 0) {
      alert("Aucun équipement sélectionné.");
      return;
    }

    saveAll();
    overlay.remove();
    renderCurrentState();

    // Confirmation visuelle
    const msg = document.createElement("div");
    msg.className = "planif-toast";
    msg.textContent = `✓ Préventif planifié pour le ${date} — ${nbTotal} ligne(s) programmée(s)`;
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 3500);
  };

  footer.appendChild(btnAnnuler);
  footer.appendChild(btnPlanifier);
  box.appendChild(footer);

  overlay.appendChild(box);
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };
  document.body.appendChild(overlay);

  updateSummary();
}
