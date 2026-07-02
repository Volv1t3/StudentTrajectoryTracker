// Centralized rich-text HTML sanitizer.
//
// This is the single source of truth for the server-side HTML allowlist.
// It exists to neutralize XSS payloads in HTML-bearing fields (fields whose
// domain meaning is "rich text authored via the Tiptap editor") before they
// are persisted to the database.
//
// Do NOT scatter sanitizer configuration across controllers/validators.
// Do NOT implement allowlisting via regex — this uses `sanitize-html`
// (a real, actively maintained HTML sanitizer) which parses markup with a
// real parser (parse5-based) rather than pattern matching on strings.
//
// The allowlist below is derived from the Tiptap editor feature set in
// frontend/src/lib/components/ui/RichTextField.svelte, as mandated by
// agent-coordination.md ("Shared Allowlist Policy") and backend/agent-task.md
// ("Allowlist Source of Truth").
//
// This sanitizer sanitizes on WRITE. It does not replace render-time
// sanitization owned by the frontend SafeRichText component — both layers
// are required per the coordination contract's non-negotiable rules.

import sanitizeHtml from 'sanitize-html';

// Tags emitted by the current Tiptap configuration, plus the task-list
// structures Tiptap emits for checkbox lists.
const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'u',
  's',
  'blockquote',
  'ul',
  'ol',
  'li',
  'code',
  'pre',
  'hr',
  'h1',
  'h2',
  'h3',
  'a',
  'div',
  'span',
  'label',
  // Tiptap task list emits a plain `input[type=checkbox][disabled]` inside
  // `li[data-type=taskItem]`, so `input` must be allowed but tightly
  // constrained via `allowedAttributes` + `exclusiveFilter`/transform below.
  'input',
];

// Only the attributes actually needed by the allowed markup. Everything else
// (style, class, id, on*, etc.) is stripped by default because
// sanitize-html only keeps attributes explicitly listed here.
const ALLOWED_ATTRIBUTES = {
  a: ['href', 'rel', 'target'],
  ul: ['data-type'],
  li: ['data-type', 'data-checked'],
  input: ['type', 'disabled', 'checked'],
};

// Only http(s)/mailto links are preserved; javascript:, data:, etc. are
// stripped by sanitize-html's scheme allowlist (applies to href/src-like
// attributes registered in allowedSchemesByTag / allowedSchemes).
const ALLOWED_SCHEMES = ['http', 'https', 'mailto', 'tel'];

const options = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: ALLOWED_ATTRIBUTES,
  allowedSchemes: ALLOWED_SCHEMES,
  allowedSchemesByTag: {
    a: ALLOWED_SCHEMES,
  },
  // Never allow protocol-relative "javascript:"-style bypass via missing
  // scheme + relative resolution tricks.
  allowProtocolRelative: false,
  // Explicitly disallow style attributes / <style> tags anywhere, even if a
  // future allowedTags edit accidentally introduces them.
  allowedStyles: {},
  // Drop script/style contents entirely instead of leaving the text behind,
  // and the same for any other disallowed tag that could carry executable
  // payloads if only unwrapped.
  disallowedTagsMode: 'discard',
  nonTextTags: ['script', 'style', 'textarea', 'noscript', 'iframe', 'object', 'embed'],
  // Constrain the checkbox input Tiptap emits for task lists so it can only
  // ever be a disabled, non-interactive checkbox — never a form control that
  // could be repurposed, and never carrying event handler attributes.
  transformTags: {
    input: (tagName, attribs) => {
      if (attribs.type !== 'checkbox') {
        return { tagName: 'span', attribs: {} };
      }
      const normalizedAttribs = {
        type: 'checkbox',
        disabled: 'disabled',
      };
      if ('checked' in attribs) {
        normalizedAttribs.checked = 'checked';
      }
      return {
        tagName: 'input',
        attribs: normalizedAttribs,
      };
    },
    a: (tagName, attribs) => {
      const href = typeof attribs.href === 'string' ? attribs.href : '';
      if (!isAllowedHref(href)) {
        return { tagName: 'span', attribs: {} };
      }

      const normalizedAttribs = {
        href,
        rel: 'noopener noreferrer nofollow',
      };
      if (attribs.target === '_blank') {
        normalizedAttribs.target = '_blank';
      }

      return {
        tagName: 'a',
        attribs: normalizedAttribs,
      };
    },
  },
  enforceHtmlBoundary: true,
};

function normalizePlainText(value) {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/&nbsp;/gi, ' ');
}

function isAllowedHref(href) {
  if (typeof href !== 'string') return false;
  return /^(https?:|mailto:|tel:)/i.test(href.trim());
}

/**
 * Sanitize a rich-text HTML string against the Tiptap-derived allowlist.
 *
 * Strips <script>/<style>, inline event handler attributes (onerror,
 * onclick, etc.), javascript:/data: URLs, iframe/object/embed, and any
 * attribute not explicitly allowlisted. Preserves the harmless structural
 * markup produced by the current Tiptap editor (paragraphs, headings 1-3,
 * bold/italic/underline/strike, blockquotes, ordered/unordered/nested/task
 * lists, inline code, code blocks, hard breaks, links, horizontal rules).
 *
 * @param {string|null|undefined} value - raw HTML string, or null/undefined
 * @returns {string|null} sanitized HTML string, or null if input was null/undefined
 */
export function sanitizeRichText(value) {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') {
    throw new TypeError('sanitizeRichText expects a string, null, or undefined');
  }
  return sanitizeHtml(value, options);
}

export function sanitizePlainText(value) {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') {
    throw new TypeError('sanitizePlainText expects a string, null, or undefined');
  }

  const sanitized = sanitizeHtml(normalizePlainText(value), {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
    nonTextTags: ['script', 'style', 'textarea', 'noscript', 'iframe', 'object', 'embed'],
    enforceHtmlBoundary: true,
  });

  return sanitized
    .replace(/\u00a0/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export default sanitizeRichText;
