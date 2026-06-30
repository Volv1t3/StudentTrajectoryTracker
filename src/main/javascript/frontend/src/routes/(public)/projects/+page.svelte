<script lang="ts">
  import { Search } from 'lucide-svelte';
  import { capture } from '$lib/utils/posthog';
  import ProjectCard from '$lib/components/cards/ProjectCard.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import PageHero from '$lib/components/layout/PageHero.svelte';

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
          results_count: filteredProjects.length,
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

  let filteredProjects = $derived(data.projects.filter(p => {
    const matchesSearch = !searchQuery || p.nombre.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || (p.categorias ?? []).includes(selectedCategory);
    const matchesModalidad = !selectedModalidad || p.modalidad === selectedModalidad;
    const matchesStatus = !selectedStatus || p.estado === selectedStatus;
    return matchesSearch && matchesCategory && matchesModalidad && matchesStatus;
  }));
</script>

<svelte:head>
  <title>Proyectos — DLAB</title>
</svelte:head>

<PageHero
  title="Proyectos"
  subtitle="Descubre los proyectos activos en DLAB y encuentra dónde contribuir"
/>

<!-- Grid -->
<section class="bg-[--bg-secondary] py-10 md:py-14">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Filters -->
    <div class="flex flex-wrap gap-3 mb-8">
      <div class="relative flex-1 min-w-52">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted]" size={14} />
        <input
          type="text"
          placeholder="Buscar proyectos..."
          bind:value={searchQuery}
          oninput={handleSearch}
          class="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-[--border] bg-surface focus:ring-2 focus:ring-[--color-red] focus:outline-none"
        />
      </div>
      <select bind:value={selectedCategory} onchange={handleSearch} class="text-sm rounded-lg border border-[--border] bg-surface px-3 py-2.5 focus:ring-2 focus:ring-[--color-red] focus:outline-none cursor-pointer">
        <option value="">Todas las categorías</option>
        {#each data.categories as cat}
          <option value={cat}>{cat}</option>
        {/each}
      </select>
      <select bind:value={selectedStatus} onchange={handleSearch} class="text-sm rounded-lg border border-[--border] bg-surface px-3 py-2.5 focus:ring-2 focus:ring-[--color-red] focus:outline-none cursor-pointer">
        <option value="">Todos los estados</option>
        {#each data.statusOptions as status}
          <option value={status}>{status.replace('_', ' ')}</option>
        {/each}
      </select>
      <select bind:value={selectedModalidad} onchange={handleSearch} class="text-sm rounded-lg border border-[--border] bg-surface px-3 py-2.5 focus:ring-2 focus:ring-[--color-red] focus:outline-none cursor-pointer">
        <option value="">Todas las modalidades</option>
        <option value="Presencial">Presencial</option>
        <option value="Remoto">Remoto</option>
        <option value="Híbrido">Híbrido</option>
      </select>
    </div>

    {#if filteredProjects.length > 0}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each filteredProjects as project (project.id)}
          <div role="presentation" onclick={() => handleCardClick(project)}>
            <ProjectCard {project} />
          </div>
        {/each}
      </div>
    {:else}
      <EmptyState
        icon="Search"
        title="Sin resultados"
        description="No encontramos proyectos con esos filtros. Prueba con otros criterios."
        actionLabel="Limpiar filtros"
        actionOnClick={() => { searchQuery = ''; selectedCategory = ''; selectedStatus = ''; selectedModalidad = ''; }}
      />
    {/if}
  </div>
</section>
