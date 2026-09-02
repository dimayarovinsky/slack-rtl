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

  const HEBREW = /[֐-׿]/;
  const STRONG = /[A-Za-z֐-׿]/; // first directional character, Latin or Hebrew

  // True when the first strong character is Hebrew, ignoring mentions,
  // links, emoji, and code. This handles messages that START with a tag
  // like "@Someone" (Latin), which makes Slack's own auto-detection pick
  // LTR for an otherwise Hebrew message.
  function firstStrongIsHebrew(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        let el = node.parentElement;
        while (el && el !== root) {
          const cls = typeof el.className === 'string' ? el.className : '';
          if (/member|mention|broadcast|c-link|emoji/.test(cls)) {
            return NodeFilter.FILTER_REJECT;
          }
          if (el.tagName === 'A' || el.tagName === 'CODE' || el.tagName === 'PRE') {
            return NodeFilter.FILTER_REJECT;
          }
          el = el.parentElement;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    let node;
    while ((node = walker.nextNode())) {
      const match = node.nodeValue.match(STRONG);
      if (match) return HEBREW.test(match[0]);
    }
    return false;
  }

  // Fallback for messages the CSS misses: Slack marked them LTR because
  // they start with a mention/link, but the real text is Hebrew.
  function fixMixedMessages() {
    const elems = document.querySelectorAll(
      '.p-rich_text_section:not([data-rtl-checked]), .p-rich_text_list:not([data-rtl-checked])'
    );
    for (const el of elems) {
      el.dataset.rtlChecked = '1';
      if (getComputedStyle(el).direction === 'rtl') continue; // CSS handled it
      if (firstStrongIsHebrew(el)) {
        el.style.setProperty('direction', 'rtl');
        el.style.setProperty('text-align', 'right');
      }
    }
  }

  let pending = null;
  const observer = new MutationObserver(() => {
    if (pending) return;
    pending = setTimeout(() => {
      pending = null;
      fixMixedMessages();
    }, 200);
  });

  setTimeout(() => {
    observer.observe(document.body, { childList: true, subtree: true });
    fixMixedMessages();
  }, 1000);

  // Composer: toggle direction live in both directions while typing.
  document.addEventListener('keyup', (event) => {
    const editor = event.target && event.target.closest
      ? event.target.closest('.ql-editor')
      : null;
    if (!editor) return;
    if (firstStrongIsHebrew(editor)) {
      editor.style.setProperty('direction', 'rtl');
      editor.style.setProperty('text-align', 'right');
    } else {
      editor.style.setProperty('direction', 'ltr');
      editor.style.setProperty('text-align', 'left');
    }
  }, true);
})();
