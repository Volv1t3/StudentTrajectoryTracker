<script lang="ts">
  import { Search } from 'lucide-svelte';
  import StatusBadge from '$lib/components/ui/StatusBadge.svelte';
  import Button from '$lib/components/ui/Button.svelte';

  interface Colaborador {
    id: number;
    nombres: string;
    apellidos: string;
    correo_institucional: string;
    carrera_nombre: string;
    semestre: number;
    trajectory_status: string;
    created_at: string;
  }

  interface Props {
    data: { colaboradores: Colaborador[] };
  }

  let { data }: Props = $props();

  let statusFilter = $state('');
  let searchQuery = $state('');

  let filteredColaboradores = $derived(data.colaboradores.filter(c => {
    const matchesStatus = !statusFilter || c.trajectory_status === statusFilter;
    const matchesSearch = !searchQuery ||
      `${c.nombres} ${c.apellidos}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.correo_institucional.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  }));

  function byStatus(status: string) {
    return data.colaboradores.filter(c => c.trajectory_status === status);
  }

  function activeCount() {
    return data.colaboradores.filter(c => ['contactado', 'vinculado'].includes(c.trajectory_status)).length;
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
  }
</script>

<svelte:head>
  <title>Colaboradores — Admin DLAB</title>
</svelte:head>

<div class="p-6 md:p-8">
  <header class="mb-6">
    <h1 class="text-2xl font-bold text-[--text-primary]">Colaboradores</h1>
    <div class="flex flex-wrap gap-3 mt-4">
      <span class="text-sm  text-blue-700 px-2 py-1 rounded-full font-semibold" style="background-color: var(--bg-surface);">Nuevos: {byStatus('nuevo').length}</span>
      <span class="text-sm  text-yellow-700 px-2 py-1 rounded-full font-semibold" style="background-color: var(--bg-surface);">En revisión: {byStatus('en_revision').length}</span>
      <span class="text-sm  text-green-700 px-2 py-1 rounded-full font-semibold" style="background-color: var(--bg-surface);">Activos: {activeCount()}</span>
      <span class="text-sm text-primary px-2 py-1 rounded-full font-semibold" style="background-color: var(--bg-surface);">Total: {data.colaboradores.length}</span>
    </div>
  </header>

  <div class="flex flex-wrap gap-3 mb-5">
    <select bind:value={statusFilter} class="text-sm border border-[--border] rounded-lg px-3 py-2 bg-surface focus:ring-2 focus:ring-[--color-red] focus:outline-none">
      <option value="">Todos los estados</option>
      <option value="nuevo">Nuevo</option>
      <option value="en_revision">En revisión</option>
      <option value="contactado">Contactado</option>
      <option value="vinculado">Vinculado</option>
      <option value="inactivo">Inactivo</option>
    </select>
    <div class="relative flex-1 min-w-52">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted]" size={13} />
      <input type="text" bind:value={searchQuery} placeholder="Buscar por nombre o correo..." class="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-[--border] bg-surface focus:ring-2 focus:ring-[--color-red] focus:outline-none" />
    </div>
  </div>

  <div class="bg-surface rounded-xl border border-[--border] overflow-hidden">
    <table class="w-full text-sm">
      <thead class="bg-[--bg-secondary] border-b border-[--border] text-xs font-semibold text-[--text-muted] uppercase tracking-wide">
        <tr>
          <th class="px-4 py-3 text-left">Colaborador</th>
          <th class="px-4 py-3 text-left">Carrera</th>
          <th class="px-4 py-3 text-left">Sem.</th>
          <th class="px-4 py-3 text-left">Estado</th>
          <th class="px-4 py-3 text-left">Registrado</th>
          <th class="px-4 py-3 text-left">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {#each filteredColaboradores as c (c.id)}
          <tr class="border-b border-[--border] hover:bg-[--bg-secondary] transition-colors">
            <td class="px-4 py-3">
              <p class="font-medium text-[--text-primary]">{c.nombres} {c.apellidos}</p>
              <p class="text-xs text-[--text-muted]">{c.correo_institucional}</p>
            </td>
            <td class="px-4 py-3 text-[--text-secondary]">{c.carrera_nombre}</td>
            <td class="px-4 py-3 text-[--text-secondary]">{c.semestre}</td>
            <td class="px-4 py-3"><StatusBadge status={c.trajectory_status} /></td>
            <td class="px-4 py-3 text-xs text-[--text-muted]">{formatDate(c.created_at)}</td>
            <td class="px-4 py-3">
              <Button variant="primary" size="sm" href="/admin/colaboradores/{c.id}" label="Ver perfil" icon='User'/>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
