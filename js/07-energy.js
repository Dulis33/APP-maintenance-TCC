function createImageUploaderCard(title, currentImage, onSaveImage) {
  const card = document.createElement("div");
  card.className = "model-card";

  const h2 = document.createElement("h2");
  h2.textContent = title;
  card.appendChild(h2);

  const p = document.createElement("p");
  p.textContent = "Charge ici l’image qui servira de schéma commun.";
  card.appendChild(p);

  if (currentImage) {
    const img = document.createElement("img");
    img.src = currentImage;
    img.alt = title;
    img.className = "schema-upload-preview";
    card.appendChild(img);
  }

  const actions = document.createElement("div");
  actions.className = "model-actions";

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.className = "model-input";

  fileInput.onchange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onSaveImage(reader.result);
      saveAll();
      renderCurrentState();
    };
    reader.readAsDataURL(file);
  };

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "model-delete-button";
  removeBtn.textContent = "Supprimer l’image";
  removeBtn.onclick = () => {
    onSaveImage(null);
    saveAll();
    renderCurrentState();
  };

  actions.appendChild(fileInput);
  actions.appendChild(removeBtn);
  card.appendChild(actions);

  return card;
}

function createLockableInput(value, placeholder, onSave) {
  const wrap = document.createElement("div");
  wrap.className = "lockable-field";

  const input = document.createElement("input");
  input.className = "model-input";
  input.value = value || "";
  input.placeholder = placeholder;
  input.disabled = true;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "lock-toggle";
  btn.textContent = "Verrouillé";

  let unlocked = false;

  btn.onclick = () => {
    unlocked = !unlocked;

    input.disabled = !unlocked;
    btn.textContent = unlocked ? "Déverrouillé" : "Verrouillé";
    btn.className = unlocked ? "lock-toggle unlocked" : "lock-toggle";

    if (!unlocked) {
      onSave(input.value);
      saveAll();
    }
  };

  input.oninput = (e) => {
    if (!unlocked) {
      return;
    }

    onSave(e.target.value);
  };

  wrap.appendChild(input);
  wrap.appendChild(btn);

  return wrap;
}

function createEnergyField(label, inputElement) {
  const row = document.createElement("div");
  row.className = "energy-row";

  const lab = document.createElement("span");
  lab.className = "energy-label";
  lab.textContent = label;

  row.appendChild(lab);
  row.appendChild(inputElement);

  return row;
}

function updateEnergyDate(row, field, newDate, historyField) {
  if (!row || typeof row !== "object") {
    return;
  }

  if (!newDate) {
    row[field] = "";
    saveAll();
    return;
  }

  if (row[field] && row[field] !== newDate) {
    row[historyField] = pushUniqueHistoryDate(row[historyField], row[field]);
  }

  row[field] = newDate;
  saveAll();
}

function showEnergyHistoryPopup(row, type = "chgt") {
  const existing = document.getElementById("historyPopup");
  if (existing) {
    existing.remove();
  }

  const overlay = document.createElement("div");
  overlay.id = "historyPopup";
  overlay.className = "history-overlay";

  const box = document.createElement("div");
  box.className = "history-box";

  const title = document.createElement("h3");
  title.textContent =
    type === "defaut"
      ? "Historique des défauts constatés"
      : "Historique des changements";

  const list = document.createElement("div");
  list.className = "history-list";

  const historyArray =
    type === "defaut"
      ? Array.isArray(row?.historiqueDefaut)
        ? row.historiqueDefaut
        : []
      : Array.isArray(row?.historiqueChgt)
        ? row.historiqueChgt
        : [];

  if (historyArray.length === 0) {
    const item = document.createElement("div");
    item.className = "history-item";
    item.textContent = "Aucun historique.";
    list.appendChild(item);
  } else {
    historyArray.forEach((date) => {
      const item = document.createElement("div");
      item.className = "history-item history-item-row";

      const text = document.createElement("span");
      text.textContent = date;

      item.appendChild(text);
      list.appendChild(item);
    });
  }

  const close = document.createElement("button");
  close.type = "button";
  close.className = "history-close";
  close.textContent = "Fermer";
  close.onclick = () => overlay.remove();

  box.appendChild(title);
  box.appendChild(list);
  box.appendChild(close);
  overlay.appendChild(box);

  overlay.onclick = (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  };

  document.body.appendChild(overlay);
}

