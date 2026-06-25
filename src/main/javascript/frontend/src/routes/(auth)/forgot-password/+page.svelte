<script lang="ts">
  import { enhance } from '$app/forms';
  import { ArrowLeft, MailCheck } from 'lucide-svelte';
  import { PASSWORD_POLICY_HINT } from '$lib/utils/password';
  import FormField from '$lib/components/ui/FormField.svelte';
  import Button from '$lib/components/ui/Button.svelte';

  interface Props {
    data: { token?: string };
    form: any;
  }

  let { data, form }: Props = $props();
  let isResetMode = $derived(Boolean(data?.token));

  // No canonical event for password recovery in the agreed taxonomy.
  // The legacy `password_reset_requested` event was removed (no parallel names).
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
      {#if isResetMode}
        <form method="POST" action="?/resetPassword" use:enhance class="space-y-4">
          <input type="hidden" name="token" value={data.token || ''} />
          <FormField name="password" type="password" label="Nueva contraseña" required hint={PASSWORD_POLICY_HINT} />
          <FormField name="confirm" type="password" label="Confirmar contraseña" required />
          {#if form?.error}
            <p class="text-sm text-red-600">{form.error}</p>
          {/if}
          <Button type="submit" variant="primary" fullWidth label="Actualizar contraseña" />
        </form>
      {:else}
        <form method="POST" action="?/forgotPassword" use:enhance class="space-y-4">
          <FormField name="email" type="email" label="Correo institucional" required placeholder="tu.nombre@estud.usfq.edu.ec" hint="Debe terminar en .usfq.edu.ec" />
          <Button type="submit" variant="primary" fullWidth label="Enviar enlace" />
        </form>
      {/if}
    {/if}
  </div>
</div>
