const OVERLAY_ID = "minha-bolha-politica-overlay";
const IFRAME_ID = "minha-bolha-politica-frame";
const CLOSE_ID = "minha-bolha-politica-close";

chrome.runtime.onMessage.addListener((message) => {
  if (message.type !== "OPEN_EXTENSION_OVERLAY") {
    return;
  }

  openOverlay();
});

function openOverlay() {
  const existingOverlay = document.getElementById(OVERLAY_ID);
  if (existingOverlay) {
    existingOverlay.classList.add("is-visible");
    const existingFrame = document.getElementById(
      IFRAME_ID,
    ) as HTMLIFrameElement | null;
    if (existingFrame) {
      existingFrame.src = chrome.runtime.getURL("popup.html");
    }
    return;
  }

  const overlay = document.createElement("div");
  overlay.id = OVERLAY_ID;
  overlay.className = "is-visible";

  const shell = document.createElement("div");
  shell.className = "minha-bolha-politica-shell";

  const closeButton = document.createElement("button");
  closeButton.id = CLOSE_ID;
  closeButton.type = "button";
  closeButton.className = "minha-bolha-politica-close";
  closeButton.textContent = "Fechar";
  closeButton.addEventListener("click", () => {
    overlay.remove();
  });

  const iframe = document.createElement("iframe");
  iframe.id = IFRAME_ID;
  iframe.className = "minha-bolha-politica-frame";
  iframe.src = chrome.runtime.getURL("popup.html");
  iframe.title = "Minha Bolha Política";
  iframe.setAttribute("allow", "clipboard-write");

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      overlay.remove();
    }
  });

  shell.appendChild(closeButton);
  shell.appendChild(iframe);
  overlay.appendChild(shell);
  document.documentElement.appendChild(overlay);
}
