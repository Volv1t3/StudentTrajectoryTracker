<script lang="ts">
  import { enhance, applyAction } from '$app/forms';
  import { untrack } from 'svelte';
  import { Search } from 'lucide-svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import StatusBadge from '$lib/components/ui/StatusBadge.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import RichTextField from '$lib/components/ui/RichTextField.svelte';
  import FormErrorSummary from '$lib/components/ui/FormErrorSummary.svelte';
  import { validateReviewApplicationForm, APPLICATION_LIMITS } from '$lib/validation/application';
  import { extractApiError, mapBackendFields, summarizeFormError } from '$lib/validation/apiError';
  import { applicationFieldMap } from '$lib/validation/fieldMaps';

  type ProjectCategory = {
    id: number;
    name: string;
    slug: string;
    category: string;
    is_system?: boolean;
  };

  type ApplicationRow = {
    id: number;
    status: string;
    applied_at: string;
    reason_for_applying: string;
    admin_notes: string | null;
    collaborator_id: number;
    collaborator_name: string;
    collaborator_email: string;
    project_id: number;
    project_title: string;
    project_slug: string;
    project_categories: ProjectCategory[];
    responsible_admin_id: number | null;
    responsible_admin_name: string;
    responsible_admin_email: string | null;
    role_in_project: string | null;
  };

  interface Props {
    data: {
      applications: ApplicationRow[];
      projects: Array<{ id: number; nombre: string }>;
      summary: {
        total: number;
        statusCounts: Record<string, number>;
      };
    };
    form?: {
      error?: string;
      apiError?: unknown;
    };
  }

  let { data, form }: Props = $props();

  let projectFilter = $state('');
  let statusFilter = $state('');
  let searchQuery = $state('');
  let selectedApplicationId = $state<number | null>(null);
  let reviewNotes = $state('');
  let roleInProject = $state('');
  let backendErrors = $state<Record<string, string>>({});
  let touched = $state<Record<string, boolean>>({});
  let submitAttempted = $state(false);
  let topError = $state('');

  let approveForm = $state<HTMLFormElement | null>(null);
  let rejectForm = $state<HTMLFormElement | null>(null);
  let reviewForm = $state<HTMLFormElement | null>(null);
  const selectedApplication = $derived(
    data.applications.find((application) => application.id === selectedApplicationId) ?? null,
  );

  const filteredApplications = $derived(
    data.applications.filter((application) => {
      const matchesProject = !projectFilter || application.project_id === Number(projectFilter);
      const matchesStatus = !statusFilter || application.status === statusFilter;
      const matchesSearch =
        !searchQuery
        || application.collaborator_name.toLowerCase().includes(searchQuery.toLowerCase())
        || application.collaborator_email.toLowerCase().includes(searchQuery.toLowerCase())
        || application.project_title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesProject && matchesStatus && matchesSearch;
    }),
  );

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function openReviewModal(application: ApplicationRow) {
    selectedApplicationId = application.id;
    reviewNotes = application.admin_notes || '';
    roleInProject = '';
    backendErrors = {};
    touched = {};
    submitAttempted = false;
    topError = '';
  }

  function closeReviewModal() {
    selectedApplicationId = null;
    reviewNotes = '';
    roleInProject = '';
    backendErrors = {};
    touched = {};
    submitAttempted = false;
    topError = '';
  }

  function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  }

  const reviewNotesPlain = $derived(stripHtml(reviewNotes));

  function markTouched(key: string) {
    if (!touched[key]) touched = { ...touched, [key]: true };
    if (backendErrors[key]) {
      const { [key]: _drop, ...rest } = backendErrors;
      backendErrors = rest;
    }
  }

  function validateFor(status: 'Aprobada' | 'Rechazada' | 'En_Revisión') {
    return validateReviewApplicationForm({
      status,
      admin_notes: reviewNotesPlain || undefined,
      role_in_project: roleInProject || undefined,
    }) as Record<string, string>;
  }

  const reviewErrors = $derived(validateFor('En_Revisión'));
  const rejectErrors = $derived(validateFor('Rechazada'));
  const approveErrors = $derived(validateFor('Aprobada'));

  const activeFrontErrors = $derived.by(() => {
    if (isPending) return reviewErrors;
    if (isInReview) return { ...approveErrors, ...rejectErrors };
    return approveErrors;
  });

  const mergedErrors = $derived<Record<string, string>>({
    ...activeFrontErrors,
    ...backendErrors,
  });

  const show = $derived<Record<string, boolean>>({
    role_in_project: touched.role_in_project || roleInProject.trim().length > 0 || submitAttempted,
    admin_notes: touched.admin_notes || reviewNotesPlain.length > 0 || submitAttempted,
  });

  $effect(() => {
    if (form?.apiError !== undefined || form?.error !== undefined) {
      const extracted = extractApiError(form?.apiError ?? form?.error ?? null);
      const mappedBackendErrors = mapBackendFields(extracted.fields, applicationFieldMap);
      const nextTopError = summarizeFormError(extracted);
      const nextTouched: Record<string, boolean> = { ...untrack(() => touched) };
      for (const k of Object.keys(mappedBackendErrors)) nextTouched[k] = true;

      backendErrors = mappedBackendErrors;
      topError = nextTopError;
      submitAttempted = true;
      touched = nextTouched;
    }
  });

  function submitApproval() {
    submitAttempted = true;
    const errs = validateFor('Aprobada');
    if (Object.keys(errs).length > 0) {
      touched = { ...touched, role_in_project: true, admin_notes: true };
      topError = 'Revisa los campos marcados antes de continuar.';
      return;
    }
    topError = '';
    approveForm?.requestSubmit();
  }

  function submitInReview() {
    submitAttempted = true;
    const errs = validateFor('En_Revisión');
    if (Object.keys(errs).length > 0) {
      touched = { ...touched, role_in_project: true, admin_notes: true };
      topError = 'Revisa los campos marcados antes de continuar.';
      return;
    }
    topError = '';
    reviewForm?.requestSubmit();
  }

  function submitRejection() {
    submitAttempted = true;
    const errs = validateFor('Rechazada');
    if (Object.keys(errs).length > 0) {
      touched = { ...touched, role_in_project: true, admin_notes: true };
      topError = 'Revisa los campos marcados antes de continuar.';
      return;
    }
    topError = '';
    rejectForm?.requestSubmit();
  }

  const isApproved = $derived(selectedApplication?.status === 'Aprobada');
  const isPending = $derived(selectedApplication?.status === 'Pendiente');
  const isInReview = $derived(selectedApplication?.status === 'En_Revisión');
  const canApprove = $derived(Boolean(isPending || isInReview));
  const canReject = $derived(Boolean(isPending || isInReview));
  const canSetInReview = $derived(Boolean(isPending));
  const isReadOnly = $derived(
    !selectedApplication || ['Aprobada', 'Rechazada', 'Retirada'].includes(selectedApplication.status),
  );

  function handleReviewAction() {
    return async ({ result, update }: { result: any; update: (options?: { reset?: boolean; invalidateAll?: boolean }) => Promise<void> }) => {
      if (result?.type === 'success') {
        closeReviewModal();
        await update({ reset: false, invalidateAll: true });
        return;
      }
      await applyAction(result);
    };
  }
