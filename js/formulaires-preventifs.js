/* =====================================================
   FORMULAIRES PRÉVENTIFS
   - Rendu du formulaire dans l'équipement
   - Impression / PDF
   - Validation avec création d'anomalies
   - Historique des réponses
===================================================== */

/* ---- Rendu d'une section ---- */

function renderFormulaireSection(section, reponses) {
  const wrap = document.createElement("div");
  wrap.className = "form-section";

  const titre = document.createElement("div");
  titre.className = "form-section-titre";
  titre.textContent = section.titre;
  wrap.appendChild(titre);

  const body = document.createElement("div");
  body.className = "form-section-body";

  switch (section.type) {

    case "ok_nok": {
      body.appendChild(mkOkNok(section.id, reponses));
      break;
    }

    case "ok_nok_urgent": {
      const row = mkOkNok(section.id, reponses);
      body.appendChild(row);
      const urgRow = mkUrgent(section.id, reponses);
      urgRow.classList.add("form-conditioned");
      urgRow.style.display = reponses[section.id + "_val"] === "nok" ? "flex" : "none";
      body.appendChild(urgRow);
      // Afficher/masquer urgent selon NOK
      row.querySelectorAll("input[type=radio]").forEach((r) => {
        r.addEventListener("change", () => {
          urgRow.style.display = reponses[section.id + "_val"] === "nok" ? "flex" : "none";
        });
      });
      break;
    }

    case "ok_nok_multiple": {
      (section.items || []).forEach((item, idx) => {
        const itemKey = section.id + "_item" + idx;
        const itemRow = document.createElement("div");
        itemRow.className = "form-item-row";
        const lbl = document.createElement("span");
        lbl.className = "form-item-label";
        lbl.textContent = item;
        itemRow.appendChild(lbl);
        itemRow.appendChild(mkOkNok(itemKey, reponses, true));
        body.appendChild(itemRow);
      });
      break;
    }

    case "ok_nok_urgent_precision": {
      const row = mkOkNok(section.id, reponses);
      body.appendChild(row);
      const urgRow = mkUrgent(section.id, reponses);
      urgRow.classList.add("form-conditioned");
      urgRow.style.display = reponses[section.id + "_val"] === "nok" ? "flex" : "none";
      body.appendChild(urgRow);

      const precWrap = document.createElement("div");
      precWrap.className = "form-precisions form-conditioned";
      precWrap.style.display = reponses[section.id + "_val"] === "nok" ? "block" : "none";

      const precLabel = document.createElement("div");
      precLabel.className = "form-prec-label";
      precLabel.textContent = "Précisions :";
      precWrap.appendChild(precLabel);

      const precGrid = document.createElement("div");
      precGrid.className = "form-prec-grid";

      (section.precisions || []).forEach((prec, idx) => {
        const precKey = section.id + "_prec" + idx;
        const cb = document.createElement("label");
        cb.className = "form-checkbox-label";
        const input = document.createElement("input");
        input.type = "checkbox";
        input.checked = reponses[precKey] === true;
        input.onchange = () => { reponses[precKey] = input.checked; };
        cb.appendChild(input);
        cb.appendChild(document.createTextNode(" " + prec));

        if (prec === "Autre") {
          const autreKey = section.id + "_autre";
          const autreInput = document.createElement("input");
          autreInput.type = "text";
          autreInput.className = "model-input form-autre-input";
          autreInput.placeholder = "Préciser...";
          autreInput.value = reponses[autreKey] || "";
          autreInput.oninput = () => { reponses[autreKey] = autreInput.value; };
          precGrid.appendChild(cb);
          precGrid.appendChild(autreInput);
        } else {
          precGrid.appendChild(cb);
        }
      });

      precWrap.appendChild(precGrid);
      body.appendChild(precWrap);

      row.querySelectorAll("input[type=radio]").forEach((r) => {
        r.addEventListener("change", () => {
          const show = reponses[section.id + "_val"] === "nok";
          urgRow.style.display = show ? "flex" : "none";
          precWrap.style.display = show ? "block" : "none";
        });
      });
      break;
    }

    case "texte_libre": {
      const lines = section.lignes || 2;
      const ta = document.createElement("textarea");
      ta.className = "model-input form-textarea";
      ta.rows = lines;
      ta.placeholder = "Observations...";
      ta.value = reponses[section.id + "_texte"] || "";
      ta.oninput = () => { reponses[section.id + "_texte"] = ta.value; };
      body.appendChild(ta);
      break;
    }

    case "checkbox_liste": {
      (section.items || []).forEach((item, idx) => {
        const key = section.id + "_cb" + idx;
        const cb = document.createElement("label");
        cb.className = "form-checkbox-label";
        const input = document.createElement("input");
        input.type = "checkbox";
        input.checked = reponses[key] === true;
        input.onchange = () => { reponses[key] = input.checked; };
        cb.appendChild(input);
        cb.appendChild(document.createTextNode(" " + item));
        body.appendChild(cb);
      });
      break;
    }

    case "numerique": {
      const numWrap = document.createElement("div");
      numWrap.className = "form-num-wrap";
      const numInput = document.createElement("input");
      numInput.type = "number";
      numInput.className = "model-input form-num-input";
      numInput.value = reponses[section.id + "_num"] || "";
      numInput.oninput = () => { reponses[section.id + "_num"] = numInput.value; };
      numWrap.appendChild(numInput);
      body.appendChild(numWrap);
      break;
    }
  }

  wrap.appendChild(body);
  return wrap;
}

