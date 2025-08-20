chrome.action.onClicked.addListener(async (tab) => {
  try {
    // Step 1: Inject content_script.js
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content_script.js"],
    });
  } catch (e) {
    // Ignore if it's already injected
  }

  // Step 2: Directly run toggleSidebar() inside the page
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      // Call the global toggleSidebar if defined
      if (typeof window.toggleSidebar === "function") {
        window.toggleSidebar();
      } else {
        console.warn("⚠️ toggleSidebar not yet defined in page");
      }
    },
  });
});

// === API call handling ===
const MODEL = "accounts/sentientfoundation/models/dobby-unhinged-llama-3-3-70b-new";

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
   // Handle openOptionsPage from content script
    if (msg.action === "openOptionsPage") {
      if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      } else {
        window.open(chrome.runtime.getURL("options.html"));
      }
      return;
    }    

  if (msg.action === "eli5" || msg.action === "summarize") {
    chrome.storage.sync.get(["apiKey"], (result) => {
      const apiKey = result.apiKey;
      if (!apiKey) {
        sendResponse({ result: "❌ No API key set. Please set your API key in the extension options." });
        return;
      }
      fetch("https://api.fireworks.ai/inference/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 512,
          temperature: 0.6,
          messages: [
            {
              role: "system",
              content:
                msg.action === "eli5"
                  ? "Explain this like I'm five, using a friendly and playful tone. get rid of the aggression and swearing"
                  : "Summarize this text clearly and concisely in a professional tone. get rid of the aggression and swearing",
            },
            { role: "user", content: msg.text },
          ],
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          sendResponse({
            result:
              data.choices?.[0]?.message?.content || "⚠️ No response from model",
          });
        })
        .catch((err) => {
          sendResponse({ result: "❌ Error: " + err.message });
        });
    });
    return true; // keep async channel open
  }
});
