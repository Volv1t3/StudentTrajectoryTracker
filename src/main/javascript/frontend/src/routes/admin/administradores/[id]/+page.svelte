<script lang="ts">
  import { enhance } from '$app/forms';
  import { untrack } from 'svelte';
  import { ArrowLeft } from 'lucide-svelte';
  import FormField from '$lib/components/ui/FormField.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import FormErrorSummary from '$lib/components/ui/FormErrorSummary.svelte';
  import { TelInput } from 'svelte-tel-input';
  import type { CountryCode } from 'svelte-tel-input/types';
  import { validateAdministratorForm, validateAdministratorResetRequest, ADMIN_LIMITS } from '$lib/validation/administrator';
  import { extractApiError, mapBackendFields, summarizeFormError } from '$lib/validation/apiError';
  import { administratorFieldMap } from '$lib/validation/fieldMaps';

  let { data, form: formResult }: { data: { admin: any }; form?: { error?: string; apiError?: unknown; passwordResetSent?: boolean; passwordResetMessage?: string } | null } = $props();
  let a = $derived(data.admin);
  let confirmDelete = $state(false);

  let firstName = $state<string>(data.admin?.first_name || '');
  let middleName = $state<string>(data.admin?.middle_name || '');
  let lastName = $state<string>(data.admin?.last_name || '');
  let secondLastName = $state<string>(data.admin?.second_last_name || '');
  let personalEmail = $state<string>(data.admin?.personal_email || '');
  let usfqEmail = $state<string>(data.admin?.usfq_email || '');
  let phoneNumber = $state<string>(data.admin?.phone_number || '');
  let phoneCountry = $state<CountryCode | null>('EC');
  let phoneValid = $state(true);
  let dateOfBirth = $state<string>(data.admin?.date_of_birth?.slice(0, 10) || '');
  let isActive = $state<boolean>(Boolean(data.admin?.is_active));

  let touched = $state<Record<string, boolean>>({});
  let submitAttempted = $state(false);
  let backendErrors = $state<Record<string, string>>({});
  let topError = $state('');

  let frontErrors = $derived(
    validateAdministratorForm({
      firstName,
      middleName: middleName || null,
      lastName,
      secondLastName: secondLastName || null,
      personalEmail,
      usfqEmail,
      phoneNumber: phoneNumber || null,
      dateOfBirth: dateOfBirth || null,
      isActive,
    }) as Record<string, string>
  );

  function hasContent(v: unknown): boolean {
    if (v == null) return false;
    if (typeof v === 'string') return v.trim() !== '';
    return true;
  }
  let show = $derived<Record<string, boolean>>({
    firstName: touched.firstName || hasContent(firstName) || submitAttempted,
    middleName: touched.middleName || hasContent(middleName) || submitAttempted,
    lastName: touched.lastName || hasContent(lastName) || submitAttempted,
    secondLastName: touched.secondLastName || hasContent(secondLastName) || submitAttempted,
    personalEmail: touched.personalEmail || hasContent(personalEmail) || submitAttempted,
    usfqEmail: touched.usfqEmail || hasContent(usfqEmail) || submitAttempted,
    phoneNumber: touched.phoneNumber || hasContent(phoneNumber) || submitAttempted,
    dateOfBirth: touched.dateOfBirth || hasContent(dateOfBirth) || submitAttempted,
  });

  let errors = $derived<Record<string, string>>({ ...frontErrors, ...backendErrors });
  let isValid = $derived(Object.keys(frontErrors).length === 0);
  let resetRequestErrors = $derived(
    validateAdministratorResetRequest({
      administratorId: Number(data.admin?.id || 0),
      usfqEmail: data.admin?.usfq_email || '',
      isActive: Boolean(data.admin?.is_active),
    })
  );
  let canSendResetLink = $derived(Object.keys(resetRequestErrors).length === 0);

  $effect(() => {
    if (formResult?.apiError !== undefined || formResult?.error !== undefined) {
      const extracted = extractApiError(formResult?.apiError ?? formResult?.error ?? null);
      const mappedBackendErrors = mapBackendFields(extracted.fields, administratorFieldMap);
      const nextTopError = summarizeFormError(extracted);
      const nextTouched: Record<string, boolean> = { ...untrack(() => touched) };
      for (const k of Object.keys(mappedBackendErrors)) nextTouched[k] = true;

      backendErrors = mappedBackendErrors;
      topError = nextTopError;
      submitAttempted = true;
      touched = nextTouched;
    }
  });
</script>

<svelte:head>
  <title>Editar Administrador — Admin DLAB</title>
</svelte:head>

