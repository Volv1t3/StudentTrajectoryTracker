<script lang="ts">
  import { ArrowLeft} from 'lucide-svelte';
  import { enhance } from '$app/forms';
  import StatusBadge from '$lib/components/ui/StatusBadge.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import CollaboratorProfileView from '$lib/components/profile/CollaboratorProfileView.svelte';

  interface Colaborador {
    id: number;
    firstName: string;
    middleName: string;
    lastName: string;
    secondLastName: string;
    personalEmail: string;
    usfqEmail: string;
    phoneNumber: string;
    dateOfBirth: string;
    major: string;
    currentUniversityYear: number;
    expectedGraduationYear: number;
    experienceDescription: string;
    motivationDescription: string;
    interestInMachinery: boolean;
    interestInDesign: boolean;
    interestInMaterials: boolean;
    trajectoryStatus: string;
    normalizedTrajectoryStatus: string;
    profileComplete: boolean;
    habilidades: string[];
    habilidadIds: number[];
    availabilitySlots: Array<{
      day_of_week: string;
      time_from: string;
      time_to: string;
      notes: string;
    }>;
    activacionPendiente: boolean;
    notaInterna?: string;
    updated_at: string;
    aplicaciones: Array<{ id: number; proyecto_id: number; proyecto_nombre: string; estado: string; fecha_aplicacion: string }>;
  }

  interface Props {
    data: { colaborador: Colaborador };
    form?: { error?: string; success?: boolean };
  }

  let { data, form }: Props = $props();
  let approveModalOpen = $state(false);
  let rejectModalOpen = $state(false);
  let deactivateModalOpen = $state(false);

  const c = $derived(data.colaborador);
</script>

<svelte:head>
  <title>{c.firstName} {c.lastName} — Admin DLAB</title>
</svelte:head>

<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
  <div class="flex items-center justify-between gap-4 mb-6">
    <a href="/admin/colaboradores" class="text-sm text-[--text-muted] hover:text-[--text-secondary] flex items-center gap-1.5 transition-colors">
      <ArrowLeft size={13} /> Colaboradores
    </a>
    <div class="flex flex-wrap gap-2">
      {#if ['nuevo', 'en_revision'].includes(c.normalizedTrajectoryStatus)}
        <Button variant="primary" icon="CheckCircle" label="Aprobar" onclick={() => approveModalOpen = true} />
        {#if c.normalizedTrajectoryStatus === 'nuevo'}
          <form method="POST" action="?/markInReview" use:enhance>
            <Button type="submit" variant="secondary" label="Marcar en revisión" />
          </form>
        {/if}
        <Button variant="primary" icon="XCircle" label="Rechazar" onclick={() => rejectModalOpen = true} />
      {/if}
      {#if c.normalizedTrajectoryStatus === 'contactado' && c.activacionPendiente}
        <Button variant="primary" icon="CheckCircle" label="Reenviar activación" onclick={() => approveModalOpen = true} />
      {/if}
      {#if c.normalizedTrajectoryStatus !== 'inactivo'}
        <Button variant="primary" label="Desactivar" onclick={() => deactivateModalOpen = true} />
      {/if}
    </div>
  </div>

  {#if form?.error}
    <div class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {form.error}
    </div>
  {/if}

  <header class="flex items-center justify-between mb-8">
    <div>
      <h1 class="text-2xl font-bold text-[--text-primary]">Perfil de colaborador</h1>
      <p class="text-[--text-muted] text-sm mt-0.5">Vista administrativa del perfil en D.Lab</p>
    </div>
  </header>

  <div class="space-y-5">
    <CollaboratorProfileView colaborador={c} applicationsHref="/admin/applications" applicationsLabel="Ver solicitudes" />

    <div class="md:col-span-12 grid grid-cols-1 md:grid-cols-1 gap-5">
      <div class="bg-surface rounded-xl border border-[--border] p-6">
        <h3 class="font-semibold text-[--text-primary] mb-3">Historial de aplicaciones</h3>
        {#if c.aplicaciones.length > 0}
          {#each c.aplicaciones as app}
            <div class="flex items-center justify-between py-2 border-b border-[--border] last:border-0">
              <a href="/admin/applications" class="text-sm font-medium hover:text-[--color-red] transition-colors">{app.proyecto_nombre}</a>
              <StatusBadge status={app.estado} />
            </div>
          {/each}
        {:else}
          <p class="text-xs text-[--text-muted] mt-2">Sin solicitudes</p>
        {/if}
      </div>

      
    </div>
  </div>
</div>

<Modal open={approveModalOpen} title={c.normalizedTrajectoryStatus === 'contactado' ? 'Reenviar activación' : 'Aprobar colaborador'} onclose={() => approveModalOpen = false}>
  <p class="text-sm text-[--text-secondary]">
    {#if c.normalizedTrajectoryStatus === 'contactado'}
      Se reenviará un email de activación a <strong>{c.usfqEmail}</strong>.
    {:else}
      ¿Confirmas la aprobación de <strong>{c.firstName} {c.lastName}</strong>?
      Se enviará un email de activación a <strong>{c.usfqEmail}</strong>.
    {/if}
  </p>
  {#snippet footer()}
    <Button variant="secondary" onclick={() => approveModalOpen = false} label="Cancelar" />
    <form method="POST" action="?/approve" use:enhance>
      <Button type="submit" variant="primary" icon="CheckCircle" label={c.normalizedTrajectoryStatus === 'contactado' ? 'Reenviar activación' : 'Confirmar aprobación'} />
    </form>
  {/snippet}
</Modal>

<Modal open={rejectModalOpen} title="Rechazar colaborador" onclose={() => rejectModalOpen = false}>
  <p class="text-sm text-[--text-secondary]">
    Se eliminará el registro del colaborador y cualquier habilidad que quede huérfana tras el rechazo.
  </p>
  <form method="POST" action="?/reject" use:enhance class="mt-3">
    <textarea name="reason" placeholder="Motivo del rechazo..." rows={3} class="w-full text-sm border border-[--border] rounded-lg p-2.5 resize-none"></textarea>
    <div class="mt-3 flex justify-end gap-2">
      <Button variant="secondary" type="button" onclick={() => rejectModalOpen = false} label="Cancelar" />
      <Button type="submit" variant="danger" icon="XCircle" label="Confirmar rechazo" />
    </div>
  </form>
</Modal>

<Modal open={deactivateModalOpen} title="Desactivar colaborador" onclose={() => deactivateModalOpen = false}>
  <p class="text-sm text-[--text-secondary]">
    ¿Estás seguro de que deseas desactivar a <strong>{c.firstName}</strong>?
    Esto cambiará su estado a <StatusBadge status="inactivo" /> y no podrá iniciar sesión.
  </p>
  <form method="POST" action="?/deactivate" use:enhance class="mt-3">
    <textarea name="rejection_note" placeholder="Razón de la desactivación..." rows={2} class="w-full text-sm border border-[--border] rounded-lg p-2.5 resize-none"></textarea>
  </form>
  {#snippet footer()}
    <Button variant="primary" onclick={() => deactivateModalOpen = false} label="Cancelar" />
    <form method="POST" action="?/deactivate" use:enhance>
      <Button type="submit" variant="primary" label="Confirmar desactivación" />
    </form>
  {/snippet}
</Modal>
