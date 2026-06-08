/* =====================================================
   CALENDRIER DES PRÉVENTIFS PROGRAMMÉS
   Vue mensuelle + vue liste
   Accessible depuis l'accueil
===================================================== */

function renderCalendrierPreventifs() {
  clearView();
  appView.appendChild(createBackButton());

  // État de la vue (réactif sans re-render complet)
  const state = {
    annee: new Date().getFullYear(),
    mois: new Date().getMonth(), // 0-11
    vue: "liste", // "liste" | "calendrier"
    filtres: new Set(["chariot", "groupeMoteur", "injecteur", "sortie"])
  };

  const container = document.createElement("div");
  container.className = "cal-container";
  appView.appendChild(container);

  function build() {
    container.innerHTML = "";

    // ---- En-tête ----
    const header = document.createElement("div");
    header.className = "cal-header";

    // Navigation mois
    const navRow = document.createElement("div");
    navRow.className = "cal-nav-row";

    const btnPrev = document.createElement("button");
    btnPrev.type = "button";
    btnPrev.className = "cal-nav-btn";
    btnPrev.textContent = "‹";
    btnPrev.onclick = () => {
      state.mois--;
      if (state.mois < 0) { state.mois = 11; state.annee--; }
      build();
    };

    const monthLabel = document.createElement("span");
    monthLabel.className = "cal-month-label";
    const d = new Date(state.annee, state.mois, 1);
    monthLabel.textContent = d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
      .replace(/^./, (c) => c.toUpperCase());

    const btnNext = document.createElement("button");
    btnNext.type = "button";
    btnNext.className = "cal-nav-btn";
    btnNext.textContent = "›";
    btnNext.onclick = () => {
      state.mois++;
      if (state.mois > 11) { state.mois = 0; state.annee++; }
      build();
    };

    const btnToday = document.createElement("button");
    btnToday.type = "button";
    btnToday.className = "cal-today-btn";
    btnToday.textContent = "Aujourd'hui";
    btnToday.onclick = () => {
      state.annee = new Date().getFullYear();
      state.mois = new Date().getMonth();
      build();
    };

    navRow.appendChild(btnPrev);
    navRow.appendChild(monthLabel);
    navRow.appendChild(btnNext);
    navRow.appendChild(btnToday);
    header.appendChild(navRow);

    // Bascule vue
    const viewRow = document.createElement("div");
    viewRow.className = "cal-view-row";

    ["liste", "calendrier"].forEach((v) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = v === state.vue ? "cal-view-btn active" : "cal-view-btn";
      btn.textContent = v === "liste" ? "📋 Liste" : "📅 Calendrier";
      btn.onclick = () => { state.vue = v; build(); };
      viewRow.appendChild(btn);
    });
    header.appendChild(viewRow);

    // Filtres familles
    const filtreRow = document.createElement("div");
    filtreRow.className = "cal-filtre-row";

    const familles = [
      { key: "chariot",      label: "Chariots" },
      { key: "groupeMoteur", label: "GM" },
      { key: "injecteur",    label: "Injecteurs" },
      { key: "sortie",       label: "Sorties" }
    ];

    familles.forEach(({ key, label }) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = state.filtres.has(key) ? "cal-filtre-btn active" : "cal-filtre-btn";
      btn.textContent = label;
      btn.onclick = () => {
        state.filtres.has(key) ? state.filtres.delete(key) : state.filtres.add(key);
        build();
      };
      filtreRow.appendChild(btn);
    });
    header.appendChild(filtreRow);

    container.appendChild(header);

    // ---- Plans du mois (filtrés) ----
    const plans = getPlansForMonth(state.annee, state.mois, state.filtres);

    if (state.vue === "liste") {
      buildListeView(container, plans, state.annee, state.mois);
    } else {
      buildCalView(container, plans, state.annee, state.mois);
    }
  }

  build();
}

