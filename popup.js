document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("toggle-panel");

  btn.addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content_script.js"]
    });

    chrome.tabs.sendMessage(tab.id, { action: "togglePanel" }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn("No response from content script:", chrome.runtime.lastError);
        return;
      }
      btn.textContent = response.open ? "Close Sidebar" : "Open Sidebar";
    });
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "panelClosed") {
      btn.textContent = "Open Sidebar";
    }
  });
});
