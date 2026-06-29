<script lang="ts">
  import { X } from 'lucide-svelte';
  import { fade, fly } from 'svelte/transition';

  interface Props {
    open: boolean;
    title: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    onclose: () => void;
    children?: import('svelte').Snippet;
    footer?: import('svelte').Snippet;
  }

  let { open, title, size = 'md', onclose, children, footer }: Props = $props();

  const maxWidth = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-4xl' };
</script>

{#if open}
  <div class="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4" transition:fade={{ duration: 200 }}>
    <div class="rounded-2xl shadow-2xl z-50 w-full {maxWidth[size]} max-h-[90vh] flex flex-col" transition:fly={{ y: 16, duration: 200 }} style="background: var(--bg-surface);">
      <header class="flex items-start justify-between p-6 pb-0 shrink-0">
        <h2 class="text-lg font-bold text-[--text-primary]">{title}</h2>
        <button onclick={onclose} class="text-[--text-muted] hover:text-[--text-secondary] transition-colors -mt-1">
          <X size={18} />
        </button>
      </header>
      <div class="px-6 py-4 overflow-y-auto min-h-0 flex-1">
        {@render children?.()}
      </div>
      {#if footer}
        <div class="flex justify-end gap-3 p-6 pt-4 border-t border-[--border] shrink-0">
          {@render footer()}
        </div>
      {/if}
    </div>
  </div>
{/if}