function createEnergyToggleButton(data) {
  const toggle = document.createElement("button");
  toggle.type = "button";

  function refreshToggle() {
    toggle.className = data.aChanger
      ? "toggle-flag-button critical active"
      : "toggle-flag-button critical";
    toggle.textContent = "HS";
  }

  toggle.onclick = () => {
    data.aChanger = data.aChanger !== true;
    saveAll();
    refreshToggle();
    renderCurrentState();
  };

  refreshToggle();
  return toggle;
}

function createEnergyDateField(data, field, historyField, label, historyType, historyTitle) {
  const wrap = document.createElement("div");
  wrap.className = "date-cell-wrap";

  const dateInput = document.createElement("input");
  dateInput.type = "date";
  dateInput.className = "date-input";
  dateInput.value = data[field] || "";
  dateInput.onchange = (e) => {
    updateEnergyDate(data, field, e.target.value, historyField);
    renderCurrentState();
  };

  const histBtn = document.createElement("button");
  histBtn.type = "button";
  histBtn.className = "history-btn";
  histBtn.textContent = "🕘";
  histBtn.title = historyTitle;
  histBtn.onclick = () => showEnergyHistoryPopup(data, historyType);

  wrap.appendChild(dateInput);
  wrap.appendChild(histBtn);

  return createEnergyField(label, wrap);
}

function createEnergyBlock(boxNumber, data) {
  const card = document.createElement("div");
  card.className = "energy-card";

  const title = document.createElement("h3");
  title.textContent = `EnergyBox / ${boxNumber}`;
  card.appendChild(title);

  card.appendChild(
    createEnergyField(
      "Emplacement",
      createLockableInput(data.emplacement, "Ex : Chariot 12", (val) => {
        data.emplacement = val;
      })
    )
  );

  card.appendChild(
    createEnergyField(
      "Article",
      createLockableInput(data.article, "Article tournant", (val) => {
        data.article = val;
      })
    )
  );

  card.appendChild(
    createEnergyDateField(
      data,
      "dateChgt",
      "historiqueChgt",
      "Date changement",
      "chgt",
      "Voir l’historique des changements"
    )
  );

  card.appendChild(
    createEnergyDateField(
      data,
      "dateDefaut",
      "historiqueDefaut",
      "Date défaut",
      "defaut",
      "Voir l’historique des défauts"
    )
  );

  card.appendChild(createEnergyField("À changer", createEnergyToggleButton(data)));

  return card;
}

function createPickupBlock(titleText, data) {
  const card = document.createElement("div");
  card.className = "energy-card";

  const title = document.createElement("h3");
  title.textContent = titleText;
  card.appendChild(title);

  card.appendChild(
    createEnergyField(
      "Emplacement",
      createLockableInput(data.emplacement, "Ex : cellule 10", (val) => {
        data.emplacement = val;
      })
    )
  );

  card.appendChild(
    createEnergyField(
      "Référence",
      createLockableInput(data.reference, "Référence", (val) => {
        data.reference = val;
      })
    )
  );

  card.appendChild(
    createEnergyDateField(
      data,
      "dateChgt",
      "historiqueChgt",
      "Date changement",
      "chgt",
      "Voir l’historique des changements"
    )
  );

  card.appendChild(createEnergyField("À changer", createEnergyToggleButton(data)));

  return card;
}

function getInjecteurIdsForSchemas() {
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

function createEmptyInjecteurSchemaEntry(current = null) {
  return {
    convoyeur: current?.convoyeur || null,
    motorisation: current?.motorisation || null
  };
}

function ensureInjecteurSchemas() {
  if (
    typeof window.SCHEMA_INJECTEUR_CONVOYEURS === "undefined" ||
    !window.SCHEMA_INJECTEUR_CONVOYEURS ||
    typeof window.SCHEMA_INJECTEUR_CONVOYEURS !== "object"
  ) {
    window.SCHEMA_INJECTEUR_CONVOYEURS = {};
  }

  getInjecteurIdsForSchemas().forEach((inj) => {
    if (
      !window.SCHEMA_INJECTEUR_CONVOYEURS[inj] ||
      typeof window.SCHEMA_INJECTEUR_CONVOYEURS[inj] !== "object"
    ) {
      window.SCHEMA_INJECTEUR_CONVOYEURS[inj] = {};
    }

    INJECTEUR_CONVOYEURS.forEach((conv) => {
      window.SCHEMA_INJECTEUR_CONVOYEURS[inj][conv.key] =
        createEmptyInjecteurSchemaEntry(
          window.SCHEMA_INJECTEUR_CONVOYEURS[inj][conv.key]
        );
    });
  });
}