<div class="p-6 md:p-8 max-w-10xl max-h-10xl">
  <a href="/admin/administradores" class="text-sm text-[--text-muted] hover:text-[--text-secondary] flex items-center gap-1.5 mb-6">
    <ArrowLeft size={13} /> Administradores
  </a>
  <header class="mb-6 flex flex-wrap items-center justify-between gap-4">
    <h1 class="text-2xl font-bold text-[--text-primary] mb-6">Editar administrador</h1>
    <div>
      {#if !confirmDelete}
        <Button variant="primary" size="sm" label="Eliminar administrador" onclick={() => confirmDelete = true} />
      {:else}
        <p class="text-sm text-red-600 mb-2">¿Estás seguro? Esta acción no se puede deshacer.</p>
        <form method="POST" action="?/delete" use:enhance class="inline-flex gap-2">
          <Button type="submit" variant="primary" size="sm" label="Confirmar eliminación" />
          <Button variant="primary" size="sm" label="Cancelar" onclick={() => confirmDelete = false} />
        </form>
      {/if}
    </div>
  </header>

  <FormErrorSummary message={topError} onDismiss={() => (topError = '')} />

  <section class="bg-surface rounded-xl border border-[--border] p-6 space-y-4 mb-6">
    <div>
      <h2 class="text-lg font-semibold text-[--text-primary]">Acceso y recuperación</h2>
      <p class="text-sm text-[--text-muted] mt-1">Envía un enlace de restablecimiento al correo institucional del administrador para que pueda definir su propia contraseña.</p>
    </div>

    {#if formResult?.passwordResetSent}
      <div class="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
        {formResult.passwordResetMessage || 'Enlace de restablecimiento enviado'}
      </div>
    {/if}

    {#if !canSendResetLink}
      <p class="text-sm text-red-600">
        {resetRequestErrors.isActive || resetRequestErrors.usfqEmail || resetRequestErrors.administratorId}
      </p>
    {/if}

    <form method="POST" action="?/sendPasswordReset" use:enhance>
      <Button
        type="submit"
        variant="primary"
        size="sm"
        label="Enviar enlace de restablecimiento"
        disabled={!canSendResetLink}
      />
    </form>
  </section>

  <form
    method="POST"
    action="?/update"
    use:enhance={({ cancel }) => {
      submitAttempted = true;
      if (Object.keys(frontErrors).length > 0) {
        const next: Record<string, boolean> = {};
        for (const k of Object.keys(frontErrors)) next[k] = true;
        touched = { ...touched, ...next };
        topError = 'Revisa los campos marcados antes de continuar.';
        cancel();
        return;
      }
      return async ({ update }) => { await update(); };
    }}
    class="bg-surface rounded-xl border border-[--border] p-6 space-y-6"
  >
    <div>
      <h2 class="text-lg font-semibold text-[--text-primary]">Información personal del administrador</h2>
      <p class="text-sm text-[--text-muted] mb-4">Defina la información personal del administrador, esto puede ser modificado por el administrador luego.</p>
      <div class="w-full h-0.5" style="background: var(--accent); opacity: 0.3;"></div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        name="firstName"
        label="Nombre"
        required
        bind:value={firstName}
        counter={ADMIN_LIMITS.firstName.max}
        error={errors.firstName || errors.nombres}
        touched={show.firstName}
      />
      <FormField
        name="middleName"
        label="Segundo nombre"
        hint="Opcional."
        bind:value={middleName}
        counter={ADMIN_LIMITS.middleName.max}
        error={errors.middleName || errors.nombre_medio}
        touched={show.middleName}
      />
      <FormField
        name="lastName"
        label="Apellido"
        required
        bind:value={lastName}
        counter={ADMIN_LIMITS.lastName.max}
        error={errors.lastName || errors.apellidos}
        touched={show.lastName}
      />
      <FormField
        name="secondLastName"
        label="Segundo apellido"
        hint="Opcional."
        bind:value={secondLastName}
        counter={ADMIN_LIMITS.secondLastName.max}
        error={errors.secondLastName || errors.segundo_apellido}
        touched={show.secondLastName}
      />
    </div>

    <div>
      <h2 class="text-lg font-semibold text-[--text-primary]">Información de contacto del administrador</h2>
      <p class="text-sm text-[--text-muted] mb-4">Defina la información de contacto del administrador, esto puede ser modificado por el administrador luego.</p>
      <div class="w-full h-0.5" style="background: var(--accent); opacity: 0.3;"></div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        name="personalEmail"
        type="email"
        label="Correo personal"
        required
        bind:value={personalEmail}
        counter={ADMIN_LIMITS.personalEmail.max}
        error={errors.personalEmail || errors.correo_personal}
        touched={show.personalEmail}
      />
      <FormField
        name="usfqEmail"
        type="email"
        label="Correo institucional USFQ"
        required
        bind:value={usfqEmail}
        counter={ADMIN_LIMITS.usfqEmail.max}
        hint="Debe terminar en .usfq.edu.ec"
        error={errors.usfqEmail || errors.correo_institucional}
        touched={show.usfqEmail}
      />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="phone-input" class="block text-md font-bold mb-1" style="font-family: var(--font-subheading);">Teléfono</label>
        <TelInput
          id="phone-input"
          bind:value={phoneNumber}
          bind:country={phoneCountry}
          bind:valid={phoneValid}
          options={{ autoPlaceholder: true, spaces: true }}
          class="block w-full rounded-lg border border-[--border] px-3 py-2.5 text-sm text-[--text-primary] placeholder-[--text-muted] focus:outline-none focus:ring-2 focus:ring-[--color-red] focus:border-[--color-red] transition-colors duration-150"
          style="background: var(--bg-surface);"
        />
        <input type="hidden" name="phoneNumber" value={phoneNumber} />
        {#if show.phoneNumber && (errors.phoneNumber || errors.telefono)}
          <p class="mt-1 text-xs text-red-500">{errors.phoneNumber || errors.telefono}</p>
        {/if}
      </div>
      <FormField
        name="dateOfBirth"
        type="date"
        label="Fecha de nacimiento"
        hint="Opcional."
        bind:value={dateOfBirth}
        error={errors.dateOfBirth || errors.fecha_nacimiento}
        touched={show.dateOfBirth}
      />
    </div>

    <div class="flex items-center gap-2">
      <input id="isActive" name="isActive" type="checkbox" bind:checked={isActive} class="rounded border-[--border]" />
      <label for="isActive" class="text-sm text-[--text-secondary]">Cuenta activa</label>
    </div>

    <div class="flex gap-3 pt-2">
      <Button type="submit" variant="primary" label="Guardar cambios" disabled={submitAttempted && !isValid} />
      <Button variant="primary" href="/admin/administradores" label="Cancelar" />
    </div>
  </form>
</div>
