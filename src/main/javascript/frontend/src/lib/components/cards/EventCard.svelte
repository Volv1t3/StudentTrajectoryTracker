<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import { capture } from '$lib/utils/posthog';
  import MetaChip from '$lib/components/ui/MetaChip.svelte';
  import { Calendar } from 'lucide-svelte';
  import SafeRichText from '$lib/components/ui/SafeRichText.svelte';

  interface Event {
    id: number;
    nombre: string;
    slug: string;
    tipo: string;
    descripcion_corta: string;
    fecha_inicio: string;
    modalidad: string;
    cuota_maxima?: number;
  }

  interface Props {
    event: Event;
    past?: boolean;
  }

  let { event, past = false }: Props = $props();

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
  }

  function handleCardClick() {
    capture('event_card_clicked', {
      event_id: event.id,
      event_slug: event.slug,
      event_name: event.nombre,
      event_type: event.tipo,
      event_modality: event.modalidad,
      event_timing: past ? 'past' : 'upcoming',
      cta_type: 'view_event',
      route: '/events',
      route_group: 'public',
      source: 'frontend'
    });
  }
</script>

<article class="rounded-xl border border-[--border] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden" class:opacity-60={past} style="background: var(--bg-surface);">
  <div class="bg-[--color-red]  px-5 py-3 flex items-center justify-between">
    <span class="text-md font-heading flex items-center gap-2" style="color: var(--color-primary);">
      <Calendar size={14} />
      {formatDate(event.fecha_inicio)}
    </span>
    <span class="text-sm bg-white/20 px-2 py-0.5 rounded-full font-heading"> {event.tipo}</span>
  </div>
  <div class="p-6 flex flex-col flex-1">
    <h3 class="text-base font-bold text-[--text-primary] leading-snug">{event.nombre}</h3>
    <SafeRichText
      html={event.descripcion_corta}
      as="div"
      class="event-card-description text-sm text-[--text-secondary] mt-1.5 line-clamp-3 flex-1"
    />
    <div class="flex flex-wrap gap-2 mt-4">
      <MetaChip icon="MapPin" value={event.modalidad} />
      {#if event.cuota_maxima}
        <MetaChip icon="Users" value="{event.cuota_maxima} cupos" />
      {/if}
    </div>
    <footer class="mt-4 pt-4 border-t border-[--border]">
      <Button
        variant="outline"
        size="sm"
        href="/events/{event.slug}"
        label="Ver evento"
        fullWidth
        onclick={handleCardClick}
      />
    </footer>
  </div>
</article>

<style>
  :global(.event-card-description p) {
    display: inline;
    margin: 0;
  }
</style>
