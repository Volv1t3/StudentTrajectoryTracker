<script lang="ts">
  import { enhance } from '$app/forms';
  import { ChevronRight } from 'lucide-svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import RichTextField from '$lib/components/ui/RichTextField.svelte';
  import MetaChip from '$lib/components/ui/MetaChip.svelte';
  import FormErrorSummary from '$lib/components/ui/FormErrorSummary.svelte';
  import { validateSubmitApplicationForm, APPLICATION_LIMITS } from '$lib/validation/application';
  import { extractApiError, mapBackendFields, summarizeFormError } from '$lib/validation/apiError';
  import { applicationFieldMap } from '$lib/validation/fieldMaps';

  interface Project {
    id: number;
    nombre: string;
    slug: string;
    disponibilidad_semanal_requerida: string;
    modalidad: string;
    categoria: string;
    current_collaborator_count: number;
    max_collaborators: number | null;
    estado: string;
  }

  interface Props {
    data: {
      project: Project;
      hasLiveApplicationForProject: boolean;
      hasLiveAssignmentForProject: boolean;
      activeAssignmentCount: number;
      hasReachedProjectLimit: boolean;
      isProjectFull: boolean;
      projectAcceptsApplications: boolean;
    };
    form: any;
  }

  let { data, form }: Props = $props();

  let motivacionText = $state('');
  let consentChecked = $state(false);

  let touched = $state<Record<string, boolean>>({});
  let submitAttempted = $state(false);
  let backendErrors = $state<Record<string, string>>({});
  let topError = $state('');

  function stripHtml(s: string) {
    return s.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
  }

  const plainTextLength = $derived(stripHtml(motivacionText).length);

  let frontErrors = $derived(
    validateSubmitApplicationForm({
      project_id: data.project.id,
      reason_for_applying: stripHtml(motivacionText),
    }) as Record<string, string>
  );

  // Local UI rule: still require minimum 100 chars to match prior UX.
  let extraMotivacionError = $derived.by(() => {
    if (plainTextLength === 0) return '';
    if (plainTextLength < 100) return `Mínimo 100 caracteres (faltan ${100 - plainTextLength})`;
    return '';
  });

  let show = $derived<Record<string, boolean>>({
    mensaje_motivacion: touched.mensaje_motivacion || plainTextLength > 0 || submitAttempted,
    disponibilidad_confirmada: touched.disponibilidad_confirmada || consentChecked || submitAttempted,
  });

  let errors = $derived<Record<string, string>>({
    ...frontErrors,
    ...backendErrors,
    ...(extraMotivacionError ? { mensaje_motivacion: extraMotivacionError } : {}),
  });

  let isValid = $derived(plainTextLength >= 100 && consentChecked);

  $effect(() => {
    if (form?.apiError !== undefined || form?.error !== undefined) {
      const extracted = extractApiError(form?.apiError ?? form?.error ?? null);
      backendErrors = mapBackendFields(extracted.fields, applicationFieldMap);
      topError = summarizeFormError(extracted);
      submitAttempted = true;
      const next: Record<string, boolean> = { ...touched };
      for (const k of Object.keys(backendErrors)) next[k] = true;
      touched = next;
    }
  });
</script>

<svelte:head>
  <title>Aplicar a {data.project.nombre} — DLAB</title>
</svelte:head>

