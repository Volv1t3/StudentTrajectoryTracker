<script lang="ts">
  /**
   * FormErrorSummary — small, dismissable Spanish error banner intended for
   * top-level submit failures (business-rule violations, network errors,
   * or generic backend failures).
   *
   * Visual styling mirrors the toast styling already used in
   * `routes/(auth)/signup/+page.svelte`. Use this when you need the error
   * surfaced inline with the form rather than as a floating toast.
   */
  import { AlertCircle, X } from 'lucide-svelte';

  interface Props {
    /** The top-level Spanish message to display. Component renders nothing when empty. */
    message?: string | null;
    /** Optional flat field-error map (frontend-keyed) to render as a bullet list. */
    fields?: Record<string, string> | null;
    /** Called when the user clicks the dismiss button. If omitted, no dismiss button is shown. */
    onDismiss?: () => void;
  }

  let { message = '', fields = null, onDismiss }: Props = $props();

  let dismissed = $state(false);

  let fieldEntries = $derived(
    fields
      ? Object.entries(fields).filter(([, v]) => typeof v === 'string' && v.trim() !== '')
      : []
  );
  let contentKey = $derived(
    JSON.stringify({
      message: message?.trim() || '',
      fields: fieldEntries
    })
  );
  let show = $derived((!!(message && message.trim()) || fieldEntries.length > 0) && !dismissed);

  $effect(() => {
    contentKey;
    dismissed = false;
  });

  function handleDismiss() {
    dismissed = true;
    onDismiss?.();
  }
</script>

{#if show}
  <div
    role="alert"
    class="bg-red-800 dark:bg-red-950/5 border border-red-300 dark:border-red-800   text-red-500 rounded-lg p-3 relative pr-10"
  >
    <div class="flex items-start gap-2">
      <AlertCircle size={16} class="flex-shrink-0 mt-0.5" />
      <div class="text-sm leading-snug min-w-0 flex-1">
        {#if message}
          <p class="font-medium">{message}</p>
        {/if}
        {#if fieldEntries.length > 0}
          <ul class="mt-1 list-disc list-inside space-y-0.5">
            {#each fieldEntries as [, msg]}
              <li class="text-xs">{msg}</li>
            {/each}
          </ul>
        {/if}
      </div>
    </div>
    {#if onDismiss}
      <button
        type="button"
        onclick={handleDismiss}
        class="absolute top-2 right-2 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
        aria-label="Cerrar"
      >
        <X size={14} />
      </button>
    {/if}
  </div>
{/if}
