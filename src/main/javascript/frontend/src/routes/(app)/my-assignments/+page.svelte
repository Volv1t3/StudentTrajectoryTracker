<script lang="ts">
  import { BriefcaseBusiness, Calendar, Search, UserRound } from 'lucide-svelte';
  import StatusBadge from '$lib/components/ui/StatusBadge.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import MetaChip from '$lib/components/ui/MetaChip.svelte';
  import AvailabilityPicker from '$lib/components/ui/AvailabilityPicker.svelte';

  type Tag = {
    id: number;
    name: string;
    slug: string;
    category: string;
    is_system?: boolean;
  };

type MeetingDay = {
  day_of_week: string;
  time_from: string;
  time_to: string;
  notes: string;
};

  type AssignmentCard = {
    id: number;
    project_id: number;
    project_title: string;
    project_slug: string;
    project_short_description: string;
    project_status: string;
    modality: string;
    role_label: string;
    status: string;
    assigned_at: string;
    ended_at: string | null;
    end_reason: string | null;
    meeting_days_summary: string;
    meeting_days: MeetingDay[];
    responsible_admin_name: string;
    responsible_admin_email: string | null;
    categories: Tag[];
    subcategories: Tag[];
  };

  interface Props {
    data: { assignments: AssignmentCard[] };
  }

  let { data }: Props = $props();

  let statusFilter = $state('');
  let searchQuery = $state('');

  const assignments = $derived(Array.isArray(data?.assignments) ? data.assignments : []);

  const filteredAssignments = $derived(
    assignments.filter((assignment) => {
      const matchesStatus = !statusFilter || assignment.status === statusFilter;
      const haystack = [
        assignment.project_title,
        assignment.responsible_admin_name,
      ].join(' ').toLowerCase();
      const matchesSearch = !searchQuery || haystack.includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    }),
  );

  const availableStatuses = $derived(
    [...new Set(assignments.map((assignment) => assignment.status).filter(Boolean))],
  );

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
</script>

<svelte:head>
  <title>Mis vinculaciones — DLAB</title>
</svelte:head>

<div class="max-w-10xl  max-h-10xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
  <header class="mb-8">
    <h1 class="text-2xl font-bold text-[--text-primary]">Mis vinculaciones</h1>
    <p class="text-[--text-muted] text-sm mt-0.5">Revisa tus proyectos asignados, tu rol y el estado actual de cada vinculación.</p>
  </header>

  {#if assignments.length > 0}
    <div class="flex flex-wrap gap-3 mb-6">
      <select bind:value={statusFilter} class="text-sm border border-[--border] rounded-lg px-3 py-2 bg-surface focus:ring-2 focus:ring-[--color-red] focus:outline-none">
        <option value="">Todos los estados</option>
        {#each availableStatuses as status}
          <option value={status}>{status}</option>
        {/each}
      </select>

      <div class="relative flex-1 min-w-52">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted]" size={13} />
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Buscar por proyecto o responsable..."
          class="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-[--border] bg-surface focus:ring-2 focus:ring-[--color-red] focus:outline-none"
        />
      </div>
    </div>

    <div class="space-y-4">
      {#each filteredAssignments as assignment (assignment.id)}
        <div class="bg-surface rounded-xl border border-[--border] p-5 hover:shadow-sm transition-shadow">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <h3 class="font-semibold text-[--text-primary] text-sm">
                <a href="/projects/{assignment.project_slug}" class="hover:text-[--color-red] transition-colors">
                  {assignment.project_title}
                </a>
              </h3>
              <p class="mt-1 text-xs text-[--text-muted]">{@html assignment.project_short_description}</p>
            </div>
            <StatusBadge status={assignment.status} />
          </div>

          <div class="mt-4 flex flex-wrap gap-2">
            <MetaChip icon="Tag" value={assignment.modality} />
            <MetaChip icon="Clock" value={assignment.meeting_days_summary} />
          </div>

          <div class="mt-4 grid gap-4 md:grid-cols-2">
            <div class="rounded-xl border border-[--border] bg-[--bg-secondary] p-4">
              <p class="text-xs font-semibold text-[--text-primary] mb-2 flex items-center gap-2">
                <BriefcaseBusiness size={14} /> Vinculación
              </p>
              <p class="text-sm text-[--text-secondary]"><span class="font-semibold">Rol:</span> {assignment.role_label}</p>
              <p class="text-sm text-[--text-secondary] mt-1"><span class="font-semibold">Asignado el:</span> {formatDate(assignment.assigned_at)}</p>
              {#if assignment.ended_at}
                <p class="text-sm text-[--text-secondary] mt-1"><span class="font-semibold">Finalizó el:</span> {formatDate(assignment.ended_at)}</p>
              {/if}
              {#if assignment.end_reason}
                <p class="mt-2 text-xs bg-blue-50 border border-blue-100 text-blue-800 rounded-lg px-3 py-2.5">
                  <span class="font-semibold">Motivo: </span>{@html assignment.end_reason}
                </p>
              {/if}
            </div>

            <div class="rounded-xl border border-[--border] bg-[--bg-secondary] p-4">
              <p class="text-xs font-semibold text-[--text-primary] mb-2 flex items-center gap-2">
                <UserRound size={14} /> Responsable
              </p>
              <p class="text-sm text-[--text-secondary]">{assignment.responsible_admin_name}</p>
              <p class="text-sm text-[--text-muted] mt-1">{assignment.responsible_admin_email || 'Sin correo registrado'}</p>
              <p class="text-sm text-[--text-secondary] mt-2"><span class="font-semibold">Estado del proyecto:</span> {assignment.project_status}</p>
            </div>
          </div>

          <div class="mt-4 rounded-xl border border-[--border] bg-[--bg-secondary] p-4">
            <p class="text-xs font-semibold text-[--text-primary] mb-3">Horario de reuniones del proyecto</p>
            <AvailabilityPicker value={assignment.meeting_days} readonly/>
            {#if assignment.meeting_days.length > 0}
              {#each assignment.meeting_days as day}
                <div class="rounded-xl border border-[--border] bg-surface px-3 py-2 text-sm mt-4 space-y-2">
                  <p class="font-medium text-[--text-primary]">{day.day_of_week}</p>
                  <p class="text-xs text-[--text-muted]">
                    {day.notes ? ` · ${day.notes}` : ''}
                  </p>
                </div>
              {/each}
            {:else}
              <p class="text-sm text-[--text-muted]">Sin reuniones registradas para este proyecto.</p>
            {/if}
          </div>

          <div class="mt-4 flex flex-wrap gap-1.5">
            {#if assignment.categories.length > 0}
              {#each assignment.categories as category}
                <span class="rounded-full border border-[--border] px-2 py-0.5 text-[11px] text-[--text-secondary]">{category.name}</span>
              {/each}
            {/if}
            {#if assignment.subcategories.length > 0}
              {#each assignment.subcategories as subcategory}
                <span class="rounded-full border border-[--border] px-2 py-0.5 text-[11px] text-[--text-secondary]">{subcategory.name}</span>
              {/each}
            {/if}
          </div>

          <p class="mt-3 text-xs text-[--text-muted] flex items-center gap-1">
            <Calendar size={11} /> Vinculación registrada el {formatDate(assignment.assigned_at)}
          </p>
        </div>
      {/each}
    </div>
  {:else}
    <EmptyState
      icon="ClipboardList"
      title="Sin vinculaciones aún"
      description="Cuando una solicitud sea aprobada o un administrador te vincule a un proyecto, aparecerá aquí."
      actionLabel="Ver proyectos"
      actionHref="/projects"
    />
  {/if}
</div>
