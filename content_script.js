console.log("✅ content_script.js loaded");

// Only define once
if (!window.toggleSidebar) {
  window.toggleSidebar = function () {
    const existing = document.getElementById("eli5-sidebar");
    if (existing) {
      existing.remove();
      document.body.style.marginRight = "0"; // reset
      return;
    }

    const sidebar = document.createElement("div");
    sidebar.id = "eli5-sidebar";
    sidebar.style.position = "fixed";
    sidebar.style.top = "0";
    sidebar.style.right = "0";
    sidebar.style.width = "350px";
    sidebar.style.height = "100%";
    sidebar.style.background = "#000"; // Black background
    sidebar.style.color = "#fff"; // White text
    sidebar.style.boxShadow = "-2px 0 5px rgba(0,0,0,0.4)";
    sidebar.style.zIndex = "999999";
    sidebar.style.display = "flex";
    sidebar.style.flexDirection = "column";
    sidebar.style.fontFamily = "Arial, sans-serif";

    sidebar.innerHTML = `
      <!-- Header -->
      <div style="padding: 12px; border-bottom: 1px solid #333; display:flex; justify-content:space-between; align-items:center; background:#111;">
        <span style="font-weight:bold; color:#fff;">🧠 ELI5 & Summarizer</span>
        <button id="eli5-close" style="background:none; border:none; color:#fff; font-size:16px; cursor:pointer;">❌</button>
      </div>

      <!-- Info banner -->
      <div style="padding: 10px; font-size: 13px; background:#1a1a1a; border-bottom: 1px solid #333; color:#ccc;">
        ✨ Highlight text on the page or type into the box below. Then click <b style="color:#ff9800;">ELI5</b> or <b style="color:#ff9800;">Summarize</b>.  
      </div>

      <!-- Input -->
      <textarea id="eli5-input" style="flex:0.2; margin:10px; padding:10px; resize:none; border:1px solid #333; border-radius:6px; background:#111; color:#fff;" placeholder="Type or highlight text..."></textarea>

      <!-- Action buttons -->
      <div style="display:flex; gap:10px; margin:10px;">
        <button id="eli5-btn" style="flex:1; padding:10px; border:none; border-radius:6px; background:#ff9800; color:#fff; font-weight:bold; cursor:pointer;">ELI5</button>
        <button id="summarize-btn" style="flex:1; padding:10px; border:none; border-radius:6px; background:#ff9800; color:#fff; font-weight:bold; cursor:pointer;">Summarize</button>
      </div>

      <!-- Results -->
      <div style="flex:1; display:flex; flex-direction:column; margin:10px;">
        <div id="eli5-result" style="flex:1; overflow:auto; padding:10px; border:1px solid #333; border-radius:6px; background:#111; color:#fff;"></div>
        <button id="copy-result" style="margin-top:8px; padding:8px; border:none; border-radius:6px; background:#ff9800; color:#fff; font-weight:bold; cursor:pointer;">📋 Copy Result</button>
      </div>
    `;

    document.body.style.marginRight = "350px"; // shift page content
    document.body.appendChild(sidebar);

    // === Controls ===
    document.getElementById("eli5-close").onclick = () => {
      sidebar.remove();
      document.body.style.marginRight = "0"; // reset shift
    };

    // Load marked.js for Markdown support
    if (!window.marked) {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/marked/marked.min.js";
      document.head.appendChild(script);
    }

    function sendToBackground(action, text) {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action, text }, (response) => {
          resolve(response.result || "⚠️ No response");
        });
      });
    }

    function showLoading() {
      document.getElementById("eli5-result").innerHTML =
        '<div style="text-align:center; opacity:0.7;">⏳ Loading...</div>';
    }

    async function handleAction(action) {
      const input =
        document.getElementById("eli5-input").value ||
        window.getSelection().toString();
      if (!input) return alert("Please select text or type something!");
      showLoading();
      const result = await sendToBackground(action, input);
      if (window.marked) {
        document.getElementById("eli5-result").innerHTML = marked.parse(result);
      } else {
        document.getElementById("eli5-result").innerText = result;
      }
    }

    document.getElementById("eli5-btn").onclick = () => handleAction("eli5");
    document.getElementById("summarize-btn").onclick = () =>
      handleAction("summarize");

    // Copy button
    document.getElementById("copy-result").onclick = async () => {
      const text = document.getElementById("eli5-result").innerText;
      if (!text) return alert("No result to copy!");
      try {
        await navigator.clipboard.writeText(text);
        alert("✅ Result copied to clipboard!");
      } catch (err) {
        alert("❌ Failed to copy: " + err.message);
      }
    };
  };
}
