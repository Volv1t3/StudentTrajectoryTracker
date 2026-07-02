<script lang="ts">
  import { enhance } from '$app/forms';
  import { untrack } from 'svelte';
  import { ArrowLeft } from 'lucide-svelte';
  import { PASSWORD_POLICY_HINT } from '$lib/utils/password';
  import FormField from '$lib/components/ui/FormField.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import FormErrorSummary from '$lib/components/ui/FormErrorSummary.svelte';
  import { TelInput } from 'svelte-tel-input';
  import type { CountryCode } from 'svelte-tel-input/types';
  import { validateAdministratorForm, ADMIN_LIMITS } from '$lib/validation/administrator';
  import { validatePasswordPolicy as runPasswordPolicy } from '$lib/utils/password';
  import { extractApiError, mapBackendFields, summarizeFormError } from '$lib/validation/apiError';
  import { administratorFieldMap } from '$lib/validation/fieldMaps';

  let { form }: { form?: { error?: string; apiError?: unknown } } = $props();

  // Field state (frontend names mirror backend camelCase)
  let firstName = $state('');
  let middleName = $state('');
  let lastName = $state('');
  let secondLastName = $state('');
  let personalEmail = $state('');
  let usfqEmail = $state('');
  let phoneNumber = $state('');
  let phoneCountry = $state<CountryCode | null>('EC');
  let phoneValid = $state(true);
  let dateOfBirth = $state('');
  let password = $state('');
  let confirmPassword = $state('');

  let touched = $state<Record<string, boolean>>({});
  let submitAttempted = $state(false);
  let backendErrors = $state<Record<string, string>>({});
  let topError = $state('');

  function markTouched(key: string) {
    if (!touched[key]) touched = { ...touched, [key]: true };
    if (backendErrors[key]) {
      const { [key]: _drop, ...rest } = backendErrors;
      backendErrors = rest;
    }
  }

  let baseErrors = $derived(
    validateAdministratorForm({
      firstName,
      middleName: middleName || null,
      lastName,
      secondLastName: secondLastName || null,
      personalEmail,
      usfqEmail,
      phoneNumber: phoneNumber || null,
      dateOfBirth: dateOfBirth || null,
      password: password || null,
    }) as Record<string, string>
  );

  let passwordError = $derived.by(() => {
    if (!password) return 'La contraseña es obligatoria';
    return runPasswordPolicy(password) ?? '';
  });
  let confirmError = $derived.by(() => {
    if (!confirmPassword) return 'Confirma la contraseña';
    if (confirmPassword !== password) return 'Las contraseñas no coinciden';
    return '';
  });

  let frontErrors = $derived<Record<string, string>>({
    ...baseErrors,
    ...(passwordError ? { password: passwordError } : {}),
    ...(confirmError ? { confirmPassword: confirmError } : {}),
  });

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
    password: touched.password || hasContent(password) || submitAttempted,
    confirmPassword: touched.confirmPassword || hasContent(confirmPassword) || submitAttempted,
  });

  let errors = $derived<Record<string, string>>({ ...frontErrors, ...backendErrors });
  let isValid = $derived(Object.keys(frontErrors).length === 0);

  $effect(() => {
    if (form?.apiError !== undefined || form?.error !== undefined) {
      const extracted = extractApiError(form?.apiError ?? form?.error ?? null);
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
  <title>Nuevo Administrador — Admin DLAB</title>
</svelte:head>

<div class="p-6 md:p-8 max-w-10xl max-h-10xl">
  <a href="/admin/administradores" class="text-sm text-[--text-muted] hover:text-[--text-secondary] flex items-center gap-1.5 mb-6">
    <ArrowLeft size={13} /> Administradores
  </a>
  <h1 class="text-3xl font-bold text-[--text-primary] mb-6">Nuevo administrador</h1>

  <FormErrorSummary message={topError} onDismiss={() => (topError = '')} />

  <form
    method="POST"
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
    class="bg-surface rounded-xl border border-[--border] p-6 space-y-8 mt-4"
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

    <div>
      <h2 class="text-lg font-semibold text-[--text-primary]">Contraseña del administrador</h2>
      <p class="text-sm text-[--text-muted] mb-4">Defina la contraseña personal del administrador, esto no se puede modificar luego.</p>
      <div class="w-full h-0.5" style="background: var(--accent); opacity: 0.3;"></div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        name="password"
        type="password"
        label="Contraseña"
        required
        hint={PASSWORD_POLICY_HINT}
        bind:value={password}
        error={errors.password || errors.contrasena}
        touched={show.password}
      />
      <FormField
        name="confirmPassword"
        type="password"
        label="Confirmar contraseña"
        required
        bind:value={confirmPassword}
        error={errors.confirmPassword}
        touched={show.confirmPassword}
      />
    </div>

    <div class="flex gap-3 pt-2">
      <Button type="submit" variant="primary" label="Crear administrador" disabled={submitAttempted && !isValid} />
      <Button variant="primary" href="/admin/administradores" label="Cancelar" />
    </div>
  </form>
</div>
