<script lang="ts">
  import { Sun, Moon } from 'lucide-svelte';

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

  let isDark = $state(false);

  function getPreferredTheme() {
    if (typeof window === 'undefined') return 'dark';

    const rootTheme = document.documentElement.getAttribute('data-theme');
    if (rootTheme === 'dark' || rootTheme === 'light') return rootTheme;

    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark' || storedTheme === 'light') return storedTheme;

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme: 'dark' | 'light') {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
    localStorage.setItem('theme', theme);
    isDark = theme === 'dark';
  }

  function toggleTheme() {
    applyTheme(isDark ? 'light' : 'dark');
  }

  $effect(() => {
    if (typeof window === 'undefined') return;
    isDark = getPreferredTheme() === 'dark';
  });
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
