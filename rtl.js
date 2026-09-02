// Slack RTL (Hebrew) — injected into the Slack desktop app via CDP.
// Based on https://github.com/gregvish/slackrtl (Tampermonkey version).
(() => {
  'use strict';
  if (window.__slackRtl) return;
  window.__slackRtl = true;

  // Leading whitespace/digits/punctuation followed by a Hebrew character
  const HEBREW_LEAD = /^[\s\d"'()\[\]{}.,:;!?*_~-]*[֐-׿]/;

  function isRtlText(el) {
    return typeof el.innerText === 'string' && HEBREW_LEAD.test(el.innerText);
  }

  // Rendered messages: only ever flip TO rtl, never force ltr back
  // (avoids fighting Slack's own styles on non-Hebrew content).
  function fixMessages() {
    const elems = document.getElementsByClassName('p-rich_text_section');
    for (const el of elems) {
      if (el.dataset.rtlDone) continue;
      if (isRtlText(el)) {
        el.style.setProperty('direction', 'rtl');
        el.style.setProperty('text-align', 'right');
        el.dataset.rtlDone = '1';
      }
    }
  }

  // Composer: toggle live in both directions while typing.
  document.addEventListener('keyup', (event) => {
    const editor = event.target && event.target.closest
      ? event.target.closest('.ql-editor')
      : null;
    if (!editor) return;
    if (isRtlText(editor)) {
      editor.style.setProperty('direction', 'rtl');
      editor.style.setProperty('text-align', 'right');
    } else {
      editor.style.setProperty('direction', 'ltr');
      editor.style.setProperty('text-align', 'left');
    }
  }, true);

  // Debounced rescan on DOM changes (new messages, channel switches).
  let pending = null;
  const observer = new MutationObserver(() => {
    if (pending) return;
    pending = setTimeout(() => {
      pending = null;
      fixMessages();
    }, 200);
  });

  setTimeout(() => {
    observer.observe(document.body, { childList: true, subtree: true });
    fixMessages();
  }, 1000);
})();
