document.getElementById("saveBtn").addEventListener("click", () => {
  const apiKey = document.getElementById("apiKey").value.trim();
  chrome.storage.sync.set({ apiKey }, () => {
    document.getElementById("status").textContent = "API key saved! Close page.";
    setTimeout(() => (document.getElementById("status").textContent = ""), 2000);
  });
});

// Load saved API key on page load
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get(["apiKey"], (result) => {
    if (result.apiKey) {
      document.getElementById("apiKey").value = result.apiKey;
    }
  });
});