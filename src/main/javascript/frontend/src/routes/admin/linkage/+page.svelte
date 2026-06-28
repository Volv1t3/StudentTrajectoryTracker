<script lang="ts">
  import {
    Search,
  } from 'lucide-svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import StatusBadge from '$lib/components/ui/StatusBadge.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import RichTextField from '$lib/components/ui/RichTextField.svelte';
  import type { AssignmentRow, AssignmentStatus, AssignmentSummary } from '$lib/types';

  type ProjectTag = {
    id: number;
    name: string;
    slug: string;
    category: string;
    is_system?: boolean;
  };

  type ProjectSkill = {
    id?: number;
    name: string;
    slug?: string;
  };

  type MeetingDay = {
    id?: number;
    day_of_week: string;
    start_time: string;
    end_time: string;
    notes?: string | null;
  };

  type ProjectOption = {
    id: number;
    title: string;
    slug: string;
    short_description: string;
    full_description: string;
    target_audience: string | null;
    required_skills: string | null;
    required_skill_items: ProjectSkill[];
    meeting_days: MeetingDay[];
    meeting_days_summary: string;
    max_collaborators: number | null;
    current_collaborator_count: number;
    status: string;
    categories: ProjectTag[];
    subcategories: ProjectTag[];
    responsible_admin_id: number | null;
    responsible_admin_name: string;
    responsible_admin_email: string | null;
  };

  type CollaboratorTag = {
    id: number;
    name: string;
    category?: string;
  };

  type AvailabilitySlot = {
    day_of_week: string;
    time_from: string;
    time_to: string;
    notes?: string | null;
  };

  type CollaboratorOption = {
    id: number;
    first_name: string;
    middle_name: string;
    last_name: string;
    second_last_name: string;
    full_name: string;
    personal_email: string;
    usfq_email: string;
    phone_number: string;
    major: string;
    current_university_year: number | null;
    expected_graduation_year: number | null;
    experience_description: string;
    motivation_description: string;
    trajectory_status: string;
    tags: CollaboratorTag[];
    availability_slots: AvailabilitySlot[];
  };

  interface Props {
    data: {
      linkages: AssignmentRow[];
      summary: AssignmentSummary;
      projects: ProjectOption[];
      collaborators: CollaboratorOption[];
    };
    form?: {
      scope?: 'manual' | 'edit';
      assignmentId?: number;
      error?: string;
    };
  }

  let { data, form }: Props = $props();

  let statusFilter = $state('');
  let projectFilter = $state('');
  let searchQuery = $state('');

  let selectedAssignmentId = $state<number | null>(null);
  let editRole = $state('');
  let editStatus = $state<AssignmentStatus>('Activo');
  let editEndReason = $state('');

  let updateForm = $state<HTMLFormElement | null>(null);
  let deleteForm = $state<HTMLFormElement | null>(null);

  const currentForm = $derived(form ?? {});
  const linkageRows = $derived(Array.isArray(data?.linkages) ? data.linkages : []);
  const projectOptions = $derived(Array.isArray(data?.projects) ? data.projects : []);

  const selectedAssignment = $derived(
    linkageRows.find((linkage) => linkage.id === selectedAssignmentId) ?? null,
  );

  $effect(() => {
    if (currentForm.scope === 'edit' && currentForm.assignmentId && selectedAssignmentId === null) {
      selectedAssignmentId = Number(currentForm.assignmentId);
    }
  });

  $effect(() => {
    if (!selectedAssignment) return;
    editRole = selectedAssignment.role_in_project || '';
    editStatus = selectedAssignment.status;
    editEndReason = selectedAssignment.end_reason || '';
  });

  const filteredLinkages = $derived(
    linkageRows.filter((linkage) => {
      const matchesStatus = !statusFilter || linkage.status === statusFilter;
      const matchesProject = !projectFilter || linkage.project_id === Number(projectFilter);
      const haystack = [
        linkage.collaborator_name,
        linkage.collaborator_email,
        linkage.project_title,
        linkage.role_in_project || '',
      ]
        .join(' ')
        .toLowerCase();
      const matchesSearch = !searchQuery || haystack.includes(searchQuery.toLowerCase());
      return matchesStatus && matchesProject && matchesSearch;
    }),
  );

  const requiresEndReason = $derived(
    ['Finalizado', 'Removido'].includes(editStatus),
  );

  const availableEditStatuses = $derived.by(() => {
    if (!selectedAssignment) return ['Activo', 'Pausado', 'Finalizado', 'Removido'] as AssignmentStatus[];
    if (['Finalizado', 'Removido'].includes(selectedAssignment.status)) {
      return [selectedAssignment.status];
    }
    return ['Activo', 'Pausado', 'Finalizado', 'Removido'] as AssignmentStatus[];
  });

  const editError = $derived(currentForm.scope === 'edit' ? currentForm.error || '' : '');

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function openEditModal(linkage: AssignmentRow) {
    selectedAssignmentId = linkage.id;
  }

  function closeEditModal() {
    selectedAssignmentId = null;
    editRole = '';
    editStatus = 'Activo';
    editEndReason = '';
  }

  function submitLinkageUpdate() {
    updateForm?.requestSubmit();
  }

  function submitLinkageDelete() {
    deleteForm?.requestSubmit();
  }
