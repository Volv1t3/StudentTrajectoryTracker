<script lang="ts">
  import { Sun, Moon } from 'lucide-svelte';
  import { theme, toggleTheme } from '$lib/utils/theme.svelte';

  interface Props {
    iconSize?: number;
    buttonClass?: string;
    buttonStyle?: string;
    showCurrentModeIcon?: boolean;
  }

  let {
    iconSize = 18,
    buttonClass = 'p-2 rounded-lg transition-colors cursor-pointer',
    buttonStyle = 'color: var(--text-secondary);',
    showCurrentModeIcon = true,
  }: Props = $props();

  const isDark = $derived(theme.isDark);
</script>

<button
  type="button"
  onclick={toggleTheme}
  class={buttonClass}
  style={buttonStyle}
  aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
>
  {#if showCurrentModeIcon}
    {#if isDark}
      <Moon size={iconSize} />
    {:else}
      <Sun size={iconSize} />
    {/if}
  {:else}
    {#if isDark}
      <Sun size={iconSize} />
    {:else}
      <Moon size={iconSize} />
    {/if}
  {/if}
</button>
