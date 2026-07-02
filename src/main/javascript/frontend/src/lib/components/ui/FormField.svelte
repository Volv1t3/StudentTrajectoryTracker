<script lang="ts">
  import { AlertCircle } from 'lucide-svelte';

  interface Props {
    label?: string;
    name: string;
    type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'datetime-local' | 'url' | 'textarea' | 'select';
    error?: string;
    hint?: string;
    required?: boolean;
    placeholder?: string;
    value?: string | number;
    rows?: number;
    min?: number | string;
    max?: number | string;
    /**
     * Optional max-length hint. When set, a "current / counter" badge is
     * shown beneath the input and the `maxlength` attribute is applied to
     * `text`/`email`/`url`/`password`/`textarea` controls. This is purely
     * additive — existing call sites that omit `counter` are unaffected.
     */
    counter?: number;
    /**
     * Optional touched flag. When provided and `false`, error rendering is
     * suppressed so users don't see "required" before they've interacted
     * with the field. Existing call sites that omit `touched` keep their
     * current behavior (errors always rendered when `error` is set).
     */
    touched?: boolean;
    children?: import('svelte').Snippet;
  }

  let {
    label,
    name,
    type = 'text',
    error,
    hint,
    required = false,
    placeholder,
    value = $bindable(''),
    rows = 3,
    min,
    max,
    counter,
    touched,
    children
  }: Props = $props();

  const baseClass = 'block w-full rounded-lg border px-3 py-2.5 text-sm text-[--text-primary] placeholder-[--text-muted] focus:outline-none focus:ring-2 focus:ring-[--color-red] focus:border-[--color-red] transition-colors duration-150';
  const errorClass = 'border-red-400';
  const normalClass = 'border-[--border]';

  // Show errors when:
  //   - `touched` is undefined (preserve legacy behavior — show if `error`)
  //   - `touched` is true
  let showError = $derived((touched === undefined || touched === true) && !!error);

  let currentLength = $derived(
    typeof value === 'string' ? value.length : value == null ? 0 : String(value).length
  );
  let overLimit = $derived(typeof counter === 'number' && currentLength > counter);
</script>

<div class="space-y-1">
  {#if label}
    <label for={name} class="block text-md font-bold mb-1" style="font-family: var(--font-subheading);">
      {label}
      {#if required}<span class="text-red-500">*</span>{/if}
    </label>
  {/if}

  {#if type === 'textarea'}
    <textarea
      {name}
      id={name}
      {placeholder}
      {rows}
      maxlength={counter}
      bind:value
      class="{baseClass} {showError ? errorClass : normalClass}"
      style="background: var(--bg-surface);"
    ></textarea>
  {:else if type === 'select'}
    <select
      {name}
      id={name}
      bind:value
      class="{baseClass} {showError ? errorClass : normalClass} cursor-pointer"
      style="background: var(--bg-surface);"
    >
      {@render children?.()}
    </select>
  {:else}
    <input
      {type}
      {name}
      id={name}
      {placeholder}
      bind:value
      {min}
      {max}
      maxlength={type === 'text' || type === 'email' || type === 'url' || type === 'password' ? counter : undefined}
      class="{baseClass} {showError ? errorClass : normalClass}"
      style="background: var(--bg-surface);"
    />
  {/if}

  <div class="flex items-start justify-between gap-2">
    <div class="flex-1 min-w-0">
      {#if hint && !showError}
        <p class="mt-1 text-xs text-[--text-muted]">{hint}</p>
      {/if}
      {#if showError}
        <p class="mt-1 text-xs text-red-500 flex items-center gap-1">
          <AlertCircle size={11} /> {error}
        </p>
      {/if}
    </div>
    {#if typeof counter === 'number'}
      <p
        class="mt-1 text-xs flex-shrink-0 tabular-nums"
        class:text-red-500={overLimit}
        class:text-[--text-muted]={!overLimit}
      >
        {currentLength}/{counter}
      </p>
    {/if}
  </div>
</div>
