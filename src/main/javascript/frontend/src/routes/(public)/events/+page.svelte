<script lang="ts">
  import { capture } from '$lib/utils/posthog';
  import EventCard from '$lib/components/cards/EventCard.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import PageHero from '$lib/components/layout/PageHero.svelte';

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
    data: { upcomingEvents: Event[]; pastEvents: Event[] };
  }

  let { data }: Props = $props();

  $effect(() => {
    capture('event_list_viewed', {
      upcoming_count: data.upcomingEvents.length,
      past_count: data.pastEvents.length,
      total_count: data.upcomingEvents.length + data.pastEvents.length,
      route: '/events',
      route_group: 'public',
      source: 'frontend'
    });
  });
</script>

<svelte:head>
  <title>Eventos — DLAB</title>
</svelte:head>

<PageHero
  title="Eventos"
  subtitle="Talleres, convocatorias y actividades de DLAB"
/>

<!-- Upcoming -->
<section class="bg-surface py-10 md:py-14">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    {#if data.upcomingEvents.length > 0}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each data.upcomingEvents as event (event.id)}
          <EventCard {event} />
        {/each}
      </div>
    {:else}
      <EmptyState
        icon="CalendarOff"
        title="Sin eventos próximos"
        description="Vuelve pronto para ver nuevas actividades de DLAB."
      />
    {/if}
  </div>
</section>

<!-- Past -->
{#if data.pastEvents.length > 0}
  <section class="bg-[--bg-secondary] py-10">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 class="text-lg font-semibold text-[--text-muted] mb-6">Eventos pasados</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each data.pastEvents as event (event.id)}
          <EventCard {event} past={true} />
        {/each}
      </div>
    </div>
  </section>
{/if}
