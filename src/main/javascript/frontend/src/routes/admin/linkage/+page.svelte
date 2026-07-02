<script lang="ts">
    import {applyAction, enhance} from '$app/forms';
    import {untrack} from 'svelte';
    import {
        Search,
    } from 'lucide-svelte';
    import Modal from '$lib/components/ui/Modal.svelte';
    import StatusBadge from '$lib/components/ui/StatusBadge.svelte';
    import Button from '$lib/components/ui/Button.svelte';
    import RichTextField from '$lib/components/ui/RichTextField.svelte';
    import FormErrorSummary from '$lib/components/ui/FormErrorSummary.svelte';
    import {
        validateUpdateAssignmentForm,
        APPLICATION_LIMITS,
    } from '$lib/validation/application';
    import {
        extractApiError,
        mapBackendFields,
        summarizeFormError,
    } from '$lib/validation/apiError';
    import {applicationFieldMap} from '$lib/validation/fieldMaps';
    import type {AssignmentRow, AssignmentStatus, AssignmentSummary} from '$lib/types';

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
            apiError?: unknown;
        };
    }

    let {data, form}: Props = $props();

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

    function stripHtml(s: string) {
        return s.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
    }

    let editEndReasonPlain = $derived(stripHtml(editEndReason));

    let editFrontErrors = $derived(
        validateUpdateAssignmentForm({
            role_in_project: editRole || undefined,
            status: editStatus,
            end_reason: editEndReasonPlain || undefined,
        }) as Record<string, string>
    );

    let editBackendErrors = $state<Record<string, string>>({});
    let editTopError = $state('');
    let editTouched = $state<Record<string, boolean>>({});
    let editSubmitAttempted = $state(false);

    let editErrors = $derived<Record<string, string>>({...editFrontErrors, ...editBackendErrors});
    let editIsValid = $derived(Object.keys(editFrontErrors).length === 0);

    $effect(() => {
        if (
            currentForm.scope === 'edit' &&
            (currentForm.apiError !== undefined || currentForm.error !== undefined)
        ) {
            const extracted = extractApiError(currentForm.apiError ?? currentForm.error ?? null);
            const mappedBackendErrors = mapBackendFields(extracted.fields, applicationFieldMap);
            const nextTopError = summarizeFormError(extracted);
            const nextTouched: Record<string, boolean> = {...untrack(() => editTouched)};
            for (const k of Object.keys(mappedBackendErrors)) nextTouched[k] = true;

            editBackendErrors = mappedBackendErrors;
            editTopError = nextTopError;
            editSubmitAttempted = true;
            editTouched = nextTouched;
        }
    });

    const availableEditStatuses = $derived.by(() => {
        if (!selectedAssignment) return ['Activo', 'Pausado', 'Finalizado', 'Removido'] as AssignmentStatus[];
        if (['Finalizado', 'Removido'].includes(selectedAssignment.status)) {
            return [selectedAssignment.status];
        }
        return ['Activo', 'Pausado', 'Finalizado', 'Removido'] as AssignmentStatus[];
    });

    const editError = $derived(currentForm.scope === 'edit' ? currentForm.error || '' : '');

    function submitLinkageUpdate() {
        editSubmitAttempted = true;
        if (Object.keys(editFrontErrors).length > 0) {
            const next: Record<string, boolean> = {...editTouched};
            for (const k of Object.keys(editFrontErrors)) next[k] = true;
            editTouched = next;
            editTopError = 'Revisa los campos marcados antes de continuar.';
            return;
        }
        updateForm?.requestSubmit();
    }

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

    function submitLinkageDelete() {
        deleteForm?.requestSubmit();
    }

    function markEditTouched(key: string) {
        if (!editTouched[key]) editTouched = {...editTouched, [key]: true};
        if (editBackendErrors[key]) {
            const {[key]: _d, ...rest} = editBackendErrors;
            editBackendErrors = rest;
        }
    }

    function handleLinkageAction() {
        return async ({result, update}: {
            result: any;
            update: (options?: { reset?: boolean; invalidateAll?: boolean }) => Promise<void>
        }) => {
            if (result?.type === 'success') {
                closeEditModal();
                await update({reset: false, invalidateAll: true});
                return;
            }
            await applyAction(result);
        };
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
				<p class="text-sm text-[--text-muted]">Gestiona cambios de estado, edición de rol y vinculaciones
					manuales desde una sola mesa de trabajo.</p>
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
			<span
				class="rounded-full bg-surface px-3 py-1.5 text-sm font-semibold text-[--text-primary]">Total: {data.summary.total}</span>
			<span
				class="rounded-full bg-surface px-3 py-1.5 text-sm font-semibold text-green-700">Activo: {data.summary.statusCounts.Activo}</span>
			<span
				class="rounded-full bg-surface px-3 py-1.5 text-sm font-semibold text-yellow-700">Pausado: {data.summary.statusCounts.Pausado}</span>
			<span
				class="rounded-full bg-surface px-3 py-1.5 text-sm font-semibold text-[--text-secondary]">Finalizado: {data.summary.statusCounts.Finalizado}</span>
			<span
				class="rounded-full bg-surface px-3 py-1.5 text-sm font-semibold text-red-700">Removido: {data.summary.statusCounts.Removido}</span>
		</div>
	</header>

	<section class="space-y-4">
		<div class="flex flex-wrap gap-3">
			<select bind:value={statusFilter}
			        class="rounded-lg border border-[--border] bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-red]">
				<option value="">Todos los estados</option>
				<option value="Activo">Activo</option>
				<option value="Pausado">Pausado</option>
				<option value="Finalizado">Finalizado</option>
				<option value="Removido">Removido</option>
			</select>

			<select bind:value={projectFilter}
			        class="rounded-lg border border-[--border] bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-red]">
				<option value="">Todos los proyectos</option>
				{#each projectOptions as project}
					<option value={project.id}>{project.title}</option>
				{/each}
			</select>

			<div class="relative min-w-64 flex-1">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted]" size={14}/>
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
				<thead
					class="border-b border-[--border] bg-[--bg-secondary] text-xs uppercase tracking-wide text-[--text-muted]">
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
							<a href="/admin/colaboradores/{linkage.collaborator_id}"
							   class="font-medium text-[--text-primary] transition-colors hover:text-[--color-red]">
								{linkage.collaborator_name}
							</a>
							<p class="text-xs text-[--text-muted]">{linkage.collaborator_email}</p>
						</td>
						<td class="px-4 py-3">
							<a href="/admin/projects/{linkage.project_id}"
							   class="font-medium text-[--text-primary] transition-colors hover:text-[--color-red]">
								{linkage.project_title}
							</a>
							<p class="text-xs text-[--text-muted]">/{linkage.project_slug}</p>
						</td>
						<td class="px-4 py-3 text-[--text-secondary]">{linkage.role_in_project || '—'}</td>
						<td class="px-4 py-3">
							<StatusBadge status={linkage.status}/>
						</td>
						<td class="px-4 py-3 text-xs text-[--text-muted]">{formatDate(linkage.assigned_at)}</td>
						<td class="px-4 py-3">
							<Button variant="primary" size="sm" icon="Pencil" label="Editar"
							        onclick={() => openEditModal(linkage)}/>
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
			<div class="grid gap-4 md:grid-cols-2">

				<div class="rounded-xl border border-[--border] bg-[--bg-secondary] p-4">
					<p class="text-sm font-semibold text-[--text-primary] mb-2">Fecha de Vinculación</p>
					<p class="font-medium text-[--text-primary]">{formatDate(selectedAssignment.assigned_at)}</p>
				</div>
				<div class="rounded-xl border border-[--border] bg-[--bg-secondary] p-4">
					<p class="text-sm font-semibold text-[--text-primary] mb-2">Vinculado por</p>
					<p class="font-medium text-[--text-primary]">{selectedAssignment.assigned_by_admin_name || 'Sin administrador registrado'}</p>
				</div>
			</div>
			<div>
				<h2 class="text-lg font-semibold text-[--text-primary]">Razón de Vinculación y Notas
					Administrativas</h2>
				<p class="text-sm text-[--text-muted] mb-4">Visualización de la razón de vinculación registrada y notas
					administrativas asociadas</p>
				<div class="w-full h-0.5" style="background: var(--accent); opacity: 0.3;"></div>
			</div>
			<div class="grid gap-4 md:grid-cols-2">
				<div class="rounded-xl border border-[--border] bg-[--bg-secondary] p-4">
					<p class="text-sm font-semibold text-[--text-primary] mb-2">Razón de la Vinculación</p>
					<div class="prose prose-sm max-w-none text-[--text-primary]">
						{@html selectedAssignment.assignment_reason || '<p>Sin razón registrada.</p>'}
					</div>
				</div>
				<div class="rounded-xl border border-[--border] bg-[--bg-secondary] p-4">
					<p class="text-sm font-semibold text-[--text-primary] mb-2">Notas administrativas</p>
					<div class="prose prose-sm max-w-none text-[--text-primary]">
						{@html selectedAssignment.assignment_admin_notes || '<p>Sin notas administrativas registradas.</p>'}
					</div>
				</div>
			</div>

			{#if editTopError || editError}
				<FormErrorSummary message={editTopError || editError} onDismiss={() => (editTopError = '')}/>
			{/if}

			<div>
				<h2 class="text-lg font-semibold text-[--text-primary]">Edición de vinculación</h2>
				<p class="text-sm text-[--text-muted] mb-4">Actualice el rol, el estado o agregue un motivo de
					cierre.</p>
				<div class="w-full h-0.5" style="background: var(--accent); opacity: 0.3;"></div>
			</div>
			<div class="grid gap-4 md:grid-cols-2">
				<div>
					<label for="edit_role" class="block text-sm font-semibold text-[--text-primary] mb-1">Rol en el
						proyecto</label>
					<input
						id="edit_role"
						type="text"
						bind:value={editRole}
						oninput={() => markEditTouched('role_in_project')}
						maxlength={APPLICATION_LIMITS.role_in_project.max}
						class="w-full rounded-xl border border-[--border]  text-sm bg-[--bg-secondary] p-4 max-w-none "
						class:border-red-400={(editTouched.role_in_project || editSubmitAttempted) && !!editErrors.role_in_project}
						class:border-[--border]={!((editTouched.role_in_project || editSubmitAttempted) && !!editErrors.role_in_project)}
					/>
					{#if (editTouched.role_in_project || editSubmitAttempted) && editErrors.role_in_project}
						<p class="mt-1 text-xs text-red-500">{editErrors.role_in_project}</p>
					{:else}
						<p class="mt-1 text-xs text-[--text-muted]">Máximo {APPLICATION_LIMITS.role_in_project.max}
							caracteres.</p>
					{/if}
				</div>
				<div>
					<label for="edit_status"
					       class="flex text-sm font-semibold text-[--text-primary] mb-1">Estado</label>
					{#if selectedAssignment.status !== 'Finalizado'}
						<select
							id="edit_status"
							bind:value={editStatus}
							onchange={() => markEditTouched('status')}
							class="rounded-xl border border-[--border] bg-[--bg-secondary] p-4 max-w-none w-full text-sm"
							class:border-red-400={(editTouched.status || editSubmitAttempted) && !!editErrors.status}
							class:border-[--border]={!((editTouched.status || editSubmitAttempted) && !!editErrors.status)}
						>
							{#each availableEditStatuses as status}
								<option value={status}>{status}</option>
							{/each}
						</select>
						{:else}
						<div class="rounded-xl border border-[--border] bg-[--bg-secondary] p-4">
							<div class="prose text-sm max-w-none text-[--text-primary]">
								{@html selectedAssignment.status || '<p>Sin estado registrado.</p>'}
							</div>
						</div>
						{/if}
					{#if (editTouched.status || editSubmitAttempted) && editErrors.status}
						<p class="mt-1 text-xs text-red-500">{editErrors.status}</p>
					{/if}
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
						placeholder={(selectedAssignment.end_reason !== null && selectedAssignment.end_reason.length > 0) ? stripHtml(selectedAssignment.end_reason) : 'Ingrese el motivo del cambio de estado aquí'}
						minHeightClass="min-h-[100px]"
						onchange={(html) => { editEndReason = html; markEditTouched('end_reason'); }}
						counter={APPLICATION_LIMITS.end_reason.max}
						hint={`Máximo ${APPLICATION_LIMITS.end_reason.max} caracteres`}
						error={editErrors.end_reason}
						touched={editTouched.end_reason || editSubmitAttempted}
					/>
				</div>
			{/if}

			<div class="flex flex-wrap justify-between gap-3 border-t border-[--border] pt-4">
				<Button variant="primary" size="sm" icon="Trash2" label="Eliminar vinculación"
				        onclick={submitLinkageDelete}/>

				<div class="flex flex-wrap gap-2">
					<Button variant="primary" size="sm" label="Cancelar" onclick={closeEditModal}/>
					<Button variant="primary" size="sm" icon="Pencil" label="Guardar cambios"
					        onclick={submitLinkageUpdate} disabled={(editStatus === 'Finalizado' && editEndReason.length === 0) || !editIsValid}/>
				</div>
			</div>

			<form bind:this={updateForm} method="POST" action="?/updateLinkage" use:enhance={handleLinkageAction}
			      class="hidden">
				<input type="hidden" name="id" value={selectedAssignment.id}/>
				<input type="hidden" name="role_in_project" value={editRole}/>
				<input type="hidden" name="status" value={editStatus}/>
				<input type="hidden" name="end_reason" value={editEndReason}/>
			</form>

			<form bind:this={deleteForm} method="POST" action="?/deleteLinkage" use:enhance={handleLinkageAction}
			      class="hidden">
				<input type="hidden" name="id" value={selectedAssignment.id}/>
			</form>
		</div>
	{/if}
</Modal>
