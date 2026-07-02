<script lang="ts">
    import {LucideTableCellsMerge, Search} from 'lucide-svelte';
    import {capture} from '$lib/utils/posthog';
    import EventCard from '$lib/components/cards/EventCard.svelte';
    import EmptyState from '$lib/components/ui/EmptyState.svelte';
    import PaginationNav from '$lib/components/ui/PaginationNav.svelte';
    import PageHero from '$lib/components/layout/PageHero.svelte';
    import {page} from '$app/stores';
    import InfoRow from '$lib/components/ui/InfoRow.svelte';
    import {valuePropositionSchema} from '$lib/validation/content';
    import FormField from "$lib/components/ui/FormField.svelte";

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
        data: {
            upcomingEvents: Event[];
            pastEvents: Event[];
            meta: {
                page: number;
                limit: number;
                total: number;
            };
        };
    }

    let {data}: Props = $props();

    const EVENT_TYPES = ['Taller', 'Charla', 'Convocatoria', 'Hackatón', 'Día de Demostración', 'Visita', 'Otro'] as const;

    let searchQuery = $state('');
    let selectedType = $state('');
    let dateStart = $state('');
    let dateEnd = $state('');
    let dateError = $state('');

    let dateRangeValid = $derived.by(() => {
        if (!dateStart && !dateEnd) return true;
        if (dateStart && !dateEnd) return true;
        if (!dateStart && dateEnd) return true;

        const startDate = new Date(dateStart);
        const endDate = new Date(dateEnd);

        if (startDate > endDate) return false;
        if (startDate.getTime() === endDate.getTime()) return false;

        return true;
    });

    $effect(() => {
        if (!dateStart && !dateEnd) {
            dateError = '';
        } else if (dateStart && !dateEnd) {
            dateError = '';
        } else if (!dateStart && dateEnd) {
            dateError = '';
        } else {
            const startDate = new Date(dateStart);
            const endDate = new Date(dateEnd);
            if (startDate > endDate) {
                dateError = 'La fecha de inicio debe ser anterior a la fecha de fin';
            } else if (startDate.getTime() === endDate.getTime()) {
                dateError = 'Las fechas no pueden ser idénticas, debe haber diferencia en hora o minutos';
            } else {
                dateError = '';
            }
        }
    });

    let searchTimeout: ReturnType<typeof setTimeout>;

    function handleSearch() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const allEvents = [...data.upcomingEvents, ...data.pastEvents];
            const hasFilters = searchQuery || selectedType || dateStart || dateEnd;
            if (hasFilters && dateRangeValid) {
                capture('event_list_filtered', {
                    query: searchQuery || null,
                    type: selectedType || null,
                    date_start: dateStart || null,
                    date_end: dateEnd || null,
                    results_count: allEvents.length,
                    route: '/events',
                    route_group: 'public',
                    source: 'frontend'
                });
            }
        }, 600);
    }

    function matchesFilters(event: Event): boolean {
        if (!dateRangeValid) return false;

        const matchesSearch = !searchQuery || event.nombre.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = !selectedType || event.tipo === selectedType;

        let matchesDate = true;
        if (dateStart || dateEnd) {
            const eventDate = event.fecha_inicio ? new Date(event.fecha_inicio).getTime() : 0;
            if (dateStart) {
                matchesDate = matchesDate && eventDate >= new Date(dateStart).getTime();
            }
            if (dateEnd) {
                matchesDate = matchesDate && eventDate <= new Date(dateEnd).getTime();
            }
        }

        return matchesSearch && matchesType && matchesDate;
    }

    let filteredUpcoming = $derived(data.upcomingEvents.filter(matchesFilters));
    let filteredPast = $derived(data.pastEvents.filter(matchesFilters));

    function buildPageHref(nextPage: number) {
        const params = new URLSearchParams($page.url.searchParams);
        params.set('page', String(nextPage));
        const query = params.toString();
        return query ? `/events?${query}` : '/events';
    }