/* ---- Helpers radio OK/NOK ---- */

function mkOkNok(key, reponses, compact = false) {
  const row = document.createElement("div");
  row.className = compact ? "form-oknok-row compact" : "form-oknok-row";
  const name = "oknok_" + key + "_" + Date.now();

  ["ok", "nok"].forEach((val) => {
    const lbl = document.createElement("label");
    lbl.className = "form-radio-label form-radio-" + val;
    const input = document.createElement("input");
    input.type = "radio";
    input.name = name;
    input.value = val;
    input.checked = reponses[key + "_val"] === val;
    input.onchange = () => { reponses[key + "_val"] = val; };
    lbl.appendChild(input);
    lbl.appendChild(document.createTextNode(" " + val.toUpperCase()));
    row.appendChild(lbl);
  });

  return row;
}

function mkUrgent(key, reponses) {
  const row = document.createElement("div");
  row.className = "form-urgent-row";
  const lbl = document.createElement("span");
  lbl.className = "form-urgent-label";
  lbl.textContent = "Urgent ?";
  row.appendChild(lbl);
  const name = "urgent_" + key + "_" + Date.now();

  ["oui", "non"].forEach((val) => {
    const label = document.createElement("label");
    label.className = "form-radio-label form-radio-urgent-" + val;
    const input = document.createElement("input");
    input.type = "radio";
    input.name = name;
    input.value = val;
    input.checked = reponses[key + "_urgent"] === val;
    input.onchange = () => { reponses[key + "_urgent"] = val; };
    label.appendChild(input);
    label.appendChild(document.createTextNode(" " + val.charAt(0).toUpperCase() + val.slice(1)));
    row.appendChild(label);
  });

  return row;
}

/* ====================================================
   BLOC FORMULAIRE DANS L'ÉQUIPEMENT
==================================================== */