/* ---- Récupérer les plans pour un mois donné ---- */
function getPlansForMonth(annee, mois, filtres) {
  if (!Array.isArray(DATA_PLANS_PREVENTIFS)) return [];

  const today = new Date();
  const todayStr = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
  ].join("-");

  const result = [];

  DATA_PLANS_PREVENTIFS.forEach((plan) => {
    if (!plan || plan.statut === "terminé") return;

    // Filtrer par famille
    const planFamilles = new Set(
      (plan.equipements || []).map((eq) => eq.type)
    );
    const matchFamille = [...planFamilles].some((f) => filtres.has(f));
    if (!matchFamille) return;

    // Vérifier si l'échéance est dans ce mois
    if (!plan.prochaineEcheance) return;
    const [y, m] = plan.prochaineEcheance.split("-").map(Number);
    if (y !== annee || m - 1 !== mois) {
      // Inclure aussi les plans échus des mois précédents (non réalisés)
      if (plan.prochaineEcheance <= todayStr) {
        result.push({ plan, etat: "echu" });
      }
      return;
    }

    const etat = plan.prochaineEcheance < todayStr ? "echu"
                : plan.prochaineEcheance === todayStr ? "aujourdhui"
                : "futur";

    result.push({ plan, etat });
  });

  // Trier par date
  result.sort((a, b) => {
    const da = a.plan.prochaineEcheance || "";
    const db = b.plan.prochaineEcheance || "";
    return da.localeCompare(db);
  });

  return result;
}

/* ---- Vue LISTE ---- */
function buildListeView(container, plans, annee, mois) {
  const list = document.createElement("div");
  list.className = "cal-list";

  // Plans échus d'avant ce mois
  const echusBefore = plans.filter((p) => {
    const [y, m] = (p.plan.prochaineEcheance || "").split("-").map(Number);
    return y < annee || (y === annee && m - 1 < mois);
  });

  if (echusBefore.length > 0) {
    const section = document.createElement("div");
    section.className = "cal-section";
    const sectionTitle = document.createElement("div");
    sectionTitle.className = "cal-section-title cal-section-overdue";
    sectionTitle.textContent = "⚠️ En retard (mois précédents)";
    section.appendChild(sectionTitle);
    echusBefore.forEach(({ plan }) => {
      section.appendChild(buildPlanCard(plan, "echu"));
    });
    list.appendChild(section);
  }

  // Plans du mois courant
  const duMois = plans.filter((p) => {
    const [y, m] = (p.plan.prochaineEcheance || "").split("-").map(Number);
    return y === annee && m - 1 === mois;
  });

  if (duMois.length === 0 && echusBefore.length === 0) {
    const empty = document.createElement("div");
    empty.className = "cal-empty";
    empty.textContent = "Aucun préventif programmé ce mois-ci.";
    list.appendChild(empty);
  }

  // Grouper par semaine
  const byWeek = {};
  duMois.forEach(({ plan, etat }) => {
    const d = new Date(plan.prochaineEcheance);
    const weekNum = getWeekNumber(d);
    const key = `${weekNum}`;
    if (!byWeek[key]) byWeek[key] = { label: `Semaine ${weekNum}`, items: [] };
    byWeek[key].items.push({ plan, etat });
  });

  Object.values(byWeek).forEach((week) => {
    const section = document.createElement("div");
    section.className = "cal-section";
    const sectionTitle = document.createElement("div");
    sectionTitle.className = "cal-section-title";
    sectionTitle.textContent = week.label;
    section.appendChild(sectionTitle);
    week.items.forEach(({ plan, etat }) => {
      section.appendChild(buildPlanCard(plan, etat));
    });
    list.appendChild(section);
  });

  container.appendChild(list);
}