</script>

<svelte:head>
  <title>Solicitudes — Admin DLAB</title>
</svelte:head>

<div class="p-6 md:p-8">
  <header class="mb-6">
    <h1 class="text-2xl font-bold text-[--text-primary]">Solicitudes a proyectos</h1>
    <div class="flex flex-wrap gap-3 mt-4">
      <span class="text-sm text-primary px-2 py-1 rounded-full font-semibold" style="background-color: var(--bg-surface);">
        Total: {data.summary.total}
      </span>
      <span class="text-sm text-yellow-700 px-2 py-1 rounded-full font-semibold" style="background-color: var(--bg-surface);">
        Pendientes: {data.summary.statusCounts.Pendiente || 0}
      </span>
      <span class="text-sm text-blue-700 px-2 py-1 rounded-full font-semibold" style="background-color: var(--bg-surface);">
        En revisión: {data.summary.statusCounts['En_Revisión'] || 0}
      </span>
      <span class="text-sm text-green-700 px-2 py-1 rounded-full font-semibold" style="background-color: var(--bg-surface);">
        Aprobadas: {data.summary.statusCounts.Aprobada || 0}
      </span>
      <span class="text-sm text-red-700 px-2 py-1 rounded-full font-semibold" style="background-color: var(--bg-surface);">
        Rechazadas: {data.summary.statusCounts.Rechazada || 0}
      </span>
      <span class="text-sm text-[--text-muted] px-2 py-1 rounded-full font-semibold" style="background-color: var(--bg-surface);">
        Retiradas: {data.summary.statusCounts.Retirada || 0}
      </span>
    </div>
  </header>

  {#if form?.error}
    <div class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {form.error}
    </div>
  {/if}

  <div class="flex flex-wrap gap-3 mb-5">
    <select bind:value={projectFilter} class="text-sm border border-[--border] rounded-lg px-3 py-2 bg-surface focus:ring-2 focus:ring-[--color-red] focus:outline-none">
      <option value="">Todos los proyectos</option>
      {#each data.projects as project}
        <option value={project.id}>{project.nombre}</option>
      {/each}
    </select>

    <select bind:value={statusFilter} class="text-sm border border-[--border] rounded-lg px-3 py-2 bg-surface focus:ring-2 focus:ring-[--color-red] focus:outline-none">
      <option value="">Todos los estados</option>
      <option value="Pendiente">Pendiente</option>
      <option value="En_Revisión">En revisión</option>
      <option value="Aprobada">Aprobada</option>
      <option value="Rechazada">Rechazada</option>
      <option value="Retirada">Retirada</option>
    </select>

    <div class="relative flex-1 min-w-52">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted]" size={13} />
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Buscar por colaborador, correo o proyecto..."
        class="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-[--border] bg-surface focus:ring-2 focus:ring-[--color-red] focus:outline-none"
      />
    </div>
  </div>

  <div class="bg-surface rounded-xl border border-[--border] overflow-x-auto">
    <table class="w-full text-sm">
      <thead class="bg-[--bg-secondary] border-b border-[--border] text-xs font-semibold text-[--text-muted] uppercase tracking-wide">
        <tr>
          <th class="px-4 py-3 text-left">Estado</th>
          <th class="px-4 py-3 text-left">Colaborador</th>
          <th class="px-4 py-3 text-left">Proyecto</th>
          <th class="px-4 py-3 text-left">Categorías</th>
          <th class="px-4 py-3 text-left">Responsable</th>
          <th class="px-4 py-3 text-left">Aplicó el</th>
          <th class="px-4 py-3 text-left">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {#each filteredApplications as application (application.id)}
          <tr class="border-b border-[--border] hover:bg-[--bg-secondary] transition-colors">
            <td class="px-4 py-3">
              <StatusBadge status={application.status} />
            </td>
            <td class="px-4 py-3">
              <p class="font-medium text-[--text-primary]">{application.collaborator_name}</p>
              <p class="text-xs text-[--text-muted]">{application.collaborator_email}</p>
            </td>
            <td class="px-4 py-3">
              <p class="font-medium text-[--text-primary]">{application.project_title}</p>
            </td>
            <td class="px-4 py-3">
              <div class="flex flex-wrap gap-1.5">
                {#if application.project_categories.length > 0}
                  {#each application.project_categories as category}
                    <span class="border-2 p-4 bg-[--text-primary] hover:bg-[--color-red-hover] text-xs font-sans rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">{category.name}</span>
                  {/each}
                {:else}
                  <span class="text-xs text-[--text-muted]">Sin categorías</span>
                {/if}
              </div>
            </td>
            <td class="px-4 py-3">
              <p class="font-medium text-[--text-primary]">{application.responsible_admin_name}</p>
              <p class="text-xs text-[--text-muted]">{application.responsible_admin_email || 'Sin correo'}</p>
            </td>
            <td class="px-4 py-3 text-xs text-[--text-muted]">
              {formatDate(application.applied_at)}
            </td>
            <td class="px-4 py-3">
              <div class="flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  href={`/admin/colaboradores/${application.collaborator_id}`}
                  label="Ver perfil"
                  icon="User"
                />
                <Button
                  variant="primary"
                  size="sm"
                  label="Revisar solicitud"
                  icon="Eye"
                  onclick={() => openReviewModal(application)}
                />
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<Modal open={selectedApplication !== null} title="Revisar solicitud" size="xl" onclose={closeReviewModal}>
  {#if selectedApplication}
    <div class="space-y-5">
      <div>
        <h2 class="text-lg font-semibold text-[--text-primary]">Información del solicitante y proyecto</h2>
        <p class="text-sm text-[--text-muted] mb-4">Revise los datos del colaborador y el proyecto al que aplicó.</p>
        <div class="w-full h-0.5" style="background: var(--accent); opacity: 0.3;"></div>
      </div>
      <div class="grid gap-4 md:grid-cols-2">
        <div class="rounded-xl border border-[--border] bg-[--bg-secondary] p-4">
          <p class="text-sm font-semibold text-[--text-primary] mb-2">Colaborador</p>
          <p class="font-medium text-[--text-primary]">{selectedApplication.collaborator_name}</p>
          <p class="text-sm text-[--text-muted]">{selectedApplication.collaborator_email}</p>
        </div>
        <div class="rounded-xl border border-[--border] bg-[--bg-secondary] p-4">
          <p class="text-sm font-semibold text-[--text-primary] mb-2">Proyecto</p>
          <p class="font-medium text-[--text-primary]">{selectedApplication.project_title}</p>
          <p class="text-sm text-[--text-muted]">
            {selectedApplication.responsible_admin_email
              ? `${selectedApplication.responsible_admin_name} · ${selectedApplication.responsible_admin_email}`
              : selectedApplication.responsible_admin_name}
          </p>
        </div>
      </div>

      <div>
        <h2 class="text-lg font-semibold text-[--text-primary]">Motivación del colaborador</h2>
        <p class="text-sm text-[--text-muted] mb-4">Razón proporcionada por el colaborador al aplicar.</p>
        <div class="w-full h-0.5" style="background: var(--accent); opacity: 0.3;"></div>
      </div>
      <div class="rounded-xl border border-[--border] bg-[--bg-secondary] p-4 max-h-48 overflow-y-auto">
        <p class="text-sm text-[--text-secondary] leading-relaxed whitespace-pre-wrap">{@html selectedApplication.reason_for_applying}</p>
      </div>

      <div>
        <h2 class="text-lg font-semibold text-[--text-primary]">
          {#if isReadOnly}
            Detalle administrativo
          {:else}
            Decisión administrativa
          {/if}
        </h2>
        <p class="text-sm text-[--text-muted] mb-4">
          {#if isApproved}
            Esta solicitud ya fue aprobada y generó una vinculación. Para revocarla, use la sección de vinculaciones.
          {:else if isReadOnly}
            La solicitud ya se encuentra en un estado terminal y solo puede consultarse.
          {:else}
            Asigne un rol, agregue notas y decida el estado de la solicitud.
          {/if}
        </p>
        <div class="w-full h-0.5" style="background: var(--accent); opacity: 0.3;"></div>
      </div>
      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <label for="role_in_project" class="block text-sm font-semibold text-[--text-primary] mb-1">Rol en el proyecto</label>
          {#if isReadOnly}
            <div class="w-full rounded-lg border border-[--border] bg-[--bg-secondary] px-3 py-2.5 text-sm text-[--text-secondary]">
              {selectedApplication.role_in_project || 'Sin rol registrado'}
            </div>
          {/if}
        </div>
        <div>
          <p class="block text-sm font-semibold text-[--text-primary] mb-1">Estado actual</p>
          <div class="w-full rounded-lg border border-[--border] bg-[--bg-secondary] px-3 py-2.5 text-sm text-[--text-secondary]">
            <StatusBadge status={selectedApplication.status || 'Sin rol registrado'}/>
          </div>
        </div>
      </div>

      <div>
        <label for="admin_notes" class="block text-sm font-semibold text-[--text-primary] mb-1">
          {#if isReadOnly}
            Notas administrativas
          {:else}
            Notas administrativas / motivo de rechazo
          {/if}
        </label>
        {#if isReadOnly}
          <div class="min-h-[108px] max-h-48 overflow-y-auto w-full rounded-lg border border-[--border] bg-[--bg-secondary] px-3 py-2.5 text-sm text-[--text-secondary]">
            {#if reviewNotes}
              {@html reviewNotes}
            {:else}
              Sin notas registradas
            {/if}
          </div>
        {:else}
          <RichTextField
            name="admin_notes"
            label=""
            value={reviewNotes}
            placeholder="En caso de rechazo, este campo es obligatorio y será visible para el colaborador."
            minHeightClass="min-h-[100px]"
            onchange={(html) => { reviewNotes = html; markTouched('admin_notes'); }}
            counter={APPLICATION_LIMITS.admin_notes.max}
            hint={`Máximo ${APPLICATION_LIMITS.admin_notes.max} caracteres`}
            error={mergedErrors.admin_notes}
            touched={show.admin_notes}
          />
        {/if}
      </div>

      <FormErrorSummary message={topError} onDismiss={() => (topError = '')} />

      <div class="flex flex-wrap justify-end gap-2">
        {#if canSetInReview}
          <Button variant="primary" label="Marcar en revisión" onclick={submitInReview} />
        {/if}
        {#if canReject}
          <Button variant="primary" label="Rechazar" icon="XCircle" onclick={submitRejection} />
        {/if}
        {#if canApprove}
          <Button variant="primary" label="Aprobar" icon="CheckCircle" onclick={submitApproval} />
        {/if}
        <Button variant="primary" label="Cancelar" onclick={closeReviewModal} />
      </div>

      <form bind:this={reviewForm} method="POST" action="?/setInReview" use:enhance={handleReviewAction} class="hidden">
        <input type="hidden" name="application_id" value={selectedApplication.id} />
        <input type="hidden" name="admin_notes" value={reviewNotes} />
      </form>

      <form bind:this={rejectForm} method="POST" action="?/reject" use:enhance={handleReviewAction} class="hidden">
        <input type="hidden" name="application_id" value={selectedApplication.id} />
        <input type="hidden" name="admin_notes" value={reviewNotes} />
      </form>
      <form bind:this={approveForm} method="POST" action="?/approve" use:enhance={handleReviewAction} class="hidden">
        <input type="hidden" name="application_id" value={selectedApplication.id} />
        <input type="hidden" name="admin_notes" value={reviewNotes} />
        <input type="hidden" name="role_in_project" value={roleInProject} />
      </form>
    </div>
  {/if}
</Modal>