function createFormulaireBlock(plan, equipLabel) {
  if (!plan || !plan.formulaireId) return null;

  const modele = typeof getModeleFormulaire === "function"
    ? getModeleFormulaire(plan.formulaireId)
    : null;

  if (!modele) return null;

  const block = document.createElement("div");
  block.className = "planif-block-equipement form-block";

  // En-tête
  const head = document.createElement("div");
  head.className = "form-block-head";

  const headTitle = document.createElement("div");
  headTitle.className = "form-block-title";
  headTitle.textContent = `📝 ${modele.nom}`;

  const headMeta = document.createElement("div");
  headMeta.className = "form-block-meta";
  headMeta.textContent = `Échéance : ${typeof formatDateFR === "function" ? formatDateFR(plan.prochaineEcheance) : plan.prochaineEcheance}`;

  head.appendChild(headTitle);
  head.appendChild(headMeta);
  block.appendChild(head);

  // État du plan
  const echu = typeof isPlanEchu === "function" ? isPlanEchu(plan) : false;
  if (!echu) {
    const futur = document.createElement("div");
    futur.className = "form-futur-notice";
    futur.textContent = "Ce formulaire sera actif à partir de l'échéance.";
    block.appendChild(futur);
    return block;
  }

  // Réponses en cours (stockées dans le plan)
  if (!plan.reponsesEnCours) plan.reponsesEnCours = {};
  const reponses = plan.reponsesEnCours;

  // Sections du formulaire
  const sectionsWrap = document.createElement("div");
  sectionsWrap.className = "form-sections";

  modele.sections.forEach((section) => {
    sectionsWrap.appendChild(renderFormulaireSection(section, reponses));
  });

  block.appendChild(sectionsWrap);

  // Technicien
  const techRow = document.createElement("div");
  techRow.className = "form-tech-row";
  const techLabel = document.createElement("span");
  techLabel.className = "form-tech-label";
  techLabel.textContent = "Technicien :";
  const techInput = document.createElement("input");
  techInput.type = "text";
  techInput.className = "model-input form-tech-input";
  techInput.placeholder = "Nom du technicien";
  techInput.value = reponses._technicien || "";
  techInput.oninput = () => {
    reponses._technicien = techInput.value;
    saveAll();
  };
  techRow.appendChild(techLabel);
  techRow.appendChild(techInput);
  block.appendChild(techRow);

  // Boutons
  const btnsRow = document.createElement("div");
  btnsRow.className = "form-btns-row";

  // Sauvegarder brouillon
  const btnSave = document.createElement("button");
  btnSave.type = "button";
  btnSave.className = "back-button form-btn-save";
  btnSave.textContent = "💾 Sauvegarder";
  btnSave.onclick = (e) => {
    e.preventDefault();
    saveAll();
    btnSave.textContent = "✓ Sauvegardé";
    setTimeout(() => { btnSave.textContent = "💾 Sauvegarder"; }, 1500);
  };

  // Imprimer
  const btnPrint = document.createElement("button");
  btnPrint.type = "button";
  btnPrint.className = "back-button form-btn-print";
  btnPrint.textContent = "🖨 Imprimer";
  btnPrint.onclick = (e) => {
    e.preventDefault();
    printFormulaire(plan, modele, equipLabel);
  };

  // Valider
  const btnValider = document.createElement("button");
  btnValider.type = "button";
  btnValider.className = "parts-action-btn parts-preventif-done-btn form-btn-valider";
  btnValider.textContent = "✓ Valider et créer anomalies";
  btnValider.onclick = (e) => {
    e.preventDefault();
    validerFormulaire(plan, modele, reponses, equipLabel);
  };

  btnsRow.appendChild(btnSave);
  btnsRow.appendChild(btnPrint);
  btnsRow.appendChild(btnValider);
  block.appendChild(btnsRow);

  return block;
}

/* ====================================================
   VALIDATION — CRÉATION ANOMALIES
==================================================== */

function validerFormulaire(plan, modele, reponses, equipLabel) {
  const dateVal = (typeof getTodayDateString === "function")
    ? getTodayDateString()
    : new Date().toISOString().split("T")[0];

  const anomalies = [];

  modele.sections.forEach((section) => {
    if (section.anomalie === "aucune") return;

    let isNok = false;
    let detail = "";

    if (section.type === "ok_nok" || section.type === "ok_nok_urgent") {
      isNok = reponses[section.id + "_val"] === "nok";
    } else if (section.type === "ok_nok_urgent_precision") {
      isNok = reponses[section.id + "_val"] === "nok";
      if (isNok) {
        const precs = (section.precisions || []).filter((_, idx) =>
          reponses[section.id + "_prec" + idx] === true
        );
        if (precs.length > 0) detail = " (" + precs.join(", ") + ")";
        const autre = reponses[section.id + "_autre"];
        if (autre) detail += " — " + autre;
      }
    } else if (section.type === "ok_nok_multiple") {
      const nokItems = (section.items || []).filter((_, idx) =>
        reponses[section.id + "_item" + idx + "_val"] === "nok"
      );
      if (nokItems.length > 0) {
        isNok = true;
        detail = " (" + nokItems.join(", ") + ")";
      }
    }

    if (isNok) {
      const urgent = reponses[section.id + "_urgent"] === "oui";
      anomalies.push({
        section: section.titre + detail,
        type: urgent ? "critique" : section.anomalie,
        urgent
      });
    }
  });

  // Créer les anomalies dans le système de commentaires
  if (anomalies.length > 0 && typeof COMMENTS_GLOBAL !== "undefined") {
    const commentKey = typeof getGlobalCommentKey === "function"
      ? getGlobalCommentKey()
      : "global";

    anomalies.forEach((anomalie) => {
      const texte = `[${modele.nom}] ${anomalie.section}`;

      // Essayer d'ajouter dans les commentaires de l'équipement
      if (plan.equipements && plan.equipements.length > 0) {
        plan.equipements.forEach((eq) => {
          try {
            addAnomalieComment(eq, texte, anomalie.type, dateVal);
          } catch(e) {}
        });
      }
    });
  }

  // Sauvegarder les réponses dans l'historique
  if (!plan.historiqueRealisations) plan.historiqueRealisations = [];
  plan.historiqueRealisations.push({
    date: dateVal,
    technicien: reponses._technicien || "",
    reponses: { ...reponses },
    anomaliesCreees: anomalies.length,
    planifieDate: plan.prochaineEcheance
  });

  // Effacer le brouillon
  plan.reponsesEnCours = {};

  // Avancer l'échéance
  if (plan.recurrence === "ponctuel") {
    plan.statut = "terminé";
  } else {
    const next = typeof calcProchaineDateEcheance === "function"
      ? calcProchaineDateEcheance(dateVal, plan.recurrence)
      : null;
    if (next) plan.prochaineEcheance = next;
  }

  saveAll();

  const msg = anomalies.length > 0
    ? `✓ Validé — ${anomalies.length} anomalie(s) créée(s)`
    : "✓ Validé — Aucune anomalie";

  const toast = document.createElement("div");
  toast.className = "planif-toast";
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);

  if (typeof renderCurrentState === "function") renderCurrentState();
}

