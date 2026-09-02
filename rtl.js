// Slack RTL (Hebrew) — injected into the Slack desktop app via CDP.
// Based on https://github.com/gregvish/slackrtl (Tampermonkey version).
(() => {
  'use strict';
  if (window.__slackRtl) return;
  window.__slackRtl = true;

  // Slack already resolves message direction itself (dir="auto" on message
  // blocks), but leaves the text left-aligned. This CSS right-aligns Hebrew
  // messages at first paint, so there is no visible "jump" after render.
  const CSS = [
    '.p-rich_text_section:dir(rtl),',
    '.p-rich_text_list:dir(rtl) {',
    '  text-align: right;',
    '}',
  ].join('\n');

  function addStyle() {
    if (document.getElementById('slack-rtl-style')) return;
    const style = document.createElement('style');
    style.id = 'slack-rtl-style';
    style.textContent = CSS;
    (document.head || document.documentElement).appendChild(style);
  }
  if (document.documentElement) {
    addStyle();
  } else {
    document.addEventListener('DOMContentLoaded', addStyle);
  }

  // Composer: toggle direction live in both directions while typing.
  // Leading whitespace/digits/punctuation followed by a Hebrew character.
  const HEBREW_LEAD = /^[\s\d"'()\[\]{}.,:;!?*_~-]*[֐-׿]/;

  document.addEventListener('keyup', (event) => {
    const editor = event.target && event.target.closest
      ? event.target.closest('.ql-editor')
      : null;
    if (!editor) return;
    if (typeof editor.innerText === 'string' && HEBREW_LEAD.test(editor.innerText)) {
      editor.style.setProperty('direction', 'rtl');
      editor.style.setProperty('text-align', 'right');
    } else {
      editor.style.setProperty('direction', 'ltr');
      editor.style.setProperty('text-align', 'left');
    }
  }, true);
})();
