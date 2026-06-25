<script lang="ts">
  import { enhance, applyAction } from '$app/forms';
  import { page } from '$app/stores';
  import { AlertTriangle, XCircle } from 'lucide-svelte';
  import { capture } from '$lib/utils/posthog';
  import FormField from '$lib/components/ui/FormField.svelte';
  import Button from '$lib/components/ui/Button.svelte';

  interface Props {
    form: any;
  }

  let { form }: Props = $props();

  let emailValue = $state('');

  function handleLoginEnhance() {
    return async ({ result }: { result: any }) => {
      if (result.type === 'redirect') {
        // Capture the canonical funnel event. The stable identify call happens
        // in the root +layout.svelte once `data.user` is hydrated post-redirect
        // — this avoids using the email as a distinct ID.
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

    {#if form?.error}
      <div class="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5 flex items-start gap-2">
        <XCircle size={14} class="flex-shrink-0 mt-0.5" />
        {form.error}
      </div>
    {/if}

    <form method="POST" action="?/login" use:enhance={handleLoginEnhance} class="space-y-4">
      <FormField name="email" type="email" label="Correo institucional" required placeholder="tu.nombre@estud.usfq.edu.ec" hint="Debe terminar en .usfq.edu.ec" bind:value={emailValue} />
      <FormField name="password" type="password" label="Contraseña" required placeholder="••••••••" />
      <div class="flex justify-end -mt-1">
        <a href="/forgot-password" class="text-xs text-[--color-red] hover:underline">¿Olvidaste tu contraseña?</a>
      </div>
      <Button type="submit" variant="primary" fullWidth size="lg" label="Iniciar sesión" />
    </form>

    <div class="mt-6 pt-6 border-t border-[--border] text-center">
      <p class="text-sm text-[--text-muted]">
        ¿No tienes cuenta?
        <a href="/signup" class="text-[--color-red] hover:underline font-medium ml-1">Regístrate</a>
      </p>
    </div>
  </div>
</div>