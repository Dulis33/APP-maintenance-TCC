const appView = document.getElementById("appView");

if (!appView) {
  throw new Error("Élément #appView introuvable dans le DOM.");
}

let currentState = null;
let adminUnlocked = false;

function formatGlobalErrorMessage(prefix, msg, error, line, col) {
  const safeMsg =
    msg ||
    (error && error.message) ||
    "Erreur inconnue";

  const parts = [prefix];

  if (typeof line === "number" && !Number.isNaN(line)) {
    parts.push(`ligne ${line}`);
  }

  if (typeof col === "number" && !Number.isNaN(col)) {
    parts.push(`colonne ${col}`);
  }

  parts.push(`: ${safeMsg}`);

  return parts.join(" ");
}

window.onerror = function (msg, url, line, col, error) {
  const details = formatGlobalErrorMessage("Erreur JS", msg, error, line, col);
  console.error("[window.onerror]", { msg, url, line, col, error });
  alert(details);
};

window.addEventListener("unhandledrejection", function (event) {
  const reason =
    event && event.reason
      ? event.reason instanceof Error
        ? event.reason.message
        : String(event.reason)
      : "Erreur inconnue";

  console.error("[unhandledrejection]", event && event.reason);
  alert("Promesse rejetée : " + reason);
});