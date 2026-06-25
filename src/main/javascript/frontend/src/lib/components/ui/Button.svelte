<script lang="ts">
  import { Loader2 } from 'lucide-svelte';
  import * as icons from 'lucide-svelte';
  import type { Component } from 'svelte';

  interface Props {
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    href?: string;
    type?: 'button' | 'submit' | 'reset';
    loading?: boolean;
    disabled?: boolean;
    fullWidth?: boolean;
    icon?: string;
    label?: string;
    classes?: string;
    target?: string;
    onclick?: () => void;
  }

  let {
    variant = 'primary',
    size = 'md',
    href,
    type = 'button',
    loading = false,
    disabled = false,
    fullWidth = false,
    icon,
    label = '',
    classes = '',
    target,
    onclick
  }: Props = $props();

  const variantClasses = {
    primary: 'border-2 p-10 bg-[--text-primary] hover:bg-[--color-red-hover] text-md font-subheading rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-red] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0',
    secondary: 'bg-[--bg-secondary] hover:bg-[--border] text-[--text-primary] font-semibold rounded-lg transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[--text-muted]',
    outline: 'border-2 p-10 border-[--color-red] text-[--color-red] hover:bg-[--color-red] hover:text-white text-md font-subheading rounded-lg transition-all duration-200',
    ghost: 'text-[--text-secondary] hover:text-[--text-primary] hover:bg-[--bg-secondary] font-subheading rounded-lg transition-colors duration-150',
    danger: 'bg-[--color-danger] hover:bg-[--color-red-hover] text-white font-semibold rounded-lg transition-all duration-200 hover:shadow-md'
  };

  const sizeClasses = {
    sm: 'text-md px-6 py-2.5 gap-1.5',
    md: 'text-md px-6 py-2.5 gap-2',
    lg: 'text-lg px-12 py-3 gap-2.5'
  };

  let iconSize = $derived(size === 'sm' ? 14 : size === 'lg' ? 18 : 16);
  let IconComponent = $derived(icon ? (icons as unknown as Record<string, Component<{ size?: number }>>)[icon] : null);
  let baseClasses = $derived(`btn-grid flex items-center ${fullWidth ? 'w-full justify-center' : ''} ${variantClasses[variant]} ${sizeClasses[size]} ${classes}`);
</script>

{#if href}
  <a {href} {target} {onclick} class={baseClasses}>
    {#if loading}
      <Loader2 class="animate-spin" size={iconSize} />
    {:else if IconComponent}
      <IconComponent size={iconSize} />
    {/if}
    {label}
  </a>
{:else}
  <button {type} {disabled} {onclick} class={baseClasses}>
    {#if loading}
      <Loader2 class="animate-spin" size={iconSize} />
    {:else if IconComponent}
      <IconComponent size={iconSize} />
    {/if}
    {label}
  </button>
{/if}