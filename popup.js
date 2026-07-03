const grid = document.querySelector("#textGrid");

grid.addEventListener("click", async (event) => {
  const card = event.target.closest(".copy-card");

  if (card) {
    await insertFromCard(card);
  }
});

document.addEventListener("keydown", async (event) => {
  if (event.ctrlKey || event.altKey || event.metaKey) {
    return;
  }

  if (!/^[1-7]$/.test(event.key)) {
    return;
  }

  const card = grid.querySelector(`.copy-card:nth-of-type(${event.key})`);

  if (card) {
    event.preventDefault();
    await insertFromCard(card);
  }
});

async function insertFromCard(card) {
  const text = card.querySelector(".card-text").textContent;
  await insertIntoActiveTab(text);
  window.close();
}

async function insertIntoActiveTab(text) {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
  });

  if (!tab?.id) {
    return;
  }

  const message = {
    type: "BOOGILY_INSERT_TEXT",
    text
  };

  try {
    await chrome.tabs.sendMessage(tab.id, message);
    return;
  } catch (error) {
    // Try once for pages that were opened before the extension was reloaded.
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      files: ["content-script.js"]
    });
    await chrome.tabs.sendMessage(tab.id, message);
  } catch (error) {
    // Restricted pages do not allow insertion.
  }
}
