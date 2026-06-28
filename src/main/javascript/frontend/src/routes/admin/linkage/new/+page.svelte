<script lang="ts">
  import { enhance } from '$app/forms';
  import {
    ArrowLeft,
    BriefcaseBusiness,
    ChevronDown,
    Search,
    UserRound,
  } from 'lucide-svelte';
  import StatusBadge from '$lib/components/ui/StatusBadge.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import RichTextField from '$lib/components/ui/RichTextField.svelte';

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
      activeAssignments: { collaborator_id: number; project_id: number }[];
      projects: ProjectOption[];
      collaborators: CollaboratorOption[];
    };
    form?: {
      error?: string;
    };
  }

  const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  let { data, form }: Props = $props();

  let manualProjectId = $state<number | null>(null);
  let manualCollaboratorId = $state<number | null>(null);
  let manualReason = $state('');
  let manualRole = $state('');
  let manualNotes = $state('');

  let projectSelectorOpen = $state(false);
  let collaboratorSelectorOpen = $state(false);
  let projectSearch = $state('');
  let collaboratorSearch = $state('');

  const projectOptions = $derived(Array.isArray(data?.projects) ? data.projects : []);
  const collaboratorOptions = $derived(Array.isArray(data?.collaborators) ? data.collaborators : []);

  const activeAssignmentCounts = $derived.by(() => {
    const counts = new Map<number, number>();
    for (const assignment of data.activeAssignments || []) {
      counts.set(
        assignment.collaborator_id,
        (counts.get(assignment.collaborator_id) || 0) + 1,
      );
    }
    return counts;
  });

  const selectedProject = $derived(
    projectOptions.find((project) => project.id === manualProjectId) ?? null,
  );

  const selectedCollaborator = $derived(
    collaboratorOptions.find((collaborator) => collaborator.id === manualCollaboratorId) ?? null,
  );

  const filteredProjects = $derived(
    projectOptions.filter((project) => {
      const haystack = [
        project.title,
        project.short_description,
        project.meeting_days_summary,
        project.responsible_admin_name,
        ...project.categories.map((tag) => tag.name),
        ...project.subcategories.map((tag) => tag.name),
      ]
        .join(' ')
        .toLowerCase();
      return !projectSearch || haystack.includes(projectSearch.toLowerCase());
    }),
  );

  const lockedCollaboratorIds = $derived.by(() => {
    if (!manualProjectId) return new Set<number>();
    return new Set<number>(
      data.activeAssignments
        .filter((assignment) => assignment.project_id === manualProjectId)
        .map((assignment) => assignment.collaborator_id),
    );
  });

  const filteredCollaborators = $derived.by(() => {
    if (!manualProjectId) return [];

    return collaboratorOptions
      .filter((collaborator) => {
        if (lockedCollaboratorIds.has(collaborator.id)) return false;

        const haystack = [
          collaborator.full_name,
          collaborator.usfq_email,
          collaborator.personal_email,
          collaborator.major,
          ...collaborator.tags.map((tag) => tag.name),
        ]
          .join(' ')
          .toLowerCase();

        return !collaboratorSearch || haystack.includes(collaboratorSearch.toLowerCase());
      })
      .sort((left, right) => {
        const leftCount = activeAssignmentCounts.get(left.id) || 0;
        const rightCount = activeAssignmentCounts.get(right.id) || 0;
        if (leftCount !== rightCount) return leftCount - rightCount;
        return left.full_name.localeCompare(right.full_name, 'es');
      });
  });

  const canSubmitManual = $derived(
    Boolean(selectedProject && selectedCollaborator && manualReason.trim().length >= 20),
  );

  const selectedProjectMeetingDays = $derived(
    [...(selectedProject?.meeting_days || [])].sort(
      (left, right) => weekDays.indexOf(left.day_of_week) - weekDays.indexOf(right.day_of_week),
    ),
  );

  const selectedCollaboratorAvailability = $derived(
    [...(selectedCollaborator?.availability_slots || [])].sort(
      (left, right) => weekDays.indexOf(left.day_of_week) - weekDays.indexOf(right.day_of_week),
    ),
  );

  function normalizeTime(value?: string | null) {
    if (!value) return '—';
    return value.slice(0, 5);
  }

  function getProjectMeetingDay(day: string) {
    return selectedProjectMeetingDays.find((entry) => entry.day_of_week === day) || null;
  }

  function getCollaboratorAvailability(day: string) {
    return selectedCollaboratorAvailability.find((entry) => entry.day_of_week === day) || null;
  }

  function hasProjectMeetingDay(day: string) {
    return Boolean(getProjectMeetingDay(day));
  }

  function hasCollaboratorAvailability(day: string) {
    return Boolean(getCollaboratorAvailability(day));
  }

  function collaboratorAssignmentCount(collaboratorId: number) {
    return activeAssignmentCounts.get(collaboratorId) || 0;
  }

  function selectProject(projectId: number) {
    manualProjectId = projectId;
    manualCollaboratorId = null;
    projectSelectorOpen = false;
    collaboratorSelectorOpen = false;
    projectSearch = '';
    collaboratorSearch = '';
  }

  function selectCollaborator(collaboratorId: number) {
    manualCollaboratorId = collaboratorId;
    collaboratorSelectorOpen = false;
    collaboratorSearch = '';
  }

  function toggleCollaboratorSelector() {
    if (!manualProjectId) return;
    collaboratorSelectorOpen = !collaboratorSelectorOpen;
    projectSelectorOpen = false;
  }
