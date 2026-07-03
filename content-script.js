(() => {
  if (window.__boogilyBoogilyLoaded) {
    return;
  }

  window.__boogilyBoogilyLoaded = true;

  const answers = {
    1: `לתשומת לבך ובהמשך לשיחתנו, בימים הקרובים ישלח אלייך למייל סקר על חווית השירות שקיבלת מאיתנו, נודה לך ששאם תוכל/י להקדיש מספר דקות ולענות עליו. דעתך חשובה לנו 😊`,
    2: `Following our conversation, a feedback survey will be e-mailed to you in the next coming days.

We thankaand answer it. Your opinion is important to us 😊`,
    3: `שימו לב שעליכם לספק את 4 הספרות האחרונות של הכרטיס שברצונכם שנטען.
אם לא תספקו אותן, הכרטיס המקושר לשם אשר מוצג בשיחת הוואטסאפ זה שייטען.תודה רבה, אנא אשר/י את ההצהרה:

תשלום התביעה מראש לכרטיס הפספורטכארד רילוקשיין שברשותך מתבצע על סמך המידע שמסרת לנו בשיחתנו. יש לשמור מסמכים רפואיים וקבלות. במידה ויתברר בעתיד כי המידע שנמסר אינו מלא או אינו נכון או שמידע שנדרש ממך לא הועבר אלינו בהתאם, או במקרה שהשירותים שנצרכו אינם מכוסים על פי תנאי הפוליסה, אנו מודיעים כי הכספים שהועברו לכרטיס, יגבו בחזרה על ידינו באמצעות אמצעי התשלום הקיים במערכות החברה. כמו כן, במידה ויידרש, נגבה השתתפות עצמית עפ"י תנאי הפוליסה.`,
    4: `Please note that you must provide the last 4 digits of the card you would like us to load.
If you do not provide them, the card linked to your name will be loaded.

Thank you. Please confirm the following statement:

The advance payment of the claim to your PassportCard Relocation card is based on the information you provided to us during our conversation. Medical documents and receipts must be kept.

If it is later found that the information provided was incomplete or incorrect, or that any information requested from you was not provided to us accordingly, or if the services received are not covered under the terms of the policy, please note that the funds transferred to the card will be collected back by us using the payment method registered in the company’s systems.

In addition, if required, a deductible will be charged in accordance with the terms of the policy.`,
    5: `שלום שמי יוגב :)
 נא לציין תעודת זהות ותאריך לידה
איך אוכל לסייע?`,
    6: `כמה רגעים בבקשה`,
    7: `האם אוכל לעזור במשהו נוסף? 🙏`
  };

  let armed = false;
  let armTimer = 0;
  let lastEditable = getEditable(document.activeElement);
  let lastTextSelection = null;
  let lastDomRange = null;

  document.addEventListener("focusin", (event) => {
    const editable = getEditable(event.target);

    if (editable) {
      lastEditable = editable;
      saveSelection(editable);
    }
  }, true);

  document.addEventListener("selectionchange", () => {
    const editable = getEditable(document.activeElement);

    if (editable) {
      lastEditable = editable;
      saveSelection(editable);
    }
  }, true);

  document.addEventListener("mouseup", rememberActiveSelection, true);
  document.addEventListener("keyup", rememberActiveSelection, true);

  document.addEventListener("keydown", (event) => {
    if (!armed || event.ctrlKey || event.altKey || event.metaKey) {
      return;
    }

    const answer = answers[event.key];

    if (!answer) {
      if (event.key === "Escape") {
        disarm();
      }
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();

    const target = getEditable(document.activeElement) || lastEditable;

    if (!target || !insertAnswer(target, answer)) {
      return;
    }

    disarm();
  }, true);

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === "BOOGILY_ARM") {
      armShortcuts();
      sendResponse({ armed: true });
      return;
    }

    if (message?.type === "BOOGILY_INSERT_TEXT" && typeof message.text === "string") {
      const target = getEditable(document.activeElement) || lastEditable;
      const inserted = Boolean(target && insertAnswer(target, message.text));
      sendResponse({ inserted });
    }
  });

  function rememberActiveSelection() {
    const editable = getEditable(document.activeElement);

    if (editable) {
      lastEditable = editable;
      saveSelection(editable);
    }
  }

  function armShortcuts() {
    const activeEditable = getEditable(document.activeElement);

    if (activeEditable) {
      lastEditable = activeEditable;
      saveSelection(activeEditable);
    }

    armed = true;
    window.clearTimeout(armTimer);
    restoreFocusAndSelection(lastEditable);
    armTimer = window.setTimeout(disarm, 12000);
  }

  function disarm() {
    armed = false;
    window.clearTimeout(armTimer);
  }

  function getEditable(node) {
    if (!node || node === document.body || node === document.documentElement) {
      return null;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      node = node.parentElement;
    }

    const editable = node.closest?.("textarea,input,[contenteditable='true'],[contenteditable=''],[role='textbox']");

    if (!editable || editable.disabled || editable.readOnly) {
      return null;
    }

    if (editable.tagName === "INPUT") {
      const type = (editable.getAttribute("type") || "text").toLowerCase();
      const textTypes = new Set(["email", "number", "password", "search", "tel", "text", "url"]);

      if (!textTypes.has(type)) {
        return null;
      }
    }

    return editable;
  }

  function saveSelection(editable) {
    if (isTextControl(editable)) {
      lastTextSelection = {
        element: editable,
        start: editable.selectionStart ?? editable.value.length,
        end: editable.selectionEnd ?? editable.value.length
      };
      return;
    }

    const selection = window.getSelection();

    if (selection?.rangeCount && editable.contains(selection.anchorNode)) {
      lastDomRange = selection.getRangeAt(0).cloneRange();
    }
  }

  function restoreFocusAndSelection(editable) {
    if (!editable) {
      return;
    }

    editable.focus({ preventScroll: true });

    if (isTextControl(editable) && lastTextSelection?.element === editable) {
      editable.setSelectionRange(lastTextSelection.start, lastTextSelection.end);
      return;
    }

    if (lastDomRange) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(lastDomRange.cloneRange());
    }
  }

  function insertAnswer(editable, text) {
    restoreFocusAndSelection(editable);

    if (isTextControl(editable)) {
      const start = editable.selectionStart ?? editable.value.length;
      const end = editable.selectionEnd ?? editable.value.length;
      editable.setRangeText(text, start, end, "end");
      editable.dispatchEvent(new InputEvent("input", {
        bubbles: true,
        composed: true,
        data: text,
        inputType: "insertText"
      }));
      editable.dispatchEvent(new Event("change", { bubbles: true }));
      saveSelection(editable);
      return true;
    }

    if (document.execCommand("insertText", false, text)) {
      editable.dispatchEvent(new InputEvent("input", {
        bubbles: true,
        composed: true,
        data: text,
        inputType: "insertText"
      }));
      saveSelection(editable);
      return true;
    }

    const selection = window.getSelection();

    if (!selection?.rangeCount) {
      return false;
    }

    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(text));
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    editable.dispatchEvent(new InputEvent("input", {
      bubbles: true,
      composed: true,
      data: text,
      inputType: "insertText"
    }));
    saveSelection(editable);
    return true;
  }

  function isTextControl(element) {
    return element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement;
  }
})();
