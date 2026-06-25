<script lang="ts">
  import { enhance, applyAction } from '$app/forms';
  import { page } from '$app/stores';
  import { XCircle, ShieldCheck } from 'lucide-svelte';
  import { capture } from '$lib/utils/posthog';
  import { PASSWORD_POLICY_HINT } from '$lib/utils/password';
  import FormField from '$lib/components/ui/FormField.svelte';
  import Button from '$lib/components/ui/Button.svelte';

  interface Props {
    data: { valid: boolean; token?: string; reason?: string };
    form: any;
  }

  let { data, form }: Props = $props();

  function handleActivateEnhance() {
    return async ({ result }: { result: any }) => {
      if (result.type === 'redirect' || result.type === 'success') {
        // Frontend complement to backend authoritative `account_activated`
        // emitted by `auth.controller.js#activate` after the password is set
        // and the token is marked used. The activated collaborator's stable
        // ID is identified server-side as `collaborator:{id}`; the visitor
        // will be identified on the next authenticated page load via the
        // root +layout.svelte effect.
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
      <form method="POST" action="?/activate" use:enhance={handleActivateEnhance} class="space-y-4">
        <input type="hidden" name="token" value={data.token || $page.url.searchParams.get('token') || ''} />
        <FormField
          name="password"
          type="password"
          label="Nueva contraseña"
          required
          hint={PASSWORD_POLICY_HINT}
          error={form?.errors?.password}
        />
        {#if form?.error}
          <p class="text-sm text-red-600">{form.error}</p>
        {/if}
        <Button type="submit" variant="primary" fullWidth label="Activar mi cuenta" />
      </form>
    </div>
  {/if}
</div>