</script>

<svelte:head>
  <title>Nueva vinculación — Admin DLAB</title>
</svelte:head>

<div class="p-6 md:p-8 max-w-7xl space-y-6">
  <a href="/admin/linkage" class="mb-2 flex items-center gap-1.5 text-sm text-[--text-muted] transition-colors hover:text-[--text-secondary]">
    <ArrowLeft size={13} /> Vinculaciones
  </a>

  <header class="flex flex-wrap items-center justify-between gap-3">
    <div>
      <h1 class="text-2xl font-bold text-[--text-primary]">Nueva vinculación manual</h1>
      <p class="text-sm text-[--text-muted]">Selecciona proyecto y colaborador, revisa la información disponible y registra la vinculación.</p>
    </div>
  </header>

  {#if form?.error}
    <div class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{form.error}</div>
  {/if}

  <section class="bg-surface rounded-xl border border-[--border] p-5">
    <div class="grid gap-4 lg:grid-cols-2">
      <div class="relative">
        <p class="mb-2 text-sm font-semibold text-[--text-primary]">Proyecto</p>
        <button
          type="button"
          class="flex w-full items-center justify-between rounded-xl border border-[--border] bg-[--bg-secondary] px-4 py-3 text-left transition-colors hover:bg-surface"
          onclick={() => {
            projectSelectorOpen = !projectSelectorOpen;
            collaboratorSelectorOpen = false;
          }}
        >
          <div>
            <p class="font-medium text-[--text-primary]">{selectedProject?.title || 'Selecciona un proyecto'}</p>
            <p class="text-xs text-[--text-muted]"> {selectedProject?.responsible_admin_name != null ? 'Responsable : '.concat(selectedProject?.responsible_admin_name.concat(' (').concat(selectedProject?.responsible_admin_email || '').concat(')') || '') : 'Busca por nombre, responsable o categoría'}</p>
          </div>
          <ChevronDown size={16} class="text-[--text-muted]" />
        </button>

        {#if projectSelectorOpen}
          <div class="absolute z-20 mt-2 w-full rounded-xl border border-[--border] bg-surface p-3 text-[--text-primary] shadow-lg">
            <div class="relative mb-3">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted]" size={14} />
              <input
                type="text"
                bind:value={projectSearch}
                placeholder="Buscar proyecto..."
                class="w-full rounded-lg border border-[--border] bg-[--bg-secondary] py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-red]"
              />
            </div>
            <div class="max-h-96 space-y-2 overflow-y-auto pr-1">
              {#each filteredProjects as project}
                <button
                  type="button"
                  class="w-full rounded-xl border border-[--border] p-3 text-left transition-colors hover:bg-[--bg-secondary]"
                  onclick={() => selectProject(project.id)}
                >
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <p class="font-medium text-[--text-primary]">{project.title}</p>
                      <p class="mt-1 text-xs text-[--text-muted]">{@html project.short_description}</p>
                    </div>
                    <StatusBadge status={project.status} />
                  </div>
                  <p class="mt-1 text-xs text-[--text-muted]">{project.responsible_admin_name}{project.responsible_admin_email ? ` · ${project.responsible_admin_email}` : ''}</p>
                  <div class="mt-3 flex flex-wrap gap-1.5">
                    {#each [...project.categories] as tag}
                      <span class="rounded-full border border-[--border] px-2 py-0.5 text-[11px]" style="color: var(--text-primary); background-color: var(--bg-primary)">{tag.name}</span>
                    {/each}
                  </div>
                </button>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <div class="relative">
        <p class="mb-2 text-sm font-semibold text-[--text-primary]">Colaborador</p>
        <button
          type="button"
          class={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
            manualProjectId
              ? 'border-[--border] bg-[--bg-secondary] hover:bg-surface'
              : 'cursor-not-allowed border-[--border] bg-[--bg-secondary] opacity-75'
          }`}
          onclick={toggleCollaboratorSelector}
        >
          <div>
            <p class="font-medium text-[--text-primary]">{selectedCollaborator?.full_name || 'Selecciona un colaborador'}</p>
            <p class="text-xs text-[--text-muted]">
              {manualProjectId
                ? selectedCollaborator?.usfq_email || 'Busca por nombre, correo, carrera o habilidades'
                : 'Selecciona primero un proyecto'}
            </p>
          </div>
          <ChevronDown size={16} class="text-[--text-muted]" />
        </button>

        {#if collaboratorSelectorOpen}
          <div class="absolute z-20 mt-2 w-full rounded-xl border border-[--border] bg-surface p-3 text-[--text-primary] shadow-lg">
            <div class="relative mb-3">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted]" size={14} />
              <input
                type="text"
                bind:value={collaboratorSearch}
                placeholder="Buscar colaborador..."
                class="w-full rounded-lg border border-[--border] bg-[--bg-secondary] py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-red]"
              />
            </div>
            {#if manualProjectId && lockedCollaboratorIds.size > 0}
              <p class="mb-2 text-[11px] text-[--text-muted]">Se ocultaron {lockedCollaboratorIds.size} colaborador(es) con vinculación activa o pausada en este proyecto.</p>
            {/if}
            <div class="max-h-96 space-y-2 overflow-y-auto pr-1">
              {#if filteredCollaborators.length === 0}
                <p class="px-2 py-6 text-center text-sm text-[--text-muted]">No hay colaboradores disponibles para este proyecto con los filtros actuales.</p>
              {/if}
              {#each filteredCollaborators as collaborator}
                <button
                  type="button"
                  class="w-full rounded-xl border border-[--border] p-3 text-left transition-colors hover:bg-[--bg-secondary]"
                  onclick={() => selectCollaborator(collaborator.id)}
                >
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <p class="font-medium text-[--text-primary]">{collaborator.full_name}</p>
                      <p class="mt-1 text-xs text-[--text-muted]">{collaborator.usfq_email || collaborator.personal_email}</p>
                    </div>
                    <StatusBadge status={collaborator.trajectory_status} />
                  </div>
                  <p class="mt-3 text-xs text-[--text-secondary]">{collaborator.major}{collaborator.current_university_year ? ` · Semestre ${collaborator.current_university_year}` : ''}</p>
                  <p class="mt-1 text-xs text-[--text-muted]">
                    Vinculaciones activas o pausadas: {collaboratorAssignmentCount(collaborator.id)}
                  </p>
                  <div class="mt-3 flex flex-wrap gap-1.5">
                    {#each collaborator.tags.slice(0, 5) as tag}
                      <span class="rounded-full border border-[--border] px-2 py-0.5 text-[11px] text-[--text-secondary]">{tag.name}</span>
                    {/each}
                  </div>
                </button>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </div>
  </section>

  {#if selectedProject && selectedCollaborator}
    <div class="space-y-5">
      <section class="grid gap-5 xl:grid-cols-2">
        <div class="bg-surface rounded-xl border border-[--border] p-5">
          <div class="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 class="text-lg font-semibold text-[--text-primary]">Proyecto</h2>
              <p class="mt-1 text-xl font-bold text-[--text-primary]">{selectedProject.title}</p>
              <p class="mt-1 text-sm text-[--text-secondary]">/{selectedProject.slug}</p>
            </div>
            <BriefcaseBusiness size={20} class="text-[--color-red]" />
          </div>

          <div class="space-y-4">
            <div class="rounded-xl border border-[--border] bg-[--bg-secondary] p-4">
              <h3 class="mb-3 text-sm font-semibold text-[--text-primary]">Resumen del proyecto</h3>
              <div class="grid gap-4 md:grid-cols-1">
                <div class="space-y-2">
                  <p class="text-sm font-bold text-[--text-secondary]">Descripción corta</p>
                  <p class="text-sm text-[--text-secondary]">{@html selectedProject.short_description || 'Sin descripción corta registrada'}</p>
                </div>
                <div class="space-y-2">
                  <p class="text-sm font-bold text-[--text-secondary]">Descripción ampliada</p>
                  <div class="text-[--text-secondary] project-description prose prose-sm max-w-none leading-relaxed">
                    {@html selectedProject.full_description || 'Sin descripción ampliada registrada'}
                  </div>
                </div>
                <div class="space-y-2">
                  <p class="text-sm font-bold text-[--text-secondary]">Público objetivo</p>
                  <p class="text-sm text-[--text-secondary] project-description prose prose-sm max-w-noneleading-relaxed">{@html selectedProject.target_audience || 'Sin público objetivo registrado'}</p>
                </div>
                <div class="space-y-2">
                  <p class="text-sm font-bold text-[--text-secondary]">Estado</p>
                  <div><StatusBadge status={selectedProject.status} /></div>
                </div>
              </div>
            </div>

            <div class="rounded-xl border border-[--border] bg-[--bg-secondary] p-4">
              <h3 class="mb-3 text-sm font-semibold text-[--text-primary]">Clasificación del proyecto</h3>
              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <p class="mb-2 text-sm font-bold text-[--text-secondary]">Categorías</p>
                  <div class="flex flex-wrap gap-2">
                    {#if selectedProject.categories.length > 0}
                      {#each selectedProject.categories as tag}
                        <span class="rounded-full border border-[--border] px-3 py-1 text-xs" style="color: var(--text-primary); background-color: var(--bg-primary)">{tag.name}</span>
                      {/each}
                    {:else}
                      <span class="text-sm text-[--text-muted]">Sin categorías registradas</span>
                    {/if}
                  </div>
                </div>
                <div>
                  <p class="mb-2 text-sm font-bold text-[--text-secondary]">Subcategorías</p>
                  <div class="flex flex-wrap gap-2">
                    {#if selectedProject.subcategories.length > 0}
                      {#each selectedProject.subcategories as tag}
                        <span class="rounded-full border border-[--border] px-3 py-1 text-xs" style="color: var(--text-primary); background-color: var(--bg-primary)">{tag.name}</span>
                      {/each}
                    {:else}
                      <span class="text-sm text-[--text-muted]">Sin subcategorías registradas</span>
                    {/if}
                  </div>
                </div>
              </div>
            </div>

            <div class="rounded-xl border border-[--border] bg-[--bg-secondary] p-4">
              <h3 class="mb-3 text-sm font-semibold text-[--text-primary]">Responsable y cupo</h3>
              <div class="grid gap-4 md:grid-cols-2">
                <div class="space-y-2">
                  <p class="text-sm font-bold text-[--text-secondary]">Responsable</p>
                  <p class="text-sm font-medium text-[--text-primary]">{selectedProject.responsible_admin_name}</p>
                  <p class="text-sm text-[--text-secondary]">{selectedProject.responsible_admin_email || 'Sin correo registrado'}</p>
                </div>
                <div class="space-y-2">
                  <p class="text-sm font-bold text-[--text-secondary]">Cupo</p>
                  <p class="text-sm font-medium text-[--text-primary]">
                    {selectedProject.current_collaborator_count}
                    {#if selectedProject.max_collaborators !== null}
                      /{selectedProject.max_collaborators}
                    {/if}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-surface rounded-xl border border-[--border] p-5">
          <div class="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 class="text-lg font-semibold text-[--text-primary]">Colaborador</h2>
              <p class="mt-1 text-xl font-bold text-[--text-primary]">{selectedCollaborator.full_name}</p>
              <p class="mt-1 text-sm text-[--text-secondary]">{selectedCollaborator.usfq_email || selectedCollaborator.personal_email}</p>
            </div>
            <UserRound size={20} class="text-[--color-red]" />
          </div>

          <div class="space-y-4">
            <div class="rounded-xl border border-[--border] bg-[--bg-secondary] p-4">
              <h3 class="mb-3 text-sm font-semibold text-[--text-primary]">Resumen del colaborador</h3>
              <div class="grid gap-4 md:grid-cols-2">
                <div class="space-y-2">
                  <p class="text-sm font-bold text-[--text-secondary]">Trayectoria</p>
                  <div><StatusBadge status={selectedCollaborator.trajectory_status} /></div>
                </div>
                <div class="space-y-2">
                  <p class="text-sm font-bold text-[--text-secondary]">Vinculaciones activas o pausadas</p>
                  <p class="text-sm font-medium text-[--text-primary]">{collaboratorAssignmentCount(selectedCollaborator.id)}</p>
                </div>
                <div class="space-y-2">
                  <p class="text-sm font-bold text-[--text-secondary]">Teléfono</p>
                  <p class="text-sm text-[--text-secondary]">{selectedCollaborator.phone_number || 'Sin teléfono registrado'}</p>
                </div>
                <div class="space-y-2">
                  <p class="text-sm font-bold text-[--text-secondary]">Perfil</p>
                  <a href={`/admin/colaboradores/${selectedCollaborator.id}`} class="text-sm font-medium text-[--color-red] transition-colors hover:text-[--color-red-hover]">
                    Ver perfil completo del colaborador
                  </a>
                </div>
              </div>
            </div>

            <div class="rounded-xl border border-[--border] bg-[--bg-secondary] p-4">
              <h3 class="mb-3 text-sm font-semibold text-[--text-primary]">Información académica y contacto</h3>
              <div class="grid gap-4 md:grid-cols-2">
                <div class="space-y-2">
                  <p class="text-sm font-bold text-[--text-secondary]">Carrera</p>
                  <p class="text-sm text-[--text-secondary]">{selectedCollaborator.major || 'Sin carrera registrada'}</p>
                </div>
                <div class="space-y-2">
                  <p class="text-sm font-bold text-[--text-secondary]">Semestre actual</p>
                  <p class="text-sm text-[--text-secondary]">{selectedCollaborator.current_university_year ?? 'Sin dato registrado'}</p>
                </div>
                <div class="space-y-2">
                  <p class="text-sm font-bold text-[--text-secondary]">Graduación esperada</p>
                  <p class="text-sm text-[--text-secondary]">{selectedCollaborator.expected_graduation_year ?? 'Sin dato registrado'}</p>
                </div>
                <div class="space-y-2">
                  <p class="text-sm font-bold text-[--text-secondary]">Correo personal</p>
                  <p class="text-sm text-[--text-secondary]">{selectedCollaborator.personal_email || 'Sin correo personal registrado'}</p>
                </div>
              </div>
            </div>

            <div class="rounded-xl border border-[--border] bg-[--bg-secondary] p-4">
              <h3 class="mb-3 text-sm font-semibold text-[--text-primary]">Motivación y experiencia</h3>
              <div class="grid gap-4 md:grid-cols-2">
                <div class="space-y-2">
                  <p class="text-sm font-bold text-[--text-secondary]">Motivación</p>
                  <p class="text-sm text-[--text-secondary]">{@html selectedCollaborator.motivation_description || 'Sin motivación registrada'}</p>
                </div>
                <div class="space-y-2">
                  <p class="text-sm font-bold text-[--text-secondary]">Experiencia previa</p>
                  <p class="text-sm text-[--text-secondary]">{@html selectedCollaborator.experience_description || 'Sin experiencia registrada'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="bg-surface rounded-xl border border-[--border] p-5">
        <div class="mb-4">
          <h2 class="text-lg font-semibold text-[--text-primary]">Habilidades del proyecto y del colaborador</h2>
        </div>

        <div class="grid gap-5 md:grid-cols-2">
          <div class="rounded-xl border border-[--border] bg-[--bg-secondary] p-4">
            <p class="mb-3 text-sm font-semibold text-[--text-primary]">Habilidades requeridas por el proyecto</p>
            <div class="flex flex-wrap gap-2">
              {#if selectedProject.required_skill_items.length > 0}
                {#each selectedProject.required_skill_items as skill}
                  <span class="rounded-full border border-[--border] px-3 py-1 text-xs text-[--text-secondary]">{skill.name}</span>
                {/each}
              {:else}
                <span class="text-sm text-[--text-muted]">Sin habilidades requeridas registradas</span>
              {/if}
            </div>
          </div>

          <div class="rounded-xl border border-[--border] bg-[--bg-secondary] p-4">
            <p class="mb-3 text-sm font-semibold text-[--text-primary]">Habilidades del colaborador</p>
            <div class="flex flex-wrap gap-2">
              {#if selectedCollaborator.tags.length > 0}
                {#each selectedCollaborator.tags as tag}
                  <span class="rounded-full border border-[--border] px-3 py-1 text-xs text-[--text-secondary]">{tag.name}</span>
                {/each}
              {:else}
                <span class="text-sm text-[--text-muted]">Sin habilidades registradas</span>
              {/if}
            </div>
          </div>
        </div>
      </section>

      <section class="bg-surface rounded-xl border border-[--border] p-5">
        <div class="mb-4">
          <h2 class="text-lg font-semibold text-[--text-primary]">Revisión visual de horarios</h2>
        </div>

        <div class="space-y-5">
          <div class="rounded-xl border border-[--border] bg-[--bg-secondary] p-4">
            <p class="mb-3 text-sm font-semibold text-[--text-primary]">Reuniones del proyecto</p>
            <div class="grid grid-cols-7 gap-2">
              {#each weekDays as day}
                {@const slot = getProjectMeetingDay(day)}
                <div
                  class={`flex min-h-[74px] flex-col items-center justify-center rounded-xl border-2 p-3 text-center text-xs ${
                    hasProjectMeetingDay(day)
                      ? 'border-[--accent] bg-[--accent] bg-opacity-10 text-[--accent]'
                      : 'border-[--border] text-[--text-secondary]'
                  }`}
                >
                  <span class="font-medium">{day.slice(0, 3)}</span>
                  {#if slot}
                    <span class="mt-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium" style="color: var(--accent);">
                      {normalizeTime(slot.start_time)}-{normalizeTime(slot.end_time)}
                    </span>
                  {/if}
                </div>
              {/each}
            </div>

            <div class="mt-4 space-y-2">
              {#if selectedProjectMeetingDays.length > 0}
                {#each selectedProjectMeetingDays as day}
                  <div class="rounded-xl border border-[--border] bg-surface px-3 py-2 text-sm">
                    <p class="font-medium text-[--text-primary]">{day.day_of_week}</p>
                    <p class="text-xs text-[--text-muted]">
                      {normalizeTime(day.start_time)} - {normalizeTime(day.end_time)}{day.notes ? ` · ${day.notes}` : ''}
                    </p>
                  </div>
                {/each}
              {:else}
                <p class="text-sm text-[--text-muted]">Sin reuniones registradas para este proyecto.</p>
              {/if}
            </div>
          </div>

          <div class="rounded-xl border border-[--border] bg-[--bg-secondary] p-4">
            <p class="mb-3 text-sm font-semibold text-[--text-primary]">Disponibilidad del colaborador</p>
            <div class="grid grid-cols-7 gap-2">
              {#each weekDays as day}
                {@const slot = getCollaboratorAvailability(day)}
                <div
                  class={`flex min-h-[74px] flex-col items-center justify-center rounded-xl border-2 p-3 text-center text-xs ${
                    hasCollaboratorAvailability(day)
                      ? 'border-[--accent] bg-[--accent] bg-opacity-10 text-[--accent]'
                      : 'border-[--border] text-[--text-secondary]'
                  }`}
                >
                  <span class="font-medium">{day.slice(0, 3)}</span>
                  {#if slot}
                    <span class="mt-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium" style="color: var(--accent);">
                      {normalizeTime(slot.time_from)}-{normalizeTime(slot.time_to)}
                    </span>
                  {/if}
                </div>
              {/each}
            </div>

            <div class="mt-4 space-y-2">
              {#if selectedCollaboratorAvailability.length > 0}
                {#each selectedCollaboratorAvailability as slot}
                  <div class="rounded-xl border border-[--border] bg-surface px-3 py-2 text-sm">
                    <p class="font-medium text-[--text-primary]">{slot.day_of_week}</p>
                    <p class="text-xs text-[--text-muted]">
                      {normalizeTime(slot.time_from)} - {normalizeTime(slot.time_to)}{slot.notes ? ` · ${slot.notes}` : ''}
                    </p>
                  </div>
                {/each}
              {:else}
                <p class="text-sm text-[--text-muted]">Sin disponibilidad registrada por el colaborador.</p>
              {/if}
            </div>
          </div>
        </div>
      </section>

      <form method="POST" action="?/createManual" use:enhance class="bg-surface rounded-xl border border-[--border] p-5">
        <input type="hidden" name="project_id" value={manualProjectId ?? ''} />
        <input type="hidden" name="collaborator_id" value={manualCollaboratorId ?? ''} />

        <div class="grid gap-4 lg:grid-cols-2">
          <div>
            <RichTextField
              name="reason_for_linking"
              label="Motivo de vinculación"
              value={manualReason}
              placeholder="Describe por qué esta vinculación debe aprobarse manualmente."
              required
              minHeightClass="min-h-[120px]"
              onchange={(html) => { manualReason = html; }}
            />
            <p class="mt-2 text-xs text-[--text-muted]">Mínimo 20 caracteres. Actual: {manualReason.replace(/<[^>]*>/g, '').trim().length}</p>
          </div>

          <div>
            <RichTextField
              name="admin_notes"
              label="Notas administrativas"
              value={manualNotes}
              placeholder="Opcional"
              minHeightClass="min-h-[120px]"
              onchange={(html) => { manualNotes = html; }}
            />
          </div>
        </div>

        <div class="mt-4">
          <label for="manual_role" class="mb-2 block text-sm font-semibold text-[--text-primary]">Rol en el proyecto</label>
          <input
            id="manual_role"
            name="role_in_project"
            type="text"
            bind:value={manualRole}
            placeholder="Opcional"
            class="w-full rounded-xl border border-[--border] bg-[--bg-secondary] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-red]"
          />
        </div>

        <div class="mt-6 flex justify-center gap-3">
          <Button variant="secondary" href="/admin/linkage" label="Cancelar" />
          <Button
            type="submit"
            variant="primary"
            size="sm"
            icon="Link2"
            label="Crear vinculación"
            disabled={!canSubmitManual}
          />
        </div>
      </form>
    </div>
  {:else}
    <div class="rounded-xl border border-dashed border-[--border] bg-[--bg-secondary] px-5 py-10 text-center">
      <p class="text-base font-medium text-[--text-primary]">Selecciona un proyecto y un colaborador para abrir el panel de revisión.</p>
      <p class="mt-2 text-sm text-[--text-muted]">El sistema solo filtra colaboradores cuando ya existe un proyecto seleccionado.</p>
    </div>
  {/if}
</div>