/* ---- Carte d'un plan ---- */
function buildPlanCard(plan, etat) {
  const card = document.createElement("div");
  card.className = `cal-plan-card cal-plan-${etat}`;

  // En-tête
  const head = document.createElement("div");
  head.className = "cal-plan-head";

  const dateEl = document.createElement("span");
  dateEl.className = "cal-plan-date";
  dateEl.textContent = formatDateFR(plan.prochaineEcheance);

  const nomEl = document.createElement("span");
  nomEl.className = "cal-plan-nom";
  nomEl.textContent = plan.nom;

  const badgeEl = document.createElement("span");
  badgeEl.className = `cal-plan-badge cal-badge-${etat}`;
  badgeEl.textContent = etat === "echu" ? "⏰ En retard"
                      : etat === "aujourdhui" ? "🔔 Aujourd'hui"
                      : "📋 Planifié";

  head.appendChild(dateEl);
  head.appendChild(nomEl);
  head.appendChild(badgeEl);
  card.appendChild(head);

  // Équipements
  const equipEl = document.createElement("div");
  equipEl.className = "cal-plan-equip";
  const equipParts = [];
  (plan.equipements || []).forEach((eq) => {
    if (eq.type === "chariot" && Array.isArray(eq.ids)) {
      equipParts.push(`Chariot ${eq.ids.join(", ")}`);
    } else if (eq.type === "groupeMoteur" && Array.isArray(eq.ids)) {
      equipParts.push(`GM ${eq.ids.map((i) => getGroupeMoteurRange ? getGroupeMoteurRange(i) : i).join(", ")}`);
    } else if (eq.type === "sortie" && Array.isArray(eq.ids)) {
      equipParts.push(`Sortie ${eq.ids.join(", ")}`);
    } else if (eq.type === "injecteur") {
      equipParts.push(`Injecteur ${eq.injecteurId}`);
    }
  });
  equipEl.textContent = [...new Set(equipParts)].join(" • ") || "—";
  card.appendChild(equipEl);

  // Récurrence
  const recEl = document.createElement("div");
  recEl.className = "cal-plan-rec";
  recEl.textContent = typeof getRecurrenceLabel === "function"
    ? getRecurrenceLabel(plan.recurrence)
    : plan.recurrence;
  card.appendChild(recEl);

  // Bouton imprimer — disponible sur TOUS les plans avec formulaire
  if (plan.formulaireId) {
    const modele = typeof getModeleFormulaire === "function" ? getModeleFormulaire(plan.formulaireId) : null;
    if (modele) {
      const btnPrint = document.createElement("button");
      btnPrint.type = "button";
      btnPrint.className = "back-button form-btn-print";
      btnPrint.style.cssText = "width:100%;margin-top:6px;";
      btnPrint.textContent = "🖨 Imprimer le formulaire";
      btnPrint.onclick = (e) => {
        e.preventDefault();
        // Construire un label équipement depuis le plan
        const types = { chariot: "Chariot", groupeMoteur: "Groupe moteur", injecteur: "Injecteur", sortie: "Sortie", convoyeur: "Convoyeur" };
        const parts = (plan.equipements || []).map((eq) => {
          if (eq.type === "custom") return eq.label || "Équipement";
          if (eq.type === "injecteur") return "Injecteur " + eq.injecteurId;
          const ids = Array.isArray(eq.ids) ? eq.ids.join(", ") : "";
          return (types[eq.type] || eq.type) + " " + ids;
        });
        const equipLabel = parts.join(" • ") || "Équipement";
        if (typeof printFormulaire === "function") printFormulaire(plan, modele, equipLabel);
      };
      card.appendChild(btnPrint);
    }
  }

  // Bouton réalisé si échu ou aujourd'hui
  if (etat === "echu" || etat === "aujourdhui") {
    const validateRow = document.createElement("div");
    validateRow.className = "cal-plan-validate-row";

    const dateInput = document.createElement("input");
    dateInput.type = "date";
    dateInput.className = "date-input";
    const td = new Date();
    dateInput.value = [
      td.getFullYear(),
      String(td.getMonth() + 1).padStart(2, "0"),
      String(td.getDate()).padStart(2, "0")
    ].join("-");

    const valBtn = document.createElement("button");
    valBtn.type = "button";
    valBtn.className = "parts-action-btn parts-preventif-done-btn";
    valBtn.textContent = "✓ Réalisé";
    valBtn.onclick = (e) => {
      e.preventDefault();
      const dateVal = dateInput.value;
      plan.historiqueRealisations = plan.historiqueRealisations || [];
      plan.historiqueRealisations.push({
        date: dateVal,
        planifieDate: plan.prochaineEcheance
      });
      if (plan.recurrence === "ponctuel") {
        plan.statut = "terminé";
      } else {
        const next = calcProchaineDateEcheance(dateVal, plan.recurrence);
        plan.prochaineEcheance = next || plan.prochaineEcheance;
      }
      saveAll();
      renderCurrentState();
    };

    validateRow.appendChild(dateInput);
    validateRow.appendChild(valBtn);
    card.appendChild(validateRow);
  }

  // Historique (dernier)
  if (plan.historiqueRealisations && plan.historiqueRealisations.length > 0) {
    const last = plan.historiqueRealisations[plan.historiqueRealisations.length - 1];
    const histEl = document.createElement("div");
    histEl.className = "cal-plan-hist";
    histEl.textContent = `Dernière réalisation : ${formatDateFR(last.date)}`;
    card.appendChild(histEl);
  }

  return card;
}