<div class="max-w-2xl mx-auto px-4 sm:px-6 py-10">
  <nav class="flex items-center gap-2 text-sm text-[--text-muted] mb-6">
    <a href="/projects" class="hover:text-[--text-secondary] transition-colors">Proyectos</a>
    <ChevronRight size={13} />
    <a href={`/projects/${data.project.slug}`} class="hover:text-[--text-secondary] transition-colors truncate max-w-xs">{data.project.nombre}</a>
    <ChevronRight size={13} />
    <span class="text-[--text-primary] font-medium">Aplicar</span>
  </nav>

  {#if form?.success}
    <div class="bg-surface rounded-xl border border-[--border] p-8 text-center">
      <div class="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-600"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      </div>
      <h2 class="text-lg font-bold text-[--text-primary]">¡Solicitud enviada!</h2>
      <p class="text-sm text-[--text-secondary] mt-2">Te notificaremos cuando tu solicitud sea revisada.</p>
      <div class="flex gap-3 justify-center mt-6">
        <Button variant="secondary" href="/my-applications" label="Ver mis solicitudes" />
        <Button variant="ghost" href="/projects" label="Ver más proyectos" />
      </div>
    </div>
  {:else if !data.projectAcceptsApplications}
    <div class="bg-blue-50 border border-blue-200 rounded-xl p-7 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-auto text-blue-500 mb-3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
      <h2 class="text-base font-semibold text-blue-900">Este proyecto no está aceptando solicitudes</h2>
      <p class="text-sm text-blue-700 mt-1.5">El estado actual del proyecto no permite recibir nuevas solicitudes.</p>
      <Button variant="primary" href={`/projects/${data.project.slug}`} label="Volver al proyecto" classes="mt-5" />
    </div>
  {:else if data.isProjectFull}
    <div class="bg-blue-50 border border-blue-200 rounded-xl p-7 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-auto text-blue-500 mb-3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
      <h2 class="text-base font-semibold text-blue-900">El proyecto alcanzó su cupo máximo</h2>
      <p class="text-sm text-blue-700 mt-1.5">Actualmente registra {data.project.current_collaborator_count} integrante(s){#if data.project.max_collaborators !== null} de un total de {data.project.max_collaborators}{/if}.</p>
      <Button variant="primary" href={`/projects/${data.project.slug}`} label="Volver al proyecto" classes="mt-5" />
    </div>
  {:else if data.hasLiveAssignmentForProject}
    <div class="bg-blue-50 border border-blue-200 rounded-xl p-7 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-auto text-blue-500 mb-3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
      <h2 class="text-base font-semibold text-blue-900">Ya estás vinculado a este proyecto</h2>
      <p class="text-sm text-blue-700 mt-1.5">Ya tienes una vinculación activa o pausada con este proyecto.</p>
      <Button variant="primary" href="/my-assignments" label="Ver mis vinculaciones" classes="mt-5" />
    </div>
  {:else if data.hasLiveApplicationForProject}
    <div class="bg-blue-50 border border-blue-200 rounded-xl p-7 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-auto text-blue-500 mb-3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
      <h2 class="text-base font-semibold text-blue-900">Ya tienes una solicitud activa</h2>
      <p class="text-sm text-blue-700 mt-1.5">Ya tienes una solicitud pendiente o en revisión para este proyecto. Puedes ver el estado en tus solicitudes.</p>
      <Button variant="primary" href="/my-applications" label="Ver mis solicitudes" classes="mt-5" />
    </div>
  {:else if data.hasReachedProjectLimit}
    <div class="bg-blue-50 border border-blue-200 rounded-xl p-7 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-auto text-blue-500 mb-3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
      <h2 class="text-base font-semibold text-blue-900">Ya alcanzaste el máximo de proyectos activos</h2>
      <p class="text-sm text-blue-700 mt-1.5">
        No puedes aplicar a más proyectos mientras tengas {data.activeAssignmentCount} vinculaciones activas.
        Revisa tus solicitudes o espera a finalizar una participación actual antes de volver a aplicar.
      </p>
      <div class="flex gap-3 justify-center mt-6">
        <Button variant="secondary" href="/my-applications" label="Ver mis solicitudes" />
        <Button variant="ghost" href="/projects" label="Ver más proyectos" />
      </div>
    </div>
  {:else}
    <div class="bg-[--color-crimson]  rounded-xl p-5 mb-5">
      <p class="text-xs font-bold uppercase tracking-widest mb-1" style="color: var(--color-primary);">Aplicando a</p>
      <h2 class="text-lg font-bold">{data.project.nombre}</h2>
    <div class="flex flex-wrap gap-2 mt-2">
      <MetaChip icon="Clock" value={data.project.disponibilidad_semanal_requerida} classes="bg-white/10 text-[--color-text-muted-on-dark]" />
      <MetaChip icon="MapPin" value={data.project.modalidad} classes="bg-white/10 text-[--color-text-muted-on-dark]" />
      <MetaChip icon="Tag" value={data.project.categoria} classes="bg-white/10 text-[--color-text-muted-on-dark]" />
      </div>
    </div>

    <form
      method="POST"
      action="?/applyToProject"
      use:enhance={({ cancel }) => {
        submitAttempted = true;
        if (!isValid || Object.keys(frontErrors).length > 0 || extraMotivacionError) {
          touched = { ...touched, mensaje_motivacion: true, disponibilidad_confirmada: true };
          topError = 'Revisa los campos marcados antes de continuar.';
          cancel();
          return;
        }
        return async ({ update }) => { await update(); };
      }}
      class="bg-surface rounded-xl border border-[--border] p-6 space-y-5"
    >
      <input type="hidden" name="proyecto_id" value={data.project.id} />
      <FormErrorSummary message={topError} onDismiss={() => (topError = '')} />
      <RichTextField
        name="mensaje_motivacion"
        label="¿Por qué quieres unirte a este proyecto?"
        required
        placeholder="Describe tu interés específico... (mínimo 100 caracteres)"
        minHeightClass="min-h-[160px]"
        onchange={(html) => { motivacionText = html; if (!touched.mensaje_motivacion) touched = { ...touched, mensaje_motivacion: true }; }}
        counter={APPLICATION_LIMITS.reason_for_applying.max}
        hint={`Mínimo 100 caracteres, máximo ${APPLICATION_LIMITS.reason_for_applying.max}`}
        error={errors.mensaje_motivacion || errors.reason_for_applying}
        touched={show.mensaje_motivacion}
      />
      <div>
        <label class="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="disponibilidad_confirmada"
            bind:checked={consentChecked}
            class="mt-0.5 h-4 w-4 rounded border-[--border] text-[--color-red] focus:ring-[--color-red]"
          />
          <span class="text-sm text-[--text-secondary] leading-relaxed">
            Confirmo que tengo disponibilidad de <strong>{data.project.disponibilidad_semanal_requerida}</strong> para este proyecto.
            <span class="text-red-500">*</span>
          </span>
        </label>
        {#if show.disponibilidad_confirmada && !consentChecked}
          <p class="text-xs text-red-500 mt-1 ml-7">Debes confirmar tu disponibilidad</p>
        {/if}
      </div>
      <div class="flex gap-3 pt-1">
        <Button type="submit" variant="primary" label="Enviar solicitud" disabled={submitAttempted ? ( motivacionText.length === 0) : ( !submitAttempted && !isValid)} />
        <Button type="button" variant="secondary" href={`/projects/${data.project.slug}`} label="Cancelar" />
      </div>
    </form>
  {/if}
</div>
