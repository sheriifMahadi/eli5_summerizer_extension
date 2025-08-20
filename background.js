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
const API_KEY = "fw_3ZPG1jXGGATmTwfuXJMfQQQx";
const MODEL = "accounts/sentientfoundation/models/dobby-unhinged-llama-3-3-70b-new";

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "eli5" || msg.action === "summarize") {
    fetch("https://api.fireworks.ai/inference/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
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
                ? "Explain this like I'm five."
                : "Summarize this text clearly and concisely.",
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

    return true; // keep async channel open
  }
});
