<script lang="ts">
  import StatusBadge from '$lib/components/ui/StatusBadge.svelte';
  import Button from '$lib/components/ui/Button.svelte';

  interface Event {
    id: number;
    nombre: string;
    slug: string;
    tipo: string;
    estado: string;
    fecha_inicio: string;
    visible: boolean;
  }

  interface Props {
    data: { events: Event[] };
  }

  function byStatus(status: string) {
    return data.events.filter(e => e.estado === status);
  }

  let { data }: Props = $props();

  let estadoFilter = $state('');
  let filteredEvents = $derived(data.events.filter(e => !estadoFilter || e.estado === estadoFilter));
</script>

<svelte:head>
  <title>Eventos — Admin DLAB</title>
</svelte:head>

<div class="p-6 md:p-8">
  <header class="mb-6 flex flex-wrap items-center justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold text-[--text-primary]">Eventos</h1>
      <div class="flex flex-wrap gap-3 mt-4">
        <span class="text-sm text-blue-700 px-2 py-1 rounded-full font-semibold" style="background-color: var(--bg-surface);">Próximos: {byStatus('Próximo').length}</span>
        <span class="text-sm text-green-700 px-2 py-1 rounded-full font-semibold" style="background-color: var(--bg-surface);">Abiertos: {byStatus('Abierto').length}</span>
        <span class="text-sm text-purple-700 px-2 py-1 rounded-full font-semibold" style="background-color: var(--bg-surface);">En Curso: {byStatus('En_Curso').length}</span>
        <span class="text-sm text-gray-700 px-2 py-1 rounded-full font-semibold" style="background-color: var(--bg-surface);">Finalizados: {byStatus('Finalizado').length}</span>
        <span class="text-sm text-red-700 px-2 py-1 rounded-full font-semibold" style="background-color: var(--bg-surface);">Cancelados: {byStatus('Cancelado').length}</span>
        <span class="text-sm text-[--text-muted] px-2 py-1 rounded-full font-semibold" style="background-color: var(--bg-surface);">Total: {data.events.length}</span>
      </div>
    </div>
    <Button variant="primary" href="/admin/events/new" icon="Plus" label="Nuevo evento" />
  </header>

  <div class="flex flex-wrap gap-3 mb-5">
    <select bind:value={estadoFilter} class="text-sm border border-[--border] rounded-lg px-3 py-2 bg-surface focus:ring-2 focus:ring-[--color-red] focus:outline-none cursor-pointer">
      <option value="">Todos los estados</option>
      <option value="Próximo">Próximo</option>
      <option value="Abierto">Abierto</option>
      <option value="En_Curso">En Curso</option>
      <option value="Finalizado">Finalizado</option>
      <option value="Cancelado">Cancelado</option>
    </select>
  </div>

  <div class="bg-surface rounded-xl border border-[--border] overflow-x-auto">
    <table class="w-full text-sm">
      <thead class="bg-[--bg-secondary] border-b border-[--border] text-xs font-semibold text-[--text-muted] uppercase tracking-wide">
        <tr>
          <th class="px-4 py-3 text-left">Nombre</th>
          <th class="px-4 py-3 text-left">Tipo</th>
          <th class="px-4 py-3 text-left">Estado</th>
          <th class="px-4 py-3 text-left">Fecha</th>
          <th class="px-4 py-3 text-center">Visible</th>
          <th class="px-4 py-3 text-left">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {#each filteredEvents as e (e.id)}
          <tr class="border-b border-[--border] hover:bg-[--bg-secondary] transition-colors">
            <td class="px-4 py-3 font-medium text-[--text-primary]">{e.nombre}</td>
            <td class="px-4 py-3 text-[--text-secondary]">{e.tipo}</td>
            <td class="px-4 py-3"><StatusBadge status={e.estado} /></td>
            <td class="px-4 py-3 text-xs text-[--text-muted]">{new Date(e.fecha_inicio).toLocaleDateString()}</td>
            <td class="px-4 py-3 text-center">
              <span class:text-green-600={e.visible} class:text-red-500={!e.visible}>{e.visible ? 'Sí' : 'No'}</span>
            </td>
            <td class="px-4 py-3">
              <div class="flex gap-1">
                <Button variant="primary" size="sm" href="/admin/events/{e.id}" label="Editar" icon='Pen' classes='mr-6'/>
                <Button variant="primary" size="sm" href="/events/{e.slug}" target="_blank" label="Ver" icon='Eye' />
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
