/**
 * Centralized rich-text HTML sanitizer for render-time defense in depth.
 *
 * This module is the single source of truth for the frontend's HTML allowlist.
 * It exists because the backend sanitizes rich-text fields on write, but per
 * the XSS-hardening coordination contract (see
 * src/main/javascript/agent-coordination.md), sanitization on write does NOT
 * replace sanitization on render — both are required. Old rows written before
 * the backend sanitizer existed may still contain unsafe HTML, and defense in
 * depth requires the frontend to never trust stored HTML implicitly.
 *
 * The allowlist below is derived directly from the Tiptap extensions actually
 * enabled in `frontend/src/lib/components/ui/RichTextField.svelte`:
 *
 *   - StarterKit: paragraph, hardBreak, heading (levels 1-3), bold, italic,
 *     strike, blockquote, bulletList, orderedList, listItem, code,
 *     codeBlock, horizontalRule
 *   - @tiptap/extension-underline: <u>
 *   - @tiptap/extension-task-list / task-item (nested): <ul data-type="taskList">,
 *     <li data-type="taskItem" data-checked>, <input type="checkbox" disabled>
 *   - @tiptap/extension-link (openOnClick: false): <a href>
 *
 * Do not add tags/attributes here that are not backed by an active Tiptap
 * extension without updating this comment and the coordination doc.
 *
 * This is a real sanitizer library (DOMPurify via isomorphic-dompurify), not
 * regex-based stripping, per the initiative's non-negotiable rules.
 */
import DOMPurify from 'isomorphic-dompurify';
import type { Config } from 'dompurify';

/**
 * Tags emitted by the active Tiptap configuration in RichTextField.svelte.
 * Anything not in this list is stripped (but its safe inline text content,
 * if any, is preserved by DOMPurify's default unwrapping behavior).
 */
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
] as const;

/**
 * Attributes emitted by the active Tiptap configuration:
 *  - `href`, `rel`, `target` on <a> for the Link extension
 *  - `data-type`, `data-checked` on <ul>/<li> for TaskList/TaskItem
 *  - `type`, `disabled`, `checked` on the checkbox <input> rendered inside
 *    task items (Tiptap renders task item checkboxes as a plain, always
 *    non-interactive/disabled <input> in the persisted HTML)
 *
 * No `style`, `class`, `id`, `on*` or other attributes are allowed.
 */
const ALLOWED_ATTR = ['href', 'rel', 'target', 'data-type', 'data-checked', 'type', 'disabled', 'checked'];

/**
 * Tiptap task lists render as `<ul data-type="taskList">` containing
 * `<li data-type="taskItem">`, and DOMPurify's default tag allowlist does not
 * include a bare, attribute-driven `<input>` element for content (input is
 * normally form-only). We must explicitly allow `input` so the disabled
 * checkbox markup survives, but we restrict it hard via ALLOWED_ATTR plus the
 * uponSanitizeElement hook below so it can never become interactive or submit
 * to a form.
 */
const ALLOWED_TAGS_WITH_TASKLIST_INPUT = [...ALLOWED_TAGS, 'input', 'label'];

/** Only these URL schemes are allowed in href values. */
const SAFE_URL_SCHEMES = /^(https?:|mailto:|tel:)/i;

/**
 * DOMPurify hook: after any element is sanitized, enforce additional
 * per-element invariants that plain tag/attribute allowlisting cannot
 * express on its own (safe href schemes, hardened <a> attributes, and a
 * fully locked-down, non-interactive task-list checkbox).
 */
function registerHooks(purify: typeof DOMPurify): void {
  purify.addHook('uponSanitizeElement', (node: Node) => {
    if ((node as { nodeType?: number }).nodeType !== 1) return;

    const element = node as Element;
    const tag = element.tagName.toLowerCase();

    if (tag === 'a') {
      const href = element.getAttribute('href');
      if (href && !SAFE_URL_SCHEMES.test(href.trim())) {
        element.removeAttribute('href');
      }
      // Always force safe rel/target regardless of authored value.
      element.setAttribute('rel', 'noopener noreferrer nofollow');
      if (element.hasAttribute('target')) {
        element.setAttribute('target', '_blank');
      }
    }

    if (tag === 'input') {
      // Only allow the exact disabled checkbox shape Tiptap's task list emits.
      const isCheckbox = element.getAttribute('type') === 'checkbox';
      if (!isCheckbox) {
        element.remove();
        return;
      }
      // Strip every attribute and rebuild only the safe, non-interactive ones.
      const checked = element.hasAttribute('checked');
      Array.from(element.attributes).forEach((attr) => element.removeAttribute(attr.name));
      element.setAttribute('type', 'checkbox');
      element.setAttribute('disabled', '');
      if (checked) element.setAttribute('checked', '');
    }
  });
}

let hooksRegistered = false;

function ensureHooks(): void {
  if (hooksRegistered) return;
  registerHooks(DOMPurify);
  hooksRegistered = true;
}

export interface SanitizeOptions {
  /**
   * When true, allows the Tiptap task-list `<input type="checkbox" disabled>`
   * and its wrapping `<label>` through the allowlist. Defaults to true so
   * task lists render correctly; set to false for contexts that should never
   * render task-list markup.
   */
  allowTaskListInput?: boolean;
}

function getSanitizerConfig(options: SanitizeOptions = {}): Config {
  const { allowTaskListInput = true } = options;

  return {
    ALLOWED_TAGS: allowTaskListInput ? [...ALLOWED_TAGS_WITH_TASKLIST_INPUT] : [...ALLOWED_TAGS],
    ALLOWED_ATTR: [...ALLOWED_ATTR],
    // Explicitly forbidden regardless of ALLOWED_TAGS, in case a future
    // Tiptap extension change accidentally widens the tag list.
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'svg', 'math'],
    FORBID_ATTR: ['style', 'srcset', 'poster', 'formaction', 'autofocus', 'onerror', 'onload', 'onclick'],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    // Belt-and-suspenders against `javascript:`/`data:` executable URLs; the
    // uponSanitizeElement hook above also re-validates href schemes.
    ALLOWED_URI_REGEXP: SAFE_URL_SCHEMES,
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    WHOLE_DOCUMENT: false,
  };
}

/**
 * Sanitize a Tiptap-authored HTML string against the shared allowlist.
 *
 * Accepts null/undefined for convenience (fields may be unset) and always
 * returns a string. This function must be the only path used to sanitize
 * rich-text HTML before it is rendered via `@html` anywhere in the frontend.
 */
export function sanitizeRichText(html: string | null | undefined, options: SanitizeOptions = {}): string {
  if (!html) return '';

  ensureHooks();

  return DOMPurify.sanitize(html, getSanitizerConfig(options)).toString();
}

/**
 * Detect whether sanitized rich text still contains meaningful renderable
 * content. This lets the shared renderer fall back for values such as
 * `<p></p>` or content that sanitizes down to empty markup.
 */
export function hasRenderableRichText(html: string | null | undefined, options: SanitizeOptions = {}): boolean {
  const sanitized = sanitizeRichText(html, options);
  if (!sanitized) return false;

  ensureHooks();

  const fragment = DOMPurify.sanitize(sanitized, {
    ...getSanitizerConfig(options),
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: true,
  }) as unknown as DocumentFragment;

  const textContent = fragment.textContent?.replace(/\u00A0/g, ' ').trim() ?? '';
  if (textContent.length > 0) return true;

  return fragment.querySelector('hr, input[type="checkbox"]') !== null;
}
