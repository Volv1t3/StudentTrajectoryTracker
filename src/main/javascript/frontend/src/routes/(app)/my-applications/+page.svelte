<script lang="ts">
  import { Calendar, Search } from 'lucide-svelte';
  import StatusBadge from '$lib/components/ui/StatusBadge.svelte';
  import MetaChip from '$lib/components/ui/MetaChip.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import Button from '$lib/components/ui/Button.svelte';

  interface Application {
    id: number;
    proyecto_nombre: string;
    proyecto_slug: string;
    categoria: string;
    modalidad: string;
    fecha_aplicacion: string;
    estado: string;
    mensaje_motivacion?: string;
    feedback_admin?: string;
  }

  interface Props {
    data: { applications: Application[] };
    form?: {
      error?: string;
    };
  }

  let { data, form }: Props = $props();

  let statusFilter = $state('');
  let categoryFilter = $state('');
  let searchQuery = $state('');

  const applications = $derived(Array.isArray(data?.applications) ? data.applications : []);

  const filteredApplications = $derived(
    applications.filter((app) => {
      const matchesStatus = !statusFilter || app.estado === statusFilter;
      const matchesCategory = !categoryFilter || app.categoria === categoryFilter;
      const matchesSearch = !searchQuery || app.proyecto_nombre.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesCategory && matchesSearch;
    }),
  );

  const availableStatuses = $derived(
    [...new Set(applications.map((app) => app.estado).filter(Boolean))],
  );

  const availableCategories = $derived(
    [...new Set(applications.map((app) => app.categoria).filter(Boolean))],
  );

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function canWithdraw(app: Application): boolean {
    return ['Pendiente', 'En_Revisión'].includes(app.estado);
  }
</script>

<svelte:head>
  <title>Mis solicitudes — DLAB</title>
</svelte:head>

<div class="max-w-10xl max-h-10xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
  <header class="mb-8">
    <h1 class="text-2xl font-bold text-[--text-primary]">Mis solicitudes</h1>
    <p class="text-[--text-muted] text-sm mt-0.5">Estado de tus aplicaciones a proyectos DLAB</p>
  </header>

  {#if form?.error}
    <div class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {form.error}
    </div>
  {/if}

  {#if applications.length > 0}
    <div class="flex flex-wrap gap-3 mb-6">
      <select bind:value={statusFilter} class="text-sm border border-[--border] rounded-lg px-3 py-2 bg-surface focus:ring-2 focus:ring-[--color-red] focus:outline-none">
        <option value="">Todos los estados</option>
        {#each availableStatuses as status}
          <option value={status}>{status}</option>
        {/each}
      </select>

      <select bind:value={categoryFilter} class="text-sm border border-[--border] rounded-lg px-3 py-2 bg-surface focus:ring-2 focus:ring-[--color-red] focus:outline-none">
        <option value="">Todas las categorías</option>
        {#each availableCategories as category}
          <option value={category}>{category}</option>
        {/each}
      </select>

      <div class="relative flex-1 min-w-52">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted]" size={13} />
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Buscar por nombre del proyecto..."
          class="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-[--border] bg-surface focus:ring-2 focus:ring-[--color-red] focus:outline-none"
        />
      </div>
    </div>

    <div class="space-y-4">
      {#each filteredApplications as app (app.id)}
        <div class="bg-surface rounded-xl border border-[--border] p-5 hover:shadow-sm transition-shadow">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h3 class="font-semibold text-[--text-primary] text-sm">
                <a href="/projects/{app.proyecto_slug}" class="hover:text-[--color-red] transition-colors">
                  {app.proyecto_nombre}
                </a>
              </h3>
              <p class="text-xs text-[--text-muted] mt-0.5 flex items-center gap-1">
                <Calendar size={11} /> Enviada el {formatDate(app.fecha_aplicacion)}
              </p>
              <MetaChip icon="Tag" value={app.categoria} classes="mt-2" />
            </div>
            <StatusBadge status={app.estado} />
          </div>
          {#if app.mensaje_motivacion}
            <p class="mt-3 text-xs text-[--text-secondary] bg-[--bg-secondary] rounded-lg px-3 py-2.5 leading-relaxed ">
              {@html app.mensaje_motivacion}
            </p>
          {/if}
          {#if app.feedback_admin}
            <p class="mt-2 text-xs bg-blue-50 border border-blue-100 text-blue-800 rounded-lg px-3 py-2.5">
              <span class="font-semibold">Nota del equipo: </span>{@html app.feedback_admin}
            </p>
          {/if}
          {#if canWithdraw(app)}
            <div class="mt-4 flex justify-end">
              <form method="POST" action="?/withdraw">
                <input type="hidden" name="id" value={app.id} />
                <Button
                  variant="outline"
                  size="sm"
                  type="submit"
                  icon="Undo2"
                  label="Retirar solicitud"
                />
              </form>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {:else}
    <EmptyState
      icon="ClipboardList"
      title="Sin solicitudes aún"
      description="Explora los proyectos activos y aplica a los que te interesen."
      actionLabel="Ver proyectos"
      actionHref="/projects"
    />
  {/if}
</div>