/* ---- Vue CALENDRIER mensuel ---- */
function buildCalView(container, plans, annee, mois) {
  const cal = document.createElement("div");
  cal.className = "cal-grid-wrap";

  // En-têtes jours
  const joursSemaine = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const headsRow = document.createElement("div");
  headsRow.className = "cal-grid-heads";
  joursSemaine.forEach((j) => {
    const h = document.createElement("div");
    h.className = "cal-grid-head";
    h.textContent = j;
    headsRow.appendChild(h);
  });
  cal.appendChild(headsRow);

  const grid = document.createElement("div");
  grid.className = "cal-grid";

  const firstDay = new Date(annee, mois, 1);
  const lastDay = new Date(annee, mois + 1, 0);
  const today = new Date();
  const todayStr = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
  ].join("-");

  // Décalage : lundi = 0
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  // Jours vides avant le 1er
  for (let i = 0; i < startOffset; i++) {
    const empty = document.createElement("div");
    empty.className = "cal-day cal-day-empty";
    grid.appendChild(empty);
  }

  // Jours du mois
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const dateStr = [
      annee,
      String(mois + 1).padStart(2, "0"),
      String(day).padStart(2, "0")
    ].join("-");

    const dayPlans = plans.filter((p) => p.plan.prochaineEcheance === dateStr);

    const dayEl = document.createElement("div");
    dayEl.className = "cal-day";
    if (dateStr === todayStr) dayEl.classList.add("cal-day-today");
    if (dayPlans.some((p) => p.etat === "echu"))      dayEl.classList.add("cal-day-echu");
    else if (dayPlans.some((p) => p.etat === "aujourdhui")) dayEl.classList.add("cal-day-today");
    else if (dayPlans.length > 0) dayEl.classList.add("cal-day-futur");

    const numEl = document.createElement("span");
    numEl.className = "cal-day-num";
    numEl.textContent = day;
    dayEl.appendChild(numEl);

    // Points pour chaque plan
    if (dayPlans.length > 0) {
      const dots = document.createElement("div");
      dots.className = "cal-day-dots";
      dayPlans.slice(0, 3).forEach(({ plan, etat }) => {
        const dot = document.createElement("span");
        dot.className = `cal-dot cal-dot-${etat}`;
        dot.title = plan.nom;
        dots.appendChild(dot);
      });
      if (dayPlans.length > 3) {
        const more = document.createElement("span");
        more.className = "cal-dot-more";
        more.textContent = `+${dayPlans.length - 3}`;
        dots.appendChild(more);
      }
      dayEl.appendChild(dots);

      // Clic → popup liste du jour
      dayEl.style.cursor = "pointer";
      dayEl.onclick = () => showDayPopup(dateStr, dayPlans);
    }

    grid.appendChild(dayEl);
  }

  cal.appendChild(grid);
  container.appendChild(cal);
}

/* ---- Popup jour ---- */
function showDayPopup(dateStr, dayPlans) {
  const existing = document.getElementById("calDayPopup");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "calDayPopup";
  overlay.className = "history-overlay";

  const box = document.createElement("div");
  box.className = "history-box planif-box";

  const header = document.createElement("div");
  header.className = "planif-header";
  const title = document.createElement("h3");
  title.textContent = `Préventifs du ${formatDateFR(dateStr)}`;
  const close = document.createElement("button");
  close.type = "button";
  close.className = "cellule-history-large-close";
  close.textContent = "×";
  close.onclick = () => overlay.remove();
  header.appendChild(title);
  header.appendChild(close);
  box.appendChild(header);

  dayPlans.forEach(({ plan, etat }) => {
    box.appendChild(buildPlanCard(plan, etat));
  });

  overlay.appendChild(box);
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  document.body.appendChild(overlay);
}

/* ---- Utilitaire numéro de semaine ---- */
function getWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}
