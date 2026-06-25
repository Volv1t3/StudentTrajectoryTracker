<script lang="ts">
  import { enhance } from '$app/forms';
  import FormField from '$lib/components/ui/FormField.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import SpiralBackground from '$lib/components/layout/SpiralBackground.svelte';

  interface Props {
    data: { logo?: string | null };
    form: any;
  }

  let { data, form }: Props = $props();
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

    {#if form?.error}
      <div class="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
        {form.error}
      </div>
    {/if}

    <form method="POST" action="?/adminLogin" use:enhance class="space-y-4">
      <FormField name="email" type="email" label="Correo" required placeholder="admin@usfq.edu.ec" hint="Debe terminar en .usfq.edu.ec" />
      <FormField name="password" type="password" label="Contraseña" required />
      <Button type="submit" variant="primary" fullWidth label="Ingresar" />
    </form>
  </div>
</div>