/* Créer une anomalie dans les commentaires de l'équipement */
function addAnomalieComment(eq, texte, typeAnomalie, date) {
  let store = null;
  let key = null;

  if (eq.type === "chariot" && Array.isArray(eq.ids)) {
    store = typeof COMMENTS_CHARIOTS !== "undefined" ? COMMENTS_CHARIOTS : null;
    if (store && typeof getChariotKey === "function") key = getChariotKey(eq.ids[0]);
  } else if (eq.type === "groupeMoteur" && Array.isArray(eq.ids)) {
    store = typeof COMMENTS_GROUPE_MOTEUR !== "undefined" ? COMMENTS_GROUPE_MOTEUR : null;
    if (store && typeof getGroupeMoteurKey === "function") key = getGroupeMoteurKey(eq.ids[0]);
  } else if (eq.type === "sortie" && Array.isArray(eq.ids)) {
    store = typeof COMMENTS_SORTIES !== "undefined" ? COMMENTS_SORTIES : null;
    if (store && typeof getSortieKey === "function") key = getSortieKey(eq.ids[0]);
  } else if (eq.type === "injecteur") {
    store = typeof COMMENTS_INJECTEURS !== "undefined" ? COMMENTS_INJECTEURS : null;
    const convKey = eq.convoyeurKey || (typeof INJECTEUR_CONVOYEURS !== "undefined" ? INJECTEUR_CONVOYEURS[0]?.key : null);
    if (store && typeof getInjecteurConvoyeurHeaderCommentKey === "function" && convKey) {
      key = getInjecteurConvoyeurHeaderCommentKey(eq.injecteurId, convKey);
    }
  }

  if (!store || !key) return;

  if (!Array.isArray(store[key])) store[key] = [];

  const newComment = typeof createEmptyCommentItem === "function"
    ? createEmptyCommentItem()
    : { date: "", constat: "", critique: false, aPrevoir: false };

  newComment.date = date;
  newComment.constat = texte;
  newComment.critique = typeAnomalie === "critique";
  newComment.aPrevoir = typeAnomalie === "aPrevoir";

  store[key].push(newComment);
}

/* ====================================================
   IMPRESSION
==================================================== */

