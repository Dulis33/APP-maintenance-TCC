function getSafeStateData() {
  return currentState && typeof currentState.data === "object" && currentState.data
    ? currentState.data
    : {};
}

function getDefaultInterventionEtatFilters() {
  return ["critical", "warning", "control", "defaut", "inhibee", "preventif"];
}

function getDefaultInterventionFamilleFilters() {
  if (typeof getInterventionDetailedFamilleFilters === "function") {
    return getInterventionDetailedFamilleFilters();
  }
  return ["cellule", "chariot", "groupeMoteur", "energybox", "injecteur", "sortie", "manuel"];
}

function goHomeState() {
  currentState = { type: "home", data: {} };
  renderHomeView();
}

function updateTopbarTitle() {
  const titleEl = document.querySelector(".topbar h1");
  if (!titleEl) {
    return;
  }

  if (!currentState || currentState.type === "home") {
    titleEl.textContent = "Tableau de bord";
    return;
  }

  if (currentState.type === "suiviHub") {
    titleEl.textContent = "Suivi TCC et Transitique";
    return;
  }

  titleEl.textContent = "Suivi TCC et Transitique";
}

function renderCurrentState() {
  clearView();
  updateTopbarTitle();

  if (!currentState) {
    updateHomeLegendBar();
    updateHomeCelluleBar();
    return;
  }

  const stateData = getSafeStateData();

  switch (currentState.type) {
    case "home":
      renderHomeView();
      break;

    case "suiviHub":
      renderSuiviHubView();
      break;

    case "tcc":
      renderTccView();
      break;

    case "trieur":
      renderTrieurView();
      break;

    case "train1":
      renderTrain1View();
      break;

    case "train2":
      renderTrain2View();
      break;

    case "energyTrain1":
      renderEnergyTrain1View();
      break;

    case "energyTrain2":
      renderEnergyTrain2View();
      break;

    case "energyCase":
      renderEnergyCaseView(stateData.boxNumber);
      break;

    case "groupeMoteur":
      renderGroupeMoteurView();
      break;

    case "groupeMoteurDetail":
      renderGroupeMoteurDetailView(stateData.groupNumber);
      break;

    case "chariot":
  renderChariotView(stateData.chariotNumber);
  break;

case "chariotPieces":
  renderChariotView(stateData.chariotNumber);
  break;

    case "cellule":
      renderCelluleView(stateData.celluleNumber, stateData.chariotNumber);
      break;

    case "celluleControleRoutine":
      renderCelluleControleRoutineView(
        stateData.celluleNumber,
        stateData.chariotNumber
      );
      break;

    case "celluleDefautForm":
      renderCelluleDefautFormView(
        stateData.celluleNumber,
        stateData.chariotNumber,
        stateData.jour
      );
      break;

    case "celluleInhibeeForm":
      renderCelluleInhibeeFormView(
        stateData.celluleNumber,
        stateData.chariotNumber
      );
      break;

    case "sortie":
      renderSortieView(stateData.sortieNumber);
      break;

    case "sorties":
      renderSortiesView();
      break;

    case "injecteurs":
      renderInjecteursView();
      break;

    case "injecteurDetail":
      renderInjecteurDetailView(stateData.injecteurNumber);
      break;

    case "injecteurConvoyeurs":
      renderInjecteurConvoyeursView(stateData.injecteurNumber);
      break;

    case "injecteurConvoyeurDetail":
      renderInjecteurConvoyeurDetailView(
        stateData.injecteurNumber,
        stateData.convoyeurKey
      );
      break;

    case "problematiquesActions":
      renderProblematiquesActionsView();
      break;

    case "problematiquesActionsArchive":
      renderProblematiquesActionsArchiveView();
      break;

    case "transitique":
      renderTransitiqueView();
      break;

    case "intervention":
      renderInterventionView(
        stateData.etatFilters || getDefaultInterventionEtatFilters(),
        stateData.showManualForm === true,
        stateData.familleFilters || getDefaultInterventionFamilleFilters()
      );
      break;

    case "cellulesTerrain":
      renderCellulesTerrainView(
        stateData.etatFilters || ["defaut", "inhibee", "control", "preventif"]
      );
      break;

    case "admin":
      renderAdminView();
      break;

    case "adminInjecteurs":
      renderAdminInjecteursView();
      break;

    case "adminInjecteurDetail":
      renderAdminInjecteurDetailView(stateData.injecteurNumber);
      break;

    case "adminInjecteurPieces":
      renderAdminInjecteurPiecesView(
        stateData.injecteurNumber,
        stateData.convoyeurKey
      );
      break;

    case "editModeleCellule":
      renderEditModeleCelluleView();
      break;

    case "editModeleChariot":
      renderEditModeleChariotView();
      break;

    case "editModeleGroupeMoteur":
      renderEditModeleGroupeMoteurView();
      break;

    case "editModeleSortie":
      renderEditModeleSortieView();
      break;

    case "secteurPF":
      renderSecteurPFView();
      break;

    case "secteurGF":
      renderSecteurGFView();
      break;

    default:
      goHomeState();
      break;
  }

  updateHomeLegendBar();
  updateHomeCelluleBar();
}

window.addEventListener("DOMContentLoaded", () => {
  try {
    if (typeof loadAll === "function") {
      const result = loadAll();

      if (result && typeof result.then === "function") {
        result
          .catch((error) => {
            console.error("Erreur lors du chargement initial :", error);
          })
          .finally(() => {
            setState("home");
            if (typeof showStartupImportReminder === "function") {
              setTimeout(showStartupImportReminder, 350);
            }
          });
        return;
      }
    } else {
      console.error("loadAll non disponible");
    }
  } catch (error) {
    console.error("Erreur lors de l'initialisation :", error);
  }

  setState("home");

  if (typeof showStartupImportReminder === "function") {
    setTimeout(showStartupImportReminder, 350);
  }
});