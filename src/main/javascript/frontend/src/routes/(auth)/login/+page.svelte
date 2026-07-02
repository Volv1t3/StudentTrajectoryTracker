<script lang="ts">
  import { enhance, applyAction } from '$app/forms';
  import { page } from '$app/stores';
  import { untrack } from 'svelte';
  import { AlertTriangle, XCircle } from 'lucide-svelte';
  import { capture } from '$lib/utils/posthog';
  import FormField from '$lib/components/ui/FormField.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import FormErrorSummary from '$lib/components/ui/FormErrorSummary.svelte';
  import { validateLoginForm } from '$lib/validation/auth';
  import { extractApiError, mapBackendFields, summarizeFormError } from '$lib/validation/apiError';
  import { authFieldMap } from '$lib/validation/fieldMaps';

  interface Props {
    form: any;
  }

  let { form }: Props = $props();

  let correo = $state('');           // → email
  let contrasena = $state('');       // → password

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

  function handleLoginEnhance({ cancel }: { cancel: () => void }) {
    submitAttempted = true;
    if (Object.keys(frontErrors).length > 0) {
      const next: Record<string, boolean> = {};
      for (const k of Object.keys(frontErrors)) next[k] = true;
      touched = { ...touched, ...next };
      topError = 'Revisa los campos marcados antes de continuar.';
      cancel();
      return;
    }
    return async ({ result }: { result: any }) => {
      if (result.type === 'redirect') {
        capture('user_logged_in', {
          intended_role: 'collaborator',
          route: '/login',
          route_group: 'auth',
          source: 'frontend'
        });
      }
      await applyAction(result);
    };
  }
</script>

<svelte:head>
  <title>Iniciar sesión — DLAB</title>
</svelte:head>

<div class="w-full max-w-md">
  <div class="bg-surface rounded-2xl shadow-xl border border-[--border] p-8">
    <header class="text-center mb-8">
      <span class="text-lg uppercase tracking-widest block mb-3" style="color: var(--accent); font-family: var(--font-subheading);">Iniciar sesión</span>
      <div class="w-full h-0.5 mx-auto mb-4" style="background: var(--accent); opacity: 0.3;"></div>
      <p class="text-[--text-muted] text-sm">Accede a tu cuenta de DLAB</p>
    </header>

    {#if $page.url.searchParams.get('message') === 'session-expired'}
      <div class="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl px-4 py-3 mb-5 flex items-center gap-2">
        <AlertTriangle size={14} /> Tu sesión ha expirado. Por favor inicia sesión nuevamente.
      </div>
    {/if}

    {#if $page.url.searchParams.get('message') === 'activated'}
      <div class="bg-green-50 border border-green-200 text-green-800 text-sm rounded-xl px-4 py-3 mb-5 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        ¡Cuenta activada exitosamente! Inicia sesión para continuar.
      </div>
    {/if}

    {#if topError}
      <FormErrorSummary message={topError} onDismiss={() => (topError = '')} />
    {/if}

    <form method="POST" action="?/login" use:enhance={handleLoginEnhance} class="space-y-4">
      <FormField
        name="email"
        type="email"
        label="Correo institucional"
        required
        placeholder="tu.nombre@estud.usfq.edu.ec"
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
        placeholder="••••••••"
        bind:value={contrasena}
        error={errors.contrasena || errors.password}
        touched={show.contrasena}
      />
      <div class="flex justify-end -mt-1">
        <a href="/forgot-password" class="text-xs text-[--color-red] hover:underline">¿Olvidaste tu contraseña?</a>
      </div>
      <Button type="submit" variant="primary" fullWidth size="lg" label="Iniciar sesión" disabled={submitAttempted && !isValid} />
    </form>

    <div class="mt-6 pt-6 border-t border-[--border] text-center">
      <p class="text-sm text-[--text-muted]">
        ¿No tienes cuenta?
        <a href="/signup" class="text-[--color-red] hover:underline font-medium ml-1">Regístrate</a>
      </p>
    </div>
  </div>
</div>
