/* =====================================================
   MODULE PLANS PRÉVENTIFS
   - Création / suppression de plans
   - Affichage dans les tableaux d'équipements
   - Validation par le technicien
===================================================== */

/* ---- Utilitaires ---- */

function getTodayDateString() {
  if (typeof window._getTodayDateString === "function") return window._getTodayDateString();
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0")
  ].join("-");
}

function formatDateFR(isoStr) {
  if (!isoStr) return "—";
  const [y, m, d] = isoStr.split("-");
  return `${d}/${m}/${y}`;
}

/* ====================================================
   POPUP PLANIFICATION
==================================================== */

function openPlanificationPopup(preselect = {}) {
  const existing = document.getElementById("planificationPopup");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "planificationPopup";
  overlay.className = "history-overlay planif-overlay";

  const box = document.createElement("div");
  box.className = "history-box planif-box";

  /* ---- En-tête ---- */
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

  /* ---- Nom du préventif ---- */
  const nomSection = document.createElement("div");
  nomSection.className = "planif-section";
  const nomLabel = document.createElement("div");
  nomLabel.className = "planif-section-label";
  nomLabel.textContent = "Nom du préventif";
  const nomInput = document.createElement("input");
  nomInput.type = "text";
  nomInput.className = "model-input";
  nomInput.placeholder = "ex : Ronde sensorielle, Nettoyage, Graissage…";
  nomInput.value = preselect.nom || "";
  nomSection.appendChild(nomLabel);
  nomSection.appendChild(nomInput);
  box.appendChild(nomSection);

  /* ---- Date d'échéance ---- */
  const dateSection = document.createElement("div");
  dateSection.className = "planif-section";
  const dateLabel = document.createElement("div");
  dateLabel.className = "planif-section-label";
  dateLabel.textContent = "Première échéance";
  const dateInput = document.createElement("input");
  dateInput.type = "date";
  dateInput.className = "date-input";
  dateInput.value = preselect.date || getTodayDateString();
  dateSection.appendChild(dateLabel);
  dateSection.appendChild(dateInput);
  box.appendChild(dateSection);

  /* ---- Récurrence ---- */
  const recSection = document.createElement("div");
  recSection.className = "planif-section";
  const recLabel = document.createElement("div");
  recLabel.className = "planif-section-label";
  recLabel.textContent = "Récurrence";
  const recGrid = document.createElement("div");
  recGrid.className = "planif-rec-grid";

  let selectedRec = preselect.recurrence || "ponctuel";
  const recBtns = {};

  RECURRENCES.forEach((rec) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = rec.key === selectedRec ? "planif-rec-btn active" : "planif-rec-btn";
    btn.textContent = rec.label;
    btn.onclick = () => {
      selectedRec = rec.key;
      Object.values(recBtns).forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    };
    recBtns[rec.key] = btn;
    recGrid.appendChild(btn);
  });

  recSection.appendChild(recLabel);
  recSection.appendChild(recGrid);
  box.appendChild(recSection);

  /* ---- Formulaire associé ---- */
  const formSection = document.createElement("div");
  formSection.className = "planif-section";
  const formLabel = document.createElement("div");
  formLabel.className = "planif-section-label";
  formLabel.textContent = "Formulaire de contrôle associé (optionnel)";

  const formSelect = document.createElement("select");
  formSelect.className = "model-input";

  const emptyOpt = document.createElement("option");
  emptyOpt.value = "";
  emptyOpt.textContent = "— Aucun formulaire —";
  formSelect.appendChild(emptyOpt);

  if (typeof initDefaultFormulaires === "function") initDefaultFormulaires();
  if (typeof DATA_MODELES_FORMULAIRES !== "undefined") {
    DATA_MODELES_FORMULAIRES.forEach((f) => {
      const opt = document.createElement("option");
      opt.value = f.id;
      opt.textContent = f.nom + " (" + (f.typeEquipement === "injecteur" ? "Injecteurs"
        : f.typeEquipement === "chariot" ? "Chariots"
        : f.typeEquipement === "groupeMoteur" ? "Groupes moteurs"
        : "Sorties") + ")";
      opt.selected = preselect.formulaireId === f.id;
      formSelect.appendChild(opt);
    });
  }

  formSection.appendChild(formLabel);
  formSection.appendChild(formSelect);
  box.appendChild(formSection);

  /* ---- Sélection équipements ---- */
  const equipSection = document.createElement("div");
  equipSection.className = "planif-section";
  const equipLabel = document.createElement("div");
  equipLabel.className = "planif-section-label";
  equipLabel.textContent = "Équipements concernés";

  const equipTypes = [
    { id: "chariot",      label: "🚃 Chariots",       icon: "🚃" },
    { id: "groupeMoteur", label: "⚙️ Groupes moteurs", icon: "⚙️" },
    { id: "injecteur",    label: "📦 Injecteurs",      icon: "📦" },
    { id: "sortie",       label: "🚪 Sorties",         icon: "🚪" }
  ];

  // Tous les panneaux visibles simultanément, pliables
  const panelContainer = document.createElement("div");
  panelContainer.className = "planif-panel-container planif-all-panels";

  /* State */
  const sel = {
    chariot:      new Set(preselect.type === "chariot"      ? (preselect.ids || []) : []),
    groupeMoteur: new Set(preselect.type === "groupeMoteur" ? (preselect.ids || []) : []),
    sortie:       new Set(preselect.type === "sortie"       ? (preselect.ids || []) : []),
    injecteurItems: []
  };

  if (preselect.type === "injecteur" && preselect.injecteurItems) {
    sel.injecteurItems = preselect.injecteurItems;
  }

  // État ouvert/fermé des panneaux
  const panelOpen = {
    chariot:      preselect.type === "chariot"      || false,
    groupeMoteur: preselect.type === "groupeMoteur" || false,
    injecteur:    preselect.type === "injecteur"    || false,
    sortie:       preselect.type === "sortie"       || false
  };

  const panelWrappers = {};

  /* ---- Builders panneaux ---- */
  function mkToggle(label, isActive, onToggle) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = isActive ? "planif-select-btn active" : "planif-select-btn";
    btn.textContent = label;
    btn.onclick = () => { onToggle(btn); updateSummary(); };
    return btn;
  }

  function buildPanel(type) {
    const panel = document.createElement("div");
    panel.className = "planif-panel";

    if (type === "chariot") {
      const qr = document.createElement("div");
      qr.className = "planif-quick-row";
      const mkQuick = (label, fn) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "planif-quick-btn";
        b.textContent = label;
        b.onclick = () => { fn(); panel.replaceWith(buildPanel("chariot")); updateSummary(); };
        return b;
      };
      qr.appendChild(mkQuick("Train 1 (1-77)",   () => { for (let i = CONFIG_APP.TRAIN_1_START; i <= CONFIG_APP.TRAIN_1_END; i++) sel.chariot.add(i); }));
      qr.appendChild(mkQuick("Train 2 (78-155)", () => { for (let i = CONFIG_APP.TRAIN_2_START; i <= CONFIG_APP.TRAIN_2_END; i++) sel.chariot.add(i); }));
      qr.appendChild(mkQuick("Tous",             () => { for (let i = CONFIG_APP.CHARIOT_MIN; i <= CONFIG_APP.CHARIOT_MAX; i++) sel.chariot.add(i); }));
      const bClear = document.createElement("button");
      bClear.type = "button"; bClear.className = "planif-quick-btn planif-quick-reset"; bClear.textContent = "Effacer";
      bClear.onclick = () => { sel.chariot.clear(); panel.replaceWith(buildPanel("chariot")); updateSummary(); };
      qr.appendChild(bClear);
      panel.appendChild(qr);
      const grid = document.createElement("div");
      grid.className = "planif-grid-chariots";
      for (let i = CONFIG_APP.CHARIOT_MIN; i <= CONFIG_APP.CHARIOT_MAX; i++) {
        const num = i;
        grid.appendChild(mkToggle(String(num), sel.chariot.has(num), (btn) => {
          sel.chariot.has(num) ? sel.chariot.delete(num) : sel.chariot.add(num);
          btn.className = sel.chariot.has(num) ? "planif-select-btn active" : "planif-select-btn";
        }));
      }
      panel.appendChild(grid);

    } else if (type === "groupeMoteur") {
      const qr = document.createElement("div"); qr.className = "planif-quick-row";
      const bAll = document.createElement("button"); bAll.type="button"; bAll.className="planif-quick-btn"; bAll.textContent="Tous";
      bAll.onclick = () => { for (let i=CONFIG_APP.GROUPE_MOTEUR_MIN;i<=CONFIG_APP.GROUPE_MOTEUR_MAX;i++) sel.groupeMoteur.add(i); panel.replaceWith(buildPanel("groupeMoteur")); updateSummary(); };
      const bClr = document.createElement("button"); bClr.type="button"; bClr.className="planif-quick-btn planif-quick-reset"; bClr.textContent="Effacer";
      bClr.onclick = () => { sel.groupeMoteur.clear(); panel.replaceWith(buildPanel("groupeMoteur")); updateSummary(); };
      qr.appendChild(bAll); qr.appendChild(bClr); panel.appendChild(qr);
      const grid = document.createElement("div"); grid.className = "planif-grid-small";
      for (let i=CONFIG_APP.GROUPE_MOTEUR_MIN;i<=CONFIG_APP.GROUPE_MOTEUR_MAX;i++) {
        const num = i;
        const range = typeof getGroupeMoteurRange === "function" ? getGroupeMoteurRange(num) : "";
        grid.appendChild(mkToggle(`GM${num} (${range})`, sel.groupeMoteur.has(num), (btn) => {
          sel.groupeMoteur.has(num) ? sel.groupeMoteur.delete(num) : sel.groupeMoteur.add(num);
          btn.className = sel.groupeMoteur.has(num) ? "planif-select-btn active" : "planif-select-btn";
        }));
      }
      panel.appendChild(grid);

    } else if (type === "sortie") {
      const qr = document.createElement("div"); qr.className = "planif-quick-row";
      const bAll = document.createElement("button"); bAll.type="button"; bAll.className="planif-quick-btn"; bAll.textContent="Toutes";
      bAll.onclick = () => { for(let i=CONFIG_APP.SORTIE_MIN;i<=CONFIG_APP.SORTIE_MAX;i++) sel.sortie.add(i); panel.replaceWith(buildPanel("sortie")); updateSummary(); };
      const bClr = document.createElement("button"); bClr.type="button"; bClr.className="planif-quick-btn planif-quick-reset"; bClr.textContent="Effacer";
      bClr.onclick = () => { sel.sortie.clear(); panel.replaceWith(buildPanel("sortie")); updateSummary(); };
      qr.appendChild(bAll); qr.appendChild(bClr); panel.appendChild(qr);
      const grid = document.createElement("div"); grid.className = "planif-grid-small";
      for (let i=CONFIG_APP.SORTIE_MIN;i<=CONFIG_APP.SORTIE_MAX;i++) {
        const num=i;
        const lbl = (typeof SORTIE_LABELS !== "undefined" && SORTIE_LABELS[num]) ? `${num} — ${SORTIE_LABELS[num]}` : String(num);
        grid.appendChild(mkToggle(lbl, sel.sortie.has(num), (btn) => {
          sel.sortie.has(num) ? sel.sortie.delete(num) : sel.sortie.add(num);
          btn.className = sel.sortie.has(num) ? "planif-select-btn active" : "planif-select-btn";
        }));
      }
      panel.appendChild(grid);

    } else if (type === "injecteur") {
      CONFIG_APP.INJECTEUR_IDS.forEach((injId) => {
        const block = document.createElement("div"); block.className = "planif-injecteur-block";
        const head = document.createElement("div"); head.className = "planif-injecteur-head";
        const htitle = document.createElement("span"); htitle.className = "planif-injecteur-title"; htitle.textContent = `Injecteur ${injId}`;
        const bTout = document.createElement("button"); bTout.type="button"; bTout.className="planif-quick-btn"; bTout.textContent="Tout";
        bTout.onclick = () => {
          INJECTEUR_CONVOYEURS.forEach((conv) => {
            ["convoyeur","motorisation"].forEach((tt) => {
              sel.injecteurItems = sel.injecteurItems.filter((x) => !(x.injecteurId===injId && x.convoyeurKey===conv.key && x.tableauType===tt));
              sel.injecteurItems.push({injecteurId:injId, convoyeurKey:conv.key, tableauType:tt});
            });
          });
          block.replaceWith(buildInjecteurBlock(injId));
          updateSummary();
        };
        head.appendChild(htitle); head.appendChild(bTout); block.appendChild(head);
        INJECTEUR_CONVOYEURS.forEach((conv) => block.appendChild(buildConvRow(injId, conv)));
        panel.appendChild(block);
      });
    }
    return panel;
  }

  function buildInjecteurBlock(injId) {
    const block = document.createElement("div"); block.className="planif-injecteur-block";
    const head = document.createElement("div"); head.className="planif-injecteur-head";
    const t = document.createElement("span"); t.className="planif-injecteur-title"; t.textContent=`Injecteur ${injId}`;
    const bTout = document.createElement("button"); bTout.type="button"; bTout.className="planif-quick-btn"; bTout.textContent="Tout";
    bTout.onclick = () => {
      INJECTEUR_CONVOYEURS.forEach((conv) => {
        ["convoyeur","motorisation"].forEach((tt) => {
          sel.injecteurItems = sel.injecteurItems.filter((x) => !(x.injecteurId===injId && x.convoyeurKey===conv.key && x.tableauType===tt));
          sel.injecteurItems.push({injecteurId:injId, convoyeurKey:conv.key, tableauType:tt});
        });
      });
      block.replaceWith(buildInjecteurBlock(injId));
      updateSummary();
    };
    head.appendChild(t); head.appendChild(bTout); block.appendChild(head);
    INJECTEUR_CONVOYEURS.forEach((conv) => block.appendChild(buildConvRow(injId, conv)));
    return block;
  }

  function buildConvRow(injId, conv) {
    const row = document.createElement("div"); row.className="planif-convoyeur-row";
    const lbl = document.createElement("span"); lbl.className="planif-convoyeur-label"; lbl.textContent=conv.label;
    const wrap = document.createElement("div"); wrap.className="planif-tableaux-wrap";
    ["convoyeur","motorisation"].forEach((tt) => {
      const isActive = sel.injecteurItems.some((x) => x.injecteurId===injId && x.convoyeurKey===conv.key && x.tableauType===tt);
      const btn = document.createElement("button"); btn.type="button";
      btn.className = isActive ? "planif-select-btn active" : "planif-select-btn";
      btn.textContent = tt === "convoyeur" ? "Pièces" : "Motorisation";
      btn.onclick = () => {
        const exists = sel.injecteurItems.some((x) => x.injecteurId===injId && x.convoyeurKey===conv.key && x.tableauType===tt);
        if (exists) {
          sel.injecteurItems = sel.injecteurItems.filter((x) => !(x.injecteurId===injId && x.convoyeurKey===conv.key && x.tableauType===tt));
          btn.classList.remove("active");
        } else {
          sel.injecteurItems.push({injecteurId:injId, convoyeurKey:conv.key, tableauType:tt});
          btn.classList.add("active");
        }
        updateSummary();
      };
      wrap.appendChild(btn);
    });
    row.appendChild(lbl); row.appendChild(wrap);
    return row;
  }

  /* ---- Résumé ---- */
  const summaryBox = document.createElement("div");
  summaryBox.className = "planif-summary planif-summary-empty";

  function updateSummary() {
    const lines = [];
    if (sel.chariot.size > 0)      lines.push(`${sel.chariot.size} chariot(s)`);
    if (sel.groupeMoteur.size > 0) lines.push([...sel.groupeMoteur].map((g) => `GM${g}`).join(", "));
    if (sel.sortie.size > 0)       lines.push(`${sel.sortie.size} sortie(s)`);
    if (sel.injecteurItems.length > 0) {
      const injIds = [...new Set(sel.injecteurItems.map((x) => x.injecteurId))];
      lines.push(`Injecteur(s) : ${injIds.join(", ")}`);
    }
    if (lines.length === 0) {
      summaryBox.textContent = "Aucun équipement sélectionné.";
      summaryBox.className = "planif-summary planif-summary-empty";
    } else {
      summaryBox.innerHTML = "<strong>Équipements :</strong> " + lines.join(" • ");
      summaryBox.className = "planif-summary planif-summary-filled";
    }
    if (typeof refreshAccordionCounts === "function") {
      try { refreshAccordionCounts(); } catch(e) {}
    }
  }

  equipSection.appendChild(equipLabel);

  // Construire les accordéons pour chaque famille
  equipTypes.forEach(({ id, label }) => {
    const wrap = document.createElement("div");
    wrap.className = "planif-accordion";
    panelWrappers[id] = wrap;

    const header = document.createElement("button");
    header.type = "button";
    header.className = panelOpen[id]
      ? "planif-accordion-header open"
      : "planif-accordion-header";

    const headerLeft = document.createElement("span");
    headerLeft.textContent = label;

    const headerCount = document.createElement("span");
    headerCount.className = "planif-accordion-count";
    headerCount.id = `planif-count-${id}`;

    const headerArrow = document.createElement("span");
    headerArrow.className = "planif-accordion-arrow";
    headerArrow.textContent = panelOpen[id] ? "▲" : "▼";

    header.appendChild(headerLeft);
    header.appendChild(headerCount);
    header.appendChild(headerArrow);

    const body = document.createElement("div");
    body.className = panelOpen[id]
      ? "planif-accordion-body open"
      : "planif-accordion-body";
    body.appendChild(buildPanel(id));

    header.onclick = () => {
      const isOpen = body.classList.contains("open");
      body.classList.toggle("open", !isOpen);
      header.classList.toggle("open", !isOpen);
      headerArrow.textContent = !isOpen ? "▲" : "▼";
    };

    wrap.appendChild(header);
    wrap.appendChild(body);
    panelContainer.appendChild(wrap);
  });

  function refreshAccordionCounts() {
    const counts = {
      chariot:      sel.chariot.size,
      groupeMoteur: sel.groupeMoteur.size,
      sortie:       sel.sortie.size,
      injecteur:    new Set(sel.injecteurItems.map((x) => x.injecteurId)).size
    };
    Object.keys(counts).forEach((id) => {
      const el = document.getElementById(`planif-count-${id}`);
      if (!el) return;
      if (counts[id] > 0) {
        el.textContent = `${counts[id]} sélectionné(s)`;
        el.style.display = "inline-flex";
      } else {
        el.textContent = "";
        el.style.display = "none";
      }
    });
  }

  equipSection.appendChild(panelContainer);
  box.appendChild(equipSection);
  box.appendChild(summaryBox);

  /* ---- Footer ---- */
  const footer = document.createElement("div");
  footer.className = "planif-footer";

  const btnAnnuler = document.createElement("button");
  btnAnnuler.type = "button"; btnAnnuler.className = "back-button"; btnAnnuler.textContent = "Annuler";
  btnAnnuler.onclick = () => overlay.remove();

  const btnPlanifier = document.createElement("button");
  btnPlanifier.type = "button"; btnPlanifier.className = "model-save-button planif-btn-confirm";
  btnPlanifier.textContent = "✓ Planifier";
  btnPlanifier.onclick = () => {
    const nom = nomInput.value.trim() || "Préventif";
    const date = dateInput.value || getTodayDateString();

    // Construire la liste d'équipements
    const equipements = [];
    sel.chariot.forEach((id) => equipements.push({ type: "chariot", ids: [id] }));
    sel.groupeMoteur.forEach((id) => equipements.push({ type: "groupeMoteur", ids: [id] }));
    sel.sortie.forEach((id) => equipements.push({ type: "sortie", ids: [id] }));
    sel.injecteurItems.forEach((item) => equipements.push({
      type: "injecteur",
      injecteurId: item.injecteurId,
      convoyeurKey: item.convoyeurKey,
      tableauType: item.tableauType
    }));

    if (equipements.length === 0) {
      alert("Veuillez sélectionner au moins un équipement.");
      return;
    }

    const plan = normalizePlanPreventif({
      id: generatePlanId(),
      nom,
      recurrence: selectedRec,
      dateCreation: getTodayDateString(),
      prochaineEcheance: date,
      equipements,
      statut: "actif",
      historiqueRealisations: [],
      formulaireId: formSelect.value || null
    });

    DATA_PLANS_PREVENTIFS.push(plan);
    saveAll();
    overlay.remove();
    renderCurrentState();

    const toast = document.createElement("div");
    toast.className = "planif-toast";
    toast.textContent = `✓ "${nom}" planifié pour le ${formatDateFR(date)}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  };

  footer.appendChild(btnAnnuler);
  footer.appendChild(btnPlanifier);
  box.appendChild(footer);

  overlay.appendChild(box);
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  document.body.appendChild(overlay);
  updateSummary();
}

/* ====================================================
   BLOC "PRÉVENTIFS PROGRAMMÉS" dans les tableaux
==================================================== */

function createPlansPreventifBlock(type, id, convoyeurKey, tableauType) {
  const plans = getPlansForEquipement(type, id, convoyeurKey, tableauType);
  if (!plans || plans.length === 0) return null;

  const block = document.createElement("div");
  block.className = "planif-block-equipement";

  const blockTitle = document.createElement("div");
  blockTitle.className = "planif-block-title";
  blockTitle.textContent = "📋 Préventifs programmés";
  block.appendChild(blockTitle);

  plans.forEach((plan) => {
    const card = document.createElement("div");
    const echu = isPlanEchu(plan);
    card.className = echu ? "planif-plan-card planif-plan-echu" : "planif-plan-card planif-plan-futur";

    // En-tête carte
    const cardHead = document.createElement("div");
    cardHead.className = "planif-plan-head";

    const planNom = document.createElement("span");
    planNom.className = "planif-plan-nom";
    planNom.textContent = plan.nom;

    const planBadge = document.createElement("span");
    planBadge.className = echu ? "planif-plan-badge planif-plan-badge-echu" : "planif-plan-badge planif-plan-badge-ok";
    planBadge.textContent = echu ? "⏰ À réaliser" : "✅ Planifié";

    cardHead.appendChild(planNom);
    cardHead.appendChild(planBadge);
    card.appendChild(cardHead);

    // Infos
    const cardInfo = document.createElement("div");
    cardInfo.className = "planif-plan-info";
    cardInfo.innerHTML =
      `Échéance : <strong>${formatDateFR(plan.prochaineEcheance)}</strong> &nbsp;•&nbsp; ` +
      `${getRecurrenceLabel(plan.recurrence)}`;
    card.appendChild(cardInfo);

    // Historique (dernier) 
    if (plan.historiqueRealisations && plan.historiqueRealisations.length > 0) {
      const last = plan.historiqueRealisations[plan.historiqueRealisations.length - 1];
      const cardHist = document.createElement("div");
      cardHist.className = "planif-plan-hist";
      cardHist.textContent = `Dernière réalisation : ${formatDateFR(last.date)}`;
      if (last.technicien) cardHist.textContent += ` par ${last.technicien}`;
      card.appendChild(cardHist);
    }

    // Bouton valider (si échu)
    if (echu) {
      const validateRow = document.createElement("div");
      validateRow.className = "planif-plan-validate-row";

      const valDateInput = document.createElement("input");
      valDateInput.type = "date";
      valDateInput.className = "date-input";
      valDateInput.value = getTodayDateString();

      const valBtn = document.createElement("button");
      valBtn.type = "button";
      valBtn.className = "parts-action-btn parts-preventif-done-btn";
      valBtn.textContent = "✓ Réalisé";
      valBtn.onclick = (e) => {
        e.preventDefault();
        const dateVal = valDateInput.value || getTodayDateString();

        // Enregistrer la réalisation
        plan.historiqueRealisations.push({
          date: dateVal,
          planifieDate: plan.prochaineEcheance
        });

        // Calculer prochaine échéance
        if (plan.recurrence === "ponctuel") {
          plan.statut = "terminé";
        } else {
          const next = calcProchaineDateEcheance(dateVal, plan.recurrence);
          plan.prochaineEcheance = next || plan.prochaineEcheance;
        }

        saveAll();
        renderCurrentState();
      };

      validateRow.appendChild(valDateInput);
      validateRow.appendChild(valBtn);
      card.appendChild(validateRow);
    }

    // Bouton supprimer (admin seulement)
    if (typeof adminUnlocked !== "undefined" && adminUnlocked === true) {
      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "model-delete-button planif-plan-del-btn";
      delBtn.textContent = "🗑 Supprimer ce plan";
      delBtn.onclick = (e) => {
        e.preventDefault();
        if (!confirm(`Supprimer le plan "${plan.nom}" ?`)) return;
        const idx = DATA_PLANS_PREVENTIFS.indexOf(plan);
        if (idx !== -1) DATA_PLANS_PREVENTIFS.splice(idx, 1);
        saveAll();
        renderCurrentState();
      };
      card.appendChild(delBtn);
    }

    block.appendChild(card);
  });

  return block;
}

/* ====================================================
   INTÉGRATION FORMULAIRE DANS LE BLOC ÉQUIPEMENT
   Appelé depuis createPlansPreventifBlock
==================================================== */

// Override de createPlansPreventifBlock pour inclure les formulaires
const _origCreatePlansPreventifBlock = createPlansPreventifBlock;
function createPlansPreventifBlock(type, id, convoyeurKey, tableauType) {
  const block = _origCreatePlansPreventifBlock(type, id, convoyeurKey, tableauType);
  if (!block) return null;

  // Chercher les plans avec formulaire pour cet équipement
  const plansAvecFormulaire = (DATA_PLANS_PREVENTIFS || []).filter((plan) => {
    if (!plan || plan.statut !== "actif" || !plan.formulaireId) return false;
    if (typeof isPlanEchu !== "function" || !isPlanEchu(plan)) return false;
    return plan.equipements && plan.equipements.some((eq) => {
      if (eq.type !== type) return false;
      if (type === "injecteur") {
        const eqId = typeof eq.injecteurId === "string" ? parseInt(eq.injecteurId) : eq.injecteurId;
        return eqId === id && (!convoyeurKey || eq.convoyeurKey === convoyeurKey);
      }
      return Array.isArray(eq.ids) && eq.ids.some((i) => {
        return (typeof i === "string" ? parseInt(i) : i) === id;
      });
    });
  });

  // Construire le label équipement
  const types = { chariot: "Chariot", groupeMoteur: "Groupe moteur", injecteur: "Injecteur", sortie: "Sortie" };
  const equipLabel = (types[type] || type) + " " + id;

  plansAvecFormulaire.forEach((plan) => {
    const formBlock = typeof createFormulaireBlock === "function"
      ? createFormulaireBlock(plan, equipLabel)
      : null;
    if (formBlock) block.appendChild(formBlock);
  });

  return block;
}
