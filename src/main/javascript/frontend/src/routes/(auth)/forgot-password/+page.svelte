<script lang="ts">
  import { enhance } from '$app/forms';
  import { ArrowLeft, MailCheck } from 'lucide-svelte';
  import { PASSWORD_POLICY_HINT } from '$lib/utils/password';
  import FormField from '$lib/components/ui/FormField.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import FormErrorSummary from '$lib/components/ui/FormErrorSummary.svelte';
  import { validateForgotPasswordForm, validateResetPasswordForm } from '$lib/validation/auth';
  import { extractApiError, mapBackendFields, summarizeFormError } from '$lib/validation/apiError';
  import { authFieldMap } from '$lib/validation/fieldMaps';

  interface Props {
    data: { token?: string };
    form: any;
  }

  let { data, form }: Props = $props();
  let isResetMode = $derived(Boolean(data?.token));

  // Forgot-password state
  let forgotEmail = $state('');

  // Reset-password state
  let newPassword = $state('');
  let confirmPassword = $state('');

  let touched = $state<Record<string, boolean>>({});
  let submitAttempted = $state(false);
  let backendErrors = $state<Record<string, string>>({});
  let topError = $state('');

  let forgotErrors = $derived(
    validateForgotPasswordForm({ email: forgotEmail }) as Record<string, string>
  );

  let resetErrors = $derived(
    validateResetPasswordForm({
      token: data?.token || '',
      new_password: newPassword,
      confirm: confirmPassword,
    }) as Record<string, string>
  );

  let frontErrors = $derived(isResetMode ? resetErrors : forgotErrors);

  function hasContent(v: unknown): boolean {
    if (v == null) return false;
    if (typeof v === 'string') return v.trim() !== '';
    return true;
  }

  let show = $derived<Record<string, boolean>>({
    correo: touched.correo || hasContent(forgotEmail) || submitAttempted,
    nueva_contrasena: touched.nueva_contrasena || hasContent(newPassword) || submitAttempted,
    confirmar_contrasena: touched.confirmar_contrasena || hasContent(confirmPassword) || submitAttempted,
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
</script>

<svelte:head>
  <title>Recuperar contraseña — DLAB</title>
</svelte:head>

<div class="w-full max-w-md">
  <div class="bg-surface rounded-2xl shadow-xl border border-[--border] p-8">
    <a href="/login" class="text-sm text-[--text-muted] hover:text-[--text-secondary] flex items-center gap-1.5 mb-6 transition-colors">
      <ArrowLeft size={13} /> Volver al inicio de sesión
    </a>
    <h1 class="text-2xl font-bold text-[--text-primary]">{isResetMode ? 'Define tu nueva contraseña' : 'Recuperar contraseña'}</h1>
    <p class="text-[--text-muted] text-sm mt-1 mb-6">
      {#if isResetMode}
        Ingresa tu nueva contraseña para activar el cambio.
      {:else}
        Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
      {/if}
    </p>

    {#if form?.success}
      <div class="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
        <MailCheck class="mx-auto text-green-500 mb-2" size={24} />
        <p class="text-sm font-semibold text-green-900">Revisa tu correo</p>
        <p class="text-xs text-green-700 mt-1">
          {#if isResetMode}
            Tu contraseña fue actualizada. Ya puedes iniciar sesión.
          {:else}
            Si tu correo está registrado y activo, recibirás un enlace en los próximos minutos.
          {/if}
        </p>
      </div>
    {:else}
      {#if topError}
        <FormErrorSummary message={topError} onDismiss={() => (topError = '')} />
      {/if}
      {#if isResetMode}
        <form
          method="POST"
          action="?/resetPassword"
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
          <input type="hidden" name="token" value={data.token || ''} />
          <FormField
            name="password"
            type="password"
            label="Nueva contraseña"
            required
            hint={PASSWORD_POLICY_HINT}
            bind:value={newPassword}
            error={errors.nueva_contrasena || errors.new_password || errors.password}
            touched={show.nueva_contrasena}
          />
          <FormField
            name="confirm"
            type="password"
            label="Confirmar contraseña"
            required
            bind:value={confirmPassword}
            error={errors.confirmar_contrasena || errors.confirm}
            touched={show.confirmar_contrasena}
          />
          <Button type="submit" variant="primary" fullWidth label="Actualizar contraseña" disabled={submitAttempted && !isValid} />
        </form>
      {:else}
        <form
          method="POST"
          action="?/forgotPassword"
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
            label="Correo institucional"
            required
            placeholder="tu.nombre@estud.usfq.edu.ec"
            hint="Debe terminar en .usfq.edu.ec"
            bind:value={forgotEmail}
            error={errors.correo || errors.email}
            touched={show.correo}
          />
          <Button type="submit" variant="primary" fullWidth label="Enviar enlace" disabled={submitAttempted && !isValid} />
        </form>
      {/if}
    {/if}
  </div>
</div>
