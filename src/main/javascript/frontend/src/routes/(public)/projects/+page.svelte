<script lang="ts">
  import { Search } from 'lucide-svelte';
  import { capture } from '$lib/utils/posthog';
  import ProjectCard from '$lib/components/cards/ProjectCard.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import PaginationNav from '$lib/components/ui/PaginationNav.svelte';
  import PageHero from '$lib/components/layout/PageHero.svelte';
  import InfoRow from '$lib/components/ui/InfoRow.svelte';
  import { page } from '$app/stores';

  interface Project {
    id: number;
    nombre: string;
    slug: string;
    estado: string;
    categoria: string;
    categorias: string[];
    descripcion_corta: string;
    duracion_semanal: string | null;
    modalidad: string;
    habilidades_requeridas: string[];
    current_collaborator_count: number;
    max_collaborators: number | null;
  }

  interface Props {
    data: {
      projects: Project[];
      categories: string[];
      statusOptions: string[];
      selectedFilters: {
        tag: string;
        status: string;
        search: string;
        page: string;
      };
      archivedProjects: Project[];
      otherProjects: Project[];
      meta: {
        page: number;
        limit: number;
        total: number;
      };
    };
  }

  let { data }: Props = $props();

  let searchQuery = $state(data.selectedFilters.search || '');
  let selectedCategory = $state(data.selectedFilters.tag || '');
  let selectedModalidad = $state('');
  let selectedStatus = $state(data.selectedFilters.status || '');

  let searchTimeout: ReturnType<typeof setTimeout>;

  function handleSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      if (searchQuery || selectedCategory || selectedModalidad || selectedStatus) {
        capture('project_list_filtered', {
          query: searchQuery,
          category: selectedCategory || null,
          modality: selectedModalidad || null,
          status: selectedStatus || null,
          results_count: filteredActiveProjects.length,
          route: '/projects',
          route_group: 'public',
          source: 'frontend'
        });
      }
    }, 600);
  }

  function handleCardClick(project: Project) {
    capture('project_card_clicked', {
      project_id: project.id,
      project_slug: project.slug,
      project_name: project.nombre,
      route: '/projects',
      route_group: 'public',
      source: 'frontend'
    });
  }

  let filteredActiveProjects = $derived(data.otherProjects.filter(p => {
    const matchesSearch = !searchQuery || p.nombre.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || (p.categorias ?? []).includes(selectedCategory);
    const matchesModalidad = !selectedModalidad || p.modalidad === selectedModalidad;
    const matchesStatus = !selectedStatus || p.estado === selectedStatus;
    return matchesSearch && matchesCategory && matchesModalidad && matchesStatus;
  }));

  let filteredArchivedProjects = $derived(data.archivedProjects.filter(p => {
    const matchesSearch = !searchQuery || p.nombre.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || (p.categorias ?? []).includes(selectedCategory);
    const matchesModalidad = !selectedModalidad || p.modalidad === selectedModalidad;
    const matchesStatus = !selectedStatus || p.estado === selectedStatus;
    return matchesSearch && matchesCategory && matchesModalidad && matchesStatus;
  }));

  function buildPageHref(nextPage: number) {
    const params = new URLSearchParams($page.url.searchParams);
    params.set('page', String(nextPage));
    const query = params.toString();
    return query ? `/projects?${query}` : '/projects';
  }
</script>

<svelte:head>
  <title>Proyectos — DLAB</title>
</svelte:head>

<PageHero
  title="Proyectos"
  subtitle="Descubre los proyectos activos en DLAB y encuentra dónde contribuir"
/>

<!-- Filters -->
<section class="bg-surface py-6 border-b border-[--border]">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-2 gap-4">
      <div class="relative flex flex-wrap">
        <InfoRow icon="Search" label="Filtrar proyectos por su nombre" value="" classes="mb-1"/>
        <input
            type="text"
            placeholder="Buscar proyectos..."
            bind:value={searchQuery}
            oninput={handleSearch}
            class="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-[--border] bg-surface focus:ring-2 focus:ring-[--color-red] focus:outline-none"
        />
      </div>
      <div>
        <InfoRow icon="Tag" label="Filtrar proyectos por su categoría" value="" />
        <select bind:value={selectedCategory} onchange={handleSearch} class="w-full mt-1 text-sm rounded-lg border border-[--border] bg-surface px-3 py-2.5 focus:ring-2 focus:ring-[--color-red] focus:outline-none cursor-pointer">
          <option value="">Todas las categorías</option>
          {#each data.categories as cat}
            <option value={cat}>{cat}</option>
          {/each}
        </select>
      </div>
      <div>
        <InfoRow icon="Info" label="Filtrar proyectos por su estado" value="" />
        <select bind:value={selectedStatus} onchange={handleSearch} class="w-full mt-1 text-sm rounded-lg border border-[--border] bg-surface px-3 py-2.5 focus:ring-2 focus:ring-[--color-red] focus:outline-none cursor-pointer">
          <option value="">Todos los estados</option>
          {#each data.statusOptions as status}
            <option value={status}>{status.replace('_', ' ')}</option>
          {/each}
        </select>
      </div>
      <div>
        <InfoRow icon="MapPin" label="Filtrar proyectos por su modalidad" value="" />
        <select bind:value={selectedModalidad} onchange={handleSearch} class="w-full mt-1 text-sm rounded-lg border border-[--border] bg-surface px-3 py-2.5 focus:ring-2 focus:ring-[--color-red] focus:outline-none cursor-pointer">
          <option value="">Todas las modalidades</option>
          <option value="Presencial">Presencial</option>
          <option value="Remoto">Remoto</option>
          <option value="Híbrido">Híbrido</option>
        </select>
      </div>
    </div>
  </div>
</section>

{#if filteredActiveProjects.length > 0}
  <section class="bg-surface py-10 md:py-14">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each filteredActiveProjects as project (project.id)}
          <div role="presentation" onclick={() => handleCardClick(project)}>
            <ProjectCard {project} />
          </div>
        {/each}
      </div>
      <PaginationNav meta={data.meta} buildHref={buildPageHref} label="Proyectos" />
    </div>
  </section>
{/if}

{#if filteredArchivedProjects.length > 0}
  <section class="bg-[--bg-secondary] py-10">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 class="text-lg font-semibold text-[--text-muted] mb-6">Proyectos Pasados</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each filteredArchivedProjects as project (project.id)}
          <div role="presentation" onclick={() => handleCardClick(project)}>
            <ProjectCard {project} />
          </div>
        {/each}
      </div>
      <PaginationNav meta={data.meta} buildHref={buildPageHref} label="Proyectos" />
    </div>
  </section>
{/if}

{#if filteredActiveProjects.length === 0 && filteredArchivedProjects.length === 0}
  <section class="bg-surface py-10 md:py-14">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <EmptyState
          icon="Search"
          title="Sin resultados"
          description="No encontramos proyectos con esos filtros. Prueba con otros criterios."
          actionLabel="Limpiar filtros"
          actionOnClick={() => { searchQuery = ''; selectedCategory = ''; selectedStatus = ''; selectedModalidad = ''; }}
      />
    </div>
  </section>
{/if}