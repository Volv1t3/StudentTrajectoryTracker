<script lang="ts">
  import Button from './Button.svelte';

  interface Props {
    icon: string;
    title: string;
    description: string;
    actionLabel?: string;
    actionHref?: string;
    actionOnClick?: () => void;
  }

  let { icon, title, description, actionLabel, actionHref, actionOnClick }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center py-16 px-4 text-center">
  <div class="w-14 h-14 bg-[--bg-secondary] rounded-2xl flex items-center justify-center mb-4">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[--text-muted]">
      {#if icon === 'Search'}
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
      {:else if icon === 'CalendarOff'}
        <path d="M4.5 22h15"/><path d="M20 2H4a1 1 0 0 0-1 1v4.5a2.5 2.5 0 0 1-2.5 2.5H2"/><path d="m9 9 1.5 1.5"/><path d="m15 9 1.5 1.5"/><path d="M9.5 14a2.5 2.5 0 0 1 2.5-2.5h4"/><circle cx="11" cy="11" r="8"/>
      {:else if icon === 'ClipboardList'}
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
      {:else}
        <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
      {/if}
    </svg>
  </div>
  <h3 class="text-base font-semibold text-[--text-secondary]">{title}</h3>
  <p class="text-sm text-[--text-muted] mt-1 max-w-xs">{description}</p>
  {#if actionLabel && (actionHref || actionOnClick)}
    <Button
      variant="primary"
      href={actionHref}
      onclick={actionOnClick}
      label={actionLabel}
      classes="mt-6"
    />
  {/if}
</div>