</script>

<svelte:head>
  <title>Vinculaciones — Admin DLAB</title>
</svelte:head>

<div class="p-6 md:p-8 space-y-8">
  <header class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-[--text-primary]">Vinculaciones</h1>
        <p class="text-sm text-[--text-muted]">Gestiona cambios de estado, edición de rol y vinculaciones manuales desde una sola mesa de trabajo.</p>
      </div>
      <Button
        variant="primary"
        size="sm"
        icon="Link2"
        label="Nueva vinculación manual"
        href="/admin/linkage/new"
      />
    </div>

    <div class="flex flex-wrap gap-3">
      <span class="rounded-full bg-surface px-3 py-1.5 text-sm font-semibold text-[--text-primary]">Total: {data.summary.total}</span>
      <span class="rounded-full bg-surface px-3 py-1.5 text-sm font-semibold text-green-700">Activo: {data.summary.statusCounts.Activo}</span>
      <span class="rounded-full bg-surface px-3 py-1.5 text-sm font-semibold text-yellow-700">Pausado: {data.summary.statusCounts.Pausado}</span>
      <span class="rounded-full bg-surface px-3 py-1.5 text-sm font-semibold text-[--text-secondary]">Finalizado: {data.summary.statusCounts.Finalizado}</span>
      <span class="rounded-full bg-surface px-3 py-1.5 text-sm font-semibold text-red-700">Removido: {data.summary.statusCounts.Removido}</span>
    </div>
  </header>

  <section class="space-y-4">
    <div class="flex flex-wrap gap-3">
      <select bind:value={statusFilter} class="rounded-lg border border-[--border] bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-red]">
        <option value="">Todos los estados</option>
        <option value="Activo">Activo</option>
        <option value="Pausado">Pausado</option>
        <option value="Finalizado">Finalizado</option>
        <option value="Removido">Removido</option>
      </select>

      <select bind:value={projectFilter} class="rounded-lg border border-[--border] bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-red]">
        <option value="">Todos los proyectos</option>
        {#each projectOptions as project}
          <option value={project.id}>{project.title}</option>
        {/each}
      </select>

      <div class="relative min-w-64 flex-1">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted]" size={14} />
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Buscar por colaborador, correo, proyecto o rol..."
          class="w-full rounded-lg border border-[--border] bg-surface py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-red]"
        />
      </div>
    </div>

    <div class="overflow-x-auto rounded-2xl border border-[--border] bg-surface">
      <table class="w-full text-sm">
        <thead class="border-b border-[--border] bg-[--bg-secondary] text-xs uppercase tracking-wide text-[--text-muted]">
          <tr>
            <th class="px-4 py-3 text-left">Colaborador</th>
            <th class="px-4 py-3 text-left">Proyecto</th>
            <th class="px-4 py-3 text-left">Rol</th>
            <th class="px-4 py-3 text-left">Estado</th>
            <th class="px-4 py-3 text-left">Inicio</th>
            <th class="px-4 py-3 text-left">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredLinkages as linkage (linkage.id)}
            <tr class="border-b border-[--border] align-top transition-colors hover:bg-[--bg-secondary]">
              <td class="px-4 py-3">
                <a href="/admin/colaboradores/{linkage.collaborator_id}" class="font-medium text-[--text-primary] transition-colors hover:text-[--color-red]">
                  {linkage.collaborator_name}
                </a>
                <p class="text-xs text-[--text-muted]">{linkage.collaborator_email}</p>
              </td>
              <td class="px-4 py-3">
                <a href="/admin/projects/{linkage.project_id}" class="font-medium text-[--text-primary] transition-colors hover:text-[--color-red]">
                  {linkage.project_title}
                </a>
                <p class="text-xs text-[--text-muted]">/{linkage.project_slug}</p>
              </td>
              <td class="px-4 py-3 text-[--text-secondary]">{linkage.role_in_project || '—'}</td>
              <td class="px-4 py-3"><StatusBadge status={linkage.status} /></td>
              <td class="px-4 py-3 text-xs text-[--text-muted]">{formatDate(linkage.assigned_at)}</td>
              <td class="px-4 py-3">
                <Button variant="primary" size="sm" icon="Pencil" label="Editar" onclick={() => openEditModal(linkage)} />
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>
</div>

