<script lang="ts">
  import StatusBadge from '$lib/components/ui/StatusBadge.svelte';
  import Button from '$lib/components/ui/Button.svelte';

  interface Project {
    id: number;
    nombre: string;
    slug: string;
    categoria: string;
    estado: string;
    visible: boolean;
    pending_count: number;
  }

  interface Props {
    data: { projects: Project[]; warning?: string };
  }

  /**
   * Funcion que permite identificar administradores en base a si estan activos o no
   * @param status
   */
  function byStatus(status: string) {
    return data.projects.filter(c => c.estado === status);
  }

  let { data }: Props = $props();

  let estadoFilter = $state('');
  let filteredProjects = $derived(data.projects.filter(p => !estadoFilter || p.estado === estadoFilter));
</script>

<svelte:head>
  <title>Proyectos — Admin DLAB</title>
</svelte:head>

<div class="p-6 md:p-8">


  <header class="mb-6 flex flex-wrap items-center justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold text-[--text-primary]">proyectos</h1>
      <div class="flex flex-wrap gap-3 mt-4">
        <span class="text-sm  text-blue-700 px-2 py-1 rounded-full font-semibold" style="background-color: var(--bg-surface);">Activos: {byStatus('Activo').length}</span>
        <span class="text-sm  text-gray-700 px-2 py-1 rounded-full font-semibold" style="background-color: var(--bg-surface);">En Pausa: {byStatus('En pausa').length}</span>
        <span class="text-sm  text-green-700 px-2 py-1 rounded-full font-semibold" style="background-color: var(--bg-surface);">Completado: {byStatus('Completado').length}</span>
        <span class="text-sm text-yellow-700 px-2 py-1 rounded-full font-semibold" style="background-color: var(--bg-surface);">Próximos: {byStatus('Próximo').length}</span>
        <span class="text-sm  text-[--text-muted] px-2 py-1 rounded-full font-semibold" style="background-color: var(--bg-surface);">Archivado: {byStatus('Archivado').length}</span>
      <span class="text-sm text-primary px-2 py-1 rounded-full font-semibold" style="background-color: var(--bg-surface);">Total: {data.projects.length}</span>
    </div>
    </div>
    <Button variant="primary" href="/admin/projects/new" icon="Plus" label="Nuevo proyecto" />
  </header>

  {#if data.warning}
    <div class="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      {data.warning}
    </div>
  {/if}

  <div class="flex flex-wrap gap-3 mb-5">
    <select bind:value={estadoFilter} class="text-sm border border-[--border] rounded-lg px-3 py-2 bg-surface focus:ring-2 focus:ring-[--color-red] focus:outline-none cursor-pointer">
      <option value="">Todos los estados</option>
      <option value="Próximo">Próximo</option>
      <option value="Activo">Activo</option>
      <option value="En_Pausa">En pausa</option>
      <option value="Completado">Completado</option>
      <option value="Archivado">Archivado</option>
    </select>
  </div>

  <div class="bg-surface rounded-xl border border-[--border] overflow-x-auto">
    <table class="w-full text-sm">
      <thead class="bg-[--bg-secondary] border-b border-[--border] text-xs font-semibold text-[--text-muted] uppercase tracking-wide">
        <tr>
          <th class="px-4 py-3 text-left">Nombre</th>
          <th class="px-4 py-3 text-left">Categorías</th>
          <th class="px-4 py-3 text-left">Estado</th>
          <th class="px-4 py-3 text-center">Visible</th>
          <th class="px-4 py-3 text-center">Pendientes</th>
          <th class="px-4 py-3 text-left">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {#each filteredProjects as p (p.id)}
          <tr class="border-b border-[--border] hover:bg-[--bg-secondary] transition-colors">
            <td class="px-4 py-3 font-medium text-[--text-primary]">{p.nombre}</td>
            <td class="px-4 py-3 text-[--text-secondary]">{p.categoria}</td>
            <td class="px-4 py-3"><StatusBadge status={p.estado} /></td>
            <td class="px-4 py-3 text-center">
              <span class:text-green-600={p.visible} class:text-red-500={!p.visible}>{p.visible ? 'Sí' : 'No'}</span>
            </td>
            <td class="px-4 py-3 text-center">
              {#if p.pending_count > 0}
                <span class="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">{p.pending_count}</span>
              {:else}
                <span class="text-[--text-muted]">—</span>
              {/if}
            </td>
            <td class="px-2 py-3">
              <div class="flex gap-2">
                <Button variant="primary" size="md" href={`/admin/projects/${p.id}`} label="Editar" icon='Pen' classes='mr-6'/>
                <Button variant="primary" size="md" href={`/projects/${p.slug}`} target="_blank" label="Ver" icon='Eye'/>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
