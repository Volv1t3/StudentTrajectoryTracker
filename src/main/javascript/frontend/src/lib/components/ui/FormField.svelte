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
    children
  }: Props = $props();

  const baseClass = 'block w-full rounded-lg border px-3 py-2.5 text-sm text-[--text-primary] placeholder-[--text-muted] focus:outline-none focus:ring-2 focus:ring-[--color-red] focus:border-[--color-red] transition-colors duration-150';
  const errorClass = 'border-red-400';
  const normalClass = 'border-[--border]';
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
      bind:value
      class="{baseClass} {error ? errorClass : normalClass}"
      style="background: var(--bg-surface);"
    ></textarea>
  {:else if type === 'select'}
    <select
      {name}
      id={name}
      bind:value
      class="{baseClass} {error ? errorClass : normalClass} cursor-pointer"
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
      class="{baseClass} {error ? errorClass : normalClass}"
      style="background: var(--bg-surface);"
    />
  {/if}

  {#if hint && !error}
    <p class="mt-1 text-xs text-[--text-muted]">{hint}</p>
  {/if}
  {#if error}
    <p class="mt-1 text-xs text-red-500 flex items-center gap-1">
      <AlertCircle size={11} /> {error}
    </p>
  {/if}
</div>
