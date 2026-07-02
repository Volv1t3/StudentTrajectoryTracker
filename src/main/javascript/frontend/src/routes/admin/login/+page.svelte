<script lang="ts">
  import { enhance } from '$app/forms';
  import { untrack } from 'svelte';
  import FormField from '$lib/components/ui/FormField.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import SpiralBackground from '$lib/components/layout/SpiralBackground.svelte';
  import FormErrorSummary from '$lib/components/ui/FormErrorSummary.svelte';
  import { validateLoginForm } from '$lib/validation/auth';
  import { extractApiError, mapBackendFields, summarizeFormError } from '$lib/validation/apiError';
  import { authFieldMap } from '$lib/validation/fieldMaps';

  interface Props {
    data: { logo?: string | null };
    form: any;
  }

  let { data, form }: Props = $props();

  let correo = $state('');
  let contrasena = $state('');

  let touched = $state<Record<string, boolean>>({});
  let submitAttempted = $state(false);
  let backendErrors = $state<Record<string, string>>({});
  let topError = $state('');

  let frontErrors = $derived(
    validateLoginForm({ email: correo, password: contrasena }) as Record<string, string>
  );

  function hasContent(v: unknown): boolean {
    if (v == null) return false;
    if (typeof v === 'string') return v.trim() !== '';
    return true;
  }

  let show = $derived<Record<string, boolean>>({
    correo: touched.correo || hasContent(correo) || submitAttempted,
    contrasena: touched.contrasena || hasContent(contrasena) || submitAttempted,
  });

  let errors = $derived<Record<string, string>>({ ...frontErrors, ...backendErrors });
  let isValid = $derived(Object.keys(frontErrors).length === 0);

  $effect(() => {
    if (form?.apiError !== undefined || form?.error !== undefined) {
      const extracted = extractApiError(form?.apiError ?? form?.error ?? null);
      const mappedBackendErrors = mapBackendFields(extracted.fields, authFieldMap);
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
  <title>Admin — DLAB</title>
</svelte:head>

<div class="relative min-h-screen flex items-center justify-center px-4 overflow-hidden" style="background: var(--light);">
  <SpiralBackground />
  <div class="absolute inset-0 pointer-events-none" style="background: linear-gradient(to bottom, color-mix(in srgb, var(--deep) 45%, transparent), transparent, color-mix(in srgb, var(--deep) 65%, transparent));"></div>

  <div class="absolute top-6 left-6 w-5 h-5 sm:w-7 sm:h-7 lg:w-10 lg:h-10 border-t-2 border-l-2 opacity-40 z-20" style="border-color: var(--border);"></div>
  <div class="absolute top-6 right-6 w-5 h-5 sm:w-7 sm:h-7 lg:w-10 lg:h-10 border-t-2 border-r-2 opacity-40 z-20" style="border-color: var(--border);"></div>
  <div class="absolute bottom-6 left-6 w-5 h-5 sm:w-7 sm:h-7 lg:w-10 lg:h-10 border-b-2 border-l-2 opacity-40 z-20" style="border-color: var(--border);"></div>
  <div class="absolute bottom-6 right-6 w-5 h-5 sm:w-7 sm:h-7 lg:w-10 lg:h-10 border-b-2 border-r-2 opacity-40 z-20" style="border-color: var(--border);"></div>

  <div class="relative z-10 bg-[--bg-surface] rounded-2xl shadow-2xl w-full max-w-sm p-8 border" style="border-color: var(--border);">
    <header class="text-center mb-7">
      <a href="/" class="inline-block mb-5 transition-opacity hover:opacity-80">
        {#if data.logo}
          <img src={data.logo} alt="DLAB Logo" class="h-16 w-auto mx-auto" />
        {:else}
          <span class="text-xl font-black" style="color: var(--text-primary);">DLAB</span>
        {/if}
      </a>
      <span class="text-xs uppercase tracking-widest block mb-3" style="color: var(--accent); font-family: var(--font-subheading);">Panel de administración</span>
      <div class="w-full h-0.5 mx-auto mb-3" style="background: var(--accent); opacity: 0.3;"></div>
      <span class="text-lg uppercase tracking-widest block" style="color: var(--accent); font-family: var(--font-subheading);">Acceso Admin</span>
    </header>

    {#if topError}
      <FormErrorSummary message={topError} onDismiss={() => (topError = '')} />
    {/if}

    <form
      method="POST"
      action="?/adminLogin"
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
      class="space-y-4"
    >
      <FormField
        name="email"
        type="email"
        label="Correo"
        required
        placeholder="admin@usfq.edu.ec"
        hint="Debe terminar en .usfq.edu.ec"
        bind:value={correo}
        error={errors.correo || errors.email}
        touched={show.correo}
      />
      <FormField
        name="password"
        type="password"
        label="Contraseña"
        required
        bind:value={contrasena}
        error={errors.contrasena || errors.password}
        touched={show.contrasena}
      />
      <Button type="submit" variant="primary" fullWidth label="Ingresar" disabled={submitAttempted && !isValid} />
    </form>
  </div>
</div>