<Modal open={selectedAssignment !== null} title="Editar vinculación" size="xl" onclose={closeEditModal}>
  {#if selectedAssignment}
    <div class="space-y-5">
      <div>
        <h2 class="text-lg font-semibold text-[--text-primary]">Información del colaborador y proyecto</h2>
        <p class="text-sm text-[--text-muted] mb-4">Revise los datos del colaborador vinculado al proyecto.</p>
        <div class="w-full h-0.5" style="background: var(--accent); opacity: 0.3;"></div>
      </div>
      <div class="grid gap-4 md:grid-cols-2">
        <div class="rounded-xl border border-[--border] bg-[--bg-secondary] p-4">
          <p class="text-sm font-semibold text-[--text-primary] mb-2">Colaborador</p>
          <p class="font-medium text-[--text-primary]">{selectedAssignment.collaborator_name}</p>
          <p class="text-sm text-[--text-muted]">{selectedAssignment.collaborator_email}</p>
        </div>
        <div class="rounded-xl border border-[--border] bg-[--bg-secondary] p-4">
          <p class="text-sm font-semibold text-[--text-primary] mb-2">Proyecto</p>
          <p class="font-medium text-[--text-primary]">{selectedAssignment.project_title}</p>
          <p class="text-sm text-[--text-muted]">/{selectedAssignment.project_slug}</p>
        </div>
      </div>

      <div>
        <h2 class="text-lg font-semibold text-[--text-primary]">Estado y fechas</h2>
        <p class="text-sm text-[--text-muted] mb-4">Estado actual, fecha de inicio y aplicación vinculada.</p>
        <div class="w-full h-0.5" style="background: var(--accent); opacity: 0.3;"></div>
      </div>
        <div class="grid gap-4 md:grid-cols-3">
        <div class="rounded-xl border border-[--border] bg-[--bg-secondary] p-4">
          <p class="text-sm font-semibold text-[--text-primary] mb-2">Estado actual</p>
          <div><StatusBadge status={selectedAssignment.status} /></div>
        </div>
        <div class="rounded-xl border border-[--border] bg-[--bg-secondary] p-4">
          <p class="text-sm font-semibold text-[--text-primary] mb-2">Fecha de Vinculación</p>
          <p class="font-medium text-[--text-primary]">{formatDate(selectedAssignment.assigned_at)}</p>
        </div>
        <div class="rounded-xl border border-[--border] bg-[--bg-secondary] p-4">
          <p class="text-sm font-semibold text-[--text-primary] mb-2">Vinculado por</p>
          <p class="font-medium text-[--text-primary]">{selectedAssignment.assigned_by_admin_name || 'Sin administrador registrado'}</p>
        </div>
      </div>

      {#if editError}
        <div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{editError}</div>
      {/if}

      <div>
        <h2 class="text-lg font-semibold text-[--text-primary]">Edición de vinculación</h2>
        <p class="text-sm text-[--text-muted] mb-4">Actualice el rol, el estado o agregue un motivo de cierre.</p>
        <div class="w-full h-0.5" style="background: var(--accent); opacity: 0.3;"></div>
      </div>
      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <label for="edit_role" class="block text-sm font-semibold text-[--text-primary] mb-1">Rol en el proyecto</label>
          <input
            id="edit_role"
            type="text"
            bind:value={editRole}
            class="w-full rounded-lg border border-[--border] bg-[--bg-secondary] px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <label for="edit_status" class="block text-sm font-semibold text-[--text-primary] mb-1">Estado</label>
          <select
            id="edit_status"
            bind:value={editStatus}
            class="w-full rounded-lg border border-[--border] bg-[--bg-secondary] px-3 py-2.5 text-sm"
          >
            {#each availableEditStatuses as status}
              <option value={status}>{status}</option>
            {/each}
          </select>
        </div>
      </div>

      {#if editStatus !== 'Activo'}
        <div>
          <label for="edit_end_reason" class="block text-sm font-semibold text-[--text-primary] mb-1">
            {requiresEndReason ? 'Motivo de cierre o remoción' : 'Motivo de pausa'}
          </label>
          <RichTextField
            name="end_reason"
            label=""
            value={editEndReason}
            placeholder={requiresEndReason ? 'Obligatorio para finalizar o remover.' : 'Opcional'}
            minHeightClass="min-h-[100px]"
            onchange={(html) => { editEndReason = html; }}
          />
        </div>
      {/if}

      <div class="flex flex-wrap justify-between gap-3 border-t border-[--border] pt-4">
        <Button variant="primary" size="sm" icon="Trash2" label="Eliminar vinculación" onclick={submitLinkageDelete} />
        <div class="flex flex-wrap gap-2">
          <Button variant="primary" size="sm" label="Cancelar" onclick={closeEditModal} />
          <Button variant="primary" size="sm" icon="Pencil" label="Guardar cambios" onclick={submitLinkageUpdate} />
        </div>
      </div>

      <form bind:this={updateForm} method="POST" action="?/updateLinkage" class="hidden">
        <input type="hidden" name="id" value={selectedAssignment.id} />
        <input type="hidden" name="role_in_project" value={editRole} />
        <input type="hidden" name="status" value={editStatus} />
        <input type="hidden" name="end_reason" value={editEndReason} />
      </form>

      <form bind:this={deleteForm} method="POST" action="?/deleteLinkage" class="hidden">
        <input type="hidden" name="id" value={selectedAssignment.id} />
      </form>
    </div>
  {/if}
</Modal>
