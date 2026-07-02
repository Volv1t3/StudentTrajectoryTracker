<script lang="ts">
  import { enhance, applyAction } from '$app/forms';
  import { page } from '$app/stores';
  import { XCircle, ShieldCheck } from 'lucide-svelte';
  import { capture } from '$lib/utils/posthog';
  import { PASSWORD_POLICY_HINT } from '$lib/utils/password';
  import FormField from '$lib/components/ui/FormField.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import FormErrorSummary from '$lib/components/ui/FormErrorSummary.svelte';
  import { validateActivateForm } from '$lib/validation/auth';
  import { extractApiError, mapBackendFields, summarizeFormError } from '$lib/validation/apiError';
  import { authFieldMap } from '$lib/validation/fieldMaps';

  interface Props {
    data: { valid: boolean; token?: string; reason?: string };
    form: any;
  }

  let { data, form }: Props = $props();

  let password = $state('');
  let touched = $state<Record<string, boolean>>({});
  let submitAttempted = $state(false);
  let backendErrors = $state<Record<string, string>>({});
  let topError = $state('');

  const tokenValue = $derived(data.token || ($page.url.searchParams.get('token') || ''));

  let frontErrors = $derived(
    validateActivateForm({ token: tokenValue, password }) as Record<string, string>
  );

  let show = $derived<Record<string, boolean>>({
    password: touched.password || password.length > 0 || submitAttempted,
  });

  let errors = $derived<Record<string, string>>({ ...frontErrors, ...backendErrors });
  let isValid = $derived(Object.keys(frontErrors).length === 0);

  $effect(() => {
    if (form?.apiError !== undefined || form?.error !== undefined) {
      const extracted = extractApiError(form?.apiError ?? form?.error ?? null);
      backendErrors = mapBackendFields(extracted.fields, authFieldMap);
      topError = summarizeFormError(extracted);
      submitAttempted = true;
      const next: Record<string, boolean> = { ...touched };
      for (const k of Object.keys(backendErrors)) next[k] = true;
      touched = next;
    }
  });

  function handleActivateEnhance({ cancel }: { cancel: () => void }) {
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
      if (result.type === 'redirect' || result.type === 'success') {
        capture('account_activated', {
          route: '/activate',
          route_group: 'auth',
          source: 'frontend'
        });
      }
      await applyAction(result);
    };
  }
</script>

<svelte:head>
  <title>Activar cuenta — DLAB</title>
</svelte:head>

<div class="w-full max-w-md">
  {#if !data.valid}
    <div class="bg-surface rounded-2xl shadow-xl p-8 text-center">
      <div class="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <XCircle class="text-red-500" size={26} />
      </div>
      <h2 class="text-xl font-bold text-[--text-primary]">Enlace inválido o expirado</h2>
      <p class="text-[--text-secondary] text-sm mt-2 leading-relaxed">
        Este enlace de activación ha expirado (válido por 24 horas) o ya fue utilizado.
        Contacta a DLAB para solicitar uno nuevo.
      </p>
      <Button variant="primary" href="/contact" label="Contactar a DLAB" classes="mt-6" />
    </div>
  {:else}
    <div class="bg-surface rounded-2xl shadow-xl border border-[--border] p-8">
      <header class="text-center mb-7">
        <div class="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldCheck class="text-green-600" size={26} />
        </div>
        <h1 class="text-2xl font-bold text-[--text-primary]">Activa tu cuenta</h1>
        <p class="text-[--text-muted] text-sm mt-1">Elige una contraseña para completar tu registro</p>
      </header>
      {#if topError}
        <FormErrorSummary message={topError} onDismiss={() => (topError = '')} />
      {/if}
      <form method="POST" action="?/activate" use:enhance={handleActivateEnhance} class="space-y-4">
        <input type="hidden" name="token" value={tokenValue} />
        <FormField
          name="password"
          type="password"
          label="Nueva contraseña"
          required
          hint={PASSWORD_POLICY_HINT}
          bind:value={password}
          error={errors.password || errors.contrasena}
          touched={show.password}
        />
        <Button type="submit" variant="primary" fullWidth label="Activar mi cuenta" disabled={submitAttempted && !isValid} />
      </form>
    </div>
  {/if}
</div>
