<script lang="ts">
  import { hasRenderableRichText, sanitizeRichText } from '$lib/security/richTextSanitizer';

  type WrapperTag = 'div' | 'p' | 'span' | 'section';

  interface Props {
    html?: string | null;
    fallback?: string;
    as?: WrapperTag;
    class?: string;
    style?: string;
    plainTextFallback?: boolean;
    allowTaskListInput?: boolean;
  }

  let {
    html = '',
    fallback = '',
    as = 'div',
    class: className = '',
    style = '',
    plainTextFallback = true,
    allowTaskListInput = true,
  }: Props = $props();

  const sanitizedHtml = $derived(sanitizeRichText(html, { allowTaskListInput }));
  const shouldRenderHtml = $derived(hasRenderableRichText(sanitizedHtml, { allowTaskListInput }));
  const sanitizedFallback = $derived(
    plainTextFallback ? '' : sanitizeRichText(fallback, { allowTaskListInput })
  );
  const shouldRenderFallbackHtml = $derived(
    !plainTextFallback && hasRenderableRichText(sanitizedFallback, { allowTaskListInput })
  );
  const rootClassName = $derived(className ? `safe-rich-text ${className}` : 'safe-rich-text');
</script>

<!--
  Centralized, sanitized rich-text renderer.
  Direct `@html` outside this component is disallowed by the XSS-hardening
  coordination rules in `agent-coordination.md`.
-->
<svelte:element this={as} class={rootClassName} {style} data-safe-rich-text>
  {#if shouldRenderHtml}
    {@html sanitizedHtml}
  {:else if fallback}
    {#if shouldRenderFallbackHtml}
      {@html sanitizedFallback}
    {:else}
      {fallback}
    {/if}
  {/if}
</svelte:element>

<style>
  :global(.safe-rich-text p) {
    margin: 0;
  }

  :global(.safe-rich-text p + p) {
    margin-top: 0.75rem;
  }

  :global(.safe-rich-text ul) {
    list-style-type: disc;
    padding-left: 1.5rem;
    margin: 0.5rem 0;
  }

  :global(.safe-rich-text ol) {
    list-style-type: decimal;
    padding-left: 1.5rem;
    margin: 0.5rem 0;
  }

  :global(.safe-rich-text li) {
    margin: 0.15rem 0;
  }

  :global(.safe-rich-text li p) {
    margin: 0;
  }

  :global(.safe-rich-text ul ul) {
    list-style-type: circle;
  }

  :global(.safe-rich-text ul ul ul) {
    list-style-type: square;
  }

  :global(.safe-rich-text [data-type='taskList']) {
    list-style: none;
    padding-left: 0;
  }

  :global(.safe-rich-text [data-type='taskList'] li) {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
  }

  :global(.safe-rich-text [data-type='taskList'] li label) {
    margin-top: 0.25rem;
  }

  :global(.safe-rich-text [data-type='taskList'] li label input[type='checkbox']) {
    width: 1rem;
    height: 1rem;
    accent-color: var(--accent, #dc2626);
    cursor: default;
  }

  :global(.safe-rich-text blockquote) {
    border-left: 3px solid var(--accent, #dc2626);
    padding-left: 1rem;
    margin: 0.5rem 0;
    color: inherit;
  }

  :global(.safe-rich-text code) {
    background: var(--bg-secondary);
    border-radius: 0.25rem;
    padding: 0.15rem 0.3rem;
    font-size: 0.875rem;
  }

  :global(.safe-rich-text pre) {
    background: var(--bg-secondary);
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    margin: 0.5rem 0;
    overflow-x: auto;
  }

  :global(.safe-rich-text pre code) {
    background: none;
    padding: 0;
  }

  :global(.safe-rich-text h1) {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0.5rem 0;
  }

  :global(.safe-rich-text h2) {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0.5rem 0;
  }

  :global(.safe-rich-text h3) {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0.5rem 0;
  }

  :global(.safe-rich-text a) {
    color: var(--accent, #dc2626);
    text-decoration: underline;
    overflow-wrap: anywhere;
  }

  :global(.safe-rich-text hr) {
    border: none;
    border-top: 2px solid var(--border);
    margin: 1rem 0;
  }
</style>