function printFormulaire(plan, modele, equipLabel) {
  const dateStr = (typeof formatDateFR === "function")
    ? formatDateFR(plan.prochaineEcheance)
    : plan.prochaineEcheance;

  const today = new Date();
  const todayStr = today.toLocaleDateString("fr-FR");

  let html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>${modele.nom} — ${equipLabel}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 11pt; color: #000; margin: 15mm; }
  h1 { font-size: 14pt; margin-bottom: 4px; }
  .meta { font-size: 10pt; color: #444; margin-bottom: 12px; border-bottom: 1px solid #ccc; padding-bottom: 6px; }
  .meta-row { display: flex; gap: 30px; align-items: center; margin-bottom: 6px; }
  .meta-field { display: flex; align-items: center; gap: 8px; }
  .meta-field span { font-weight: bold; }
  .meta-field .line { border-bottom: 1px solid #000; width: 150px; height: 16px; display: inline-block; }
  .section { margin-bottom: 10px; border: 1px solid #ccc; border-radius: 4px; overflow: hidden; }
  .section-titre { background: #f0f0f0; padding: 6px 10px; font-weight: bold; font-size: 11pt; border-bottom: 1px solid #ccc; }
  .section-body { padding: 8px 12px; }
  .oknok-row { display: flex; gap: 20px; align-items: center; margin: 4px 0; }
  .oknok-box { display: inline-flex; align-items: center; gap: 5px; }
  .cb { width: 14px; height: 14px; border: 1px solid #000; display: inline-block; margin-right: 3px; }
  .item-row { display: flex; align-items: center; gap: 12px; margin: 3px 0; }
  .item-label { min-width: 130px; }
  .urgent-row { margin-left: 20px; color: #c00; font-size: 10pt; margin-top: 2px; }
  .prec-grid { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 4px; margin-left: 20px; }
  .prec-item { display: flex; align-items: center; gap: 4px; }
  .texte-libre { margin: 4px 0; }
  .texte-ligne { border-bottom: 1px solid #000; min-height: 18px; margin: 4px 0; }
  .footer { margin-top: 16px; padding-top: 8px; border-top: 1px solid #ccc; font-size: 9pt; color: #666; text-align: center; }
  @media print { body { margin: 10mm; } }
</style>
</head>
<body>
<h1>${modele.nom} — ${equipLabel}</h1>
<div class="meta">
  <div class="meta-row">
    <div class="meta-field"><span>Échéance :</span> ${dateStr}</div>
    <div class="meta-field"><span>Date réalisation :</span> <span class="line"></span></div>
  </div>
  <div class="meta-row">
    <div class="meta-field"><span>Technicien :</span> <span class="line"></span></div>
    <div class="meta-field"><span>Équipement :</span> ${equipLabel}</div>
  </div>
</div>`;

  modele.sections.forEach((section) => {
    html += `<div class="section">
<div class="section-titre">${section.titre}</div>
<div class="section-body">`;

    switch (section.type) {
      case "ok_nok":
        html += `<div class="oknok-row">
  <div class="oknok-box"><span class="cb"></span> OK</div>
  <div class="oknok-box"><span class="cb"></span> NOK</div>
</div>`;
        break;

      case "ok_nok_urgent":
        html += `<div class="oknok-row">
  <div class="oknok-box"><span class="cb"></span> OK</div>
  <div class="oknok-box"><span class="cb"></span> NOK</div>
</div>
<div class="urgent-row">Si NOK — Urgent ? <span class="cb"></span> Oui &nbsp; <span class="cb"></span> Non</div>`;
        break;

      case "ok_nok_multiple":
        (section.items || []).forEach((item) => {
          html += `<div class="item-row">
  <span class="item-label">${item} :</span>
  <div class="oknok-box"><span class="cb"></span> OK</div>
  <div class="oknok-box"><span class="cb"></span> NOK</div>
</div>`;
        });
        break;

      case "ok_nok_urgent_precision":
        html += `<div class="oknok-row">
  <div class="oknok-box"><span class="cb"></span> OK</div>
  <div class="oknok-box"><span class="cb"></span> NOK</div>
</div>
<div class="urgent-row">Si NOK — Urgent ? <span class="cb"></span> Oui &nbsp; <span class="cb"></span> Non</div>`;
        if (section.precisions && section.precisions.length > 0) {
          html += `<div class="prec-grid">`;
          section.precisions.forEach((prec) => {
            html += `<div class="prec-item"><span class="cb"></span> ${prec}</div>`;
          });
          html += `</div>`;
          html += `<div style="margin-top:4px;margin-left:20px;">Autre : <span style="border-bottom:1px solid #000;display:inline-block;width:120px;">&nbsp;</span></div>`;
        }
        break;

      case "texte_libre":
        html += `<div class="texte-libre">`;
        for (let i = 0; i < (section.lignes || 2); i++) {
          html += `<div class="texte-ligne">&nbsp;</div>`;
        }
        html += `</div>`;
        break;

      case "checkbox_liste":
        (section.items || []).forEach((item) => {
          html += `<div class="prec-item" style="margin:3px 0;"><span class="cb"></span> ${item}</div>`;
        });
        break;

      case "numerique":
        html += `<div>Valeur : <span style="border-bottom:1px solid #000;display:inline-block;width:80px;">&nbsp;</span></div>`;
        break;
    }

    html += `</div></div>`;
  });

  html += `<div class="footer">
  Imprimé le ${todayStr} — ${modele.nom} — ${equipLabel} — Formulaire généré par l'appli Suivi TCC et Transitique
</div>
</body>
</html>`;

  const w = window.open("", "_blank", "width=800,height=900");
  if (!w) { alert("Autorise les popups pour imprimer."); return; }
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); }, 400);
}