</script>

<svelte:head>
	<title>Eventos — DLAB</title>
</svelte:head>

<PageHero
	title="Eventos"
	subtitle="Talleres, convocatorias y actividades de DLAB"
/>

<!-- Filters -->
<section class="bg-surface py-6 border-b border-[--border]">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="grid grid-cols-2 gap-4">
			<!-- Row 1: Search bar -->
			<div class="flex flex-wrap">
				<InfoRow label='Filtrar eventos por su nombre' value='' icon='Info' classes='mb-1'/>
				<input
					type="text"
					placeholder="Buscar eventos..."
					bind:value={searchQuery}
					oninput={handleSearch}
					class="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-[--border] bg-surface focus:ring-2 focus:ring-[--color-red] focus:outline-none"/>
			</div>
			<!-- Row 1: Start date -->
			<div>
				<InfoRow icon="Calendar" label="Fecha de inicio del rango" value=""/>
				<input
					lang="en-GB"
					type="datetime-local"
					bind:value={dateStart}
					min="1900-01-01T00:00"
					max="2500-12-31T23:59"
					oninput={handleSearch}
					class="w-full mt-1 text-sm rounded-lg border border-[--border] bg-surface px-3 py-2.5 focus:ring-2 focus:ring-[--color-red] focus:outline-none cursor-pointer"
				/>
			</div>
			<!-- Row 2: Type filter -->
			<div>
				<InfoRow label='Filtrar eventos por su tipo' value='' icon='Info' classes='mb-1'/>
				<select bind:value={selectedType} onchange={handleSearch}
				        class="w-full text-sm rounded-lg border border-[--border] bg-surface px-3 py-2.5 focus:ring-2 focus:ring-[--color-red] focus:outline-none cursor-pointer">
					<option value="">Todos los tipos</option>
					{#each EVENT_TYPES as type}
						<option value={type}>{type}</option>
					{/each}
				</select>
			</div>
			<!-- Row 2: End date -->
			<div>
				<InfoRow icon="Calendar" label="Fecha de fin del rango" value="" classes="align-middle"/>
				<input
					lang="en-GB"
					type="datetime-local"
					bind:value={dateEnd}
					oninput={handleSearch}
					min="1900-01-01T00:00"
					max="2500-12-31T23:59"
					class="w-full mt-1 text-sm rounded-lg border border-[--border] bg-surface px-3 py-2.5 focus:ring-2 focus:ring-[--color-red] focus:outline-none cursor-pointer"
				/>
			</div>
		</div>
		{#if dateError}
			<p class="text-sm text-red-500 mt-2">{dateError}</p>
		{/if}
	</div>
</section>

<!-- Upcoming -->
{#if filteredUpcoming.length > 0}
<section class="bg-surface py-10 md:py-14">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each filteredUpcoming as event (event.id)}
					<EventCard {event}/>
				{/each}
			</div>
		<PaginationNav meta={data.meta} buildHref={buildPageHref} label="Eventos"/>
	</div>
</section>
{/if}

<!-- Past -->
{#if filteredPast.length > 0}
	<section class="bg-[--bg-secondary] py-10">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<h2 class="text-lg font-semibold text-[--text-muted] mb-6">Eventos pasados</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each filteredPast as event (event.id)}
					<EventCard {event} past={true}/>
				{/each}
			</div>
		</div>
	</section>
{/if}

<!-- Empty state -->
{#if filteredUpcoming.length === 0 && filteredPast.length === 0}
  <section class="bg-surface py-10 md:py-14">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <EmptyState
				icon="Search"
				title="Sin resultados"
				description="No encontramos proyectos con esos filtros. Prueba con otros criterios."
				actionLabel="Limpiar filtros"
				actionOnClick={() => { searchQuery = ''; selectedType = ''; dateStart = ''; dateEnd = ''; }}
			/>
    </div>
  </section>
{/if}