<script lang="ts">
  import { enhance } from '$app/forms';
  import { ArrowLeft } from 'lucide-svelte';
  import { PASSWORD_POLICY_HINT } from '$lib/utils/password';
  import FormField from '$lib/components/ui/FormField.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { TelInput } from 'svelte-tel-input';
  import type { CountryCode } from 'svelte-tel-input/types';

  let { form }: { form: { error?: string } | null } = $props();
  let phoneNumber = $state('');
  let phoneCountry = $state<CountryCode | null>('EC');
  let phoneValid = $state(true);
</script>

<svelte:head>
  <title>Nuevo Administrador — Admin DLAB</title>
</svelte:head>

<div class="p-6 md:p-8 max-w-10xl max-h-10xl">

  <a href="/admin/administradores" class="text-sm text-[--text-muted] hover:text-[--text-secondary] flex items-center gap-1.5 mb-6">
    <ArrowLeft size={13} /> Administradores
  </a>
  <h1 class="text-3xl font-bold text-[--text-primary] mb-6">Nuevo administrador</h1>

  {#if form?.error}
    <div class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {form.error}
    </div>
  {/if}

  <form method="POST" use:enhance class="bg-surface rounded-xl border border-[--border] p-6 space-y-8">
    <div>
          <h2 class="text-lg font-semibold text-[--text-primary]">Información personal del administrador</h2>
          <p class="text-sm text-[--text-muted] mb-4">Defina la información personal del administrador, esto puede ser modificado por el administrador luego.</p>
          <div class="w-full h-0.5" style="background: var(--accent); opacity: 0.3;"></div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField name="firstName" label="Nombre" required />
      <FormField name="middleName" label="Segundo nombre" hint="Opcional." />
      <FormField name="lastName" label="Apellido" required />
      <FormField name="secondLastName" label="Segundo apellido" hint="Opcional." />
    </div>

    <div>
          <h2 class="text-lg font-semibold text-[--text-primary]">Información de contacto del administrador</h2>
          <p class="text-sm text-[--text-muted] mb-4">Defina la información de contacto del administrador, esto puede ser modificado por el administrador luego.</p>
          <div class="w-full h-0.5" style="background: var(--accent); opacity: 0.3;"></div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField name="personalEmail" type="email" label="Correo personal" required />
      <FormField name="usfqEmail" type="email" label="Correo institucional USFQ" required />
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
      </div>
      <FormField name="dateOfBirth" type="date" label="Fecha de nacimiento" hint="Opcional." />
    </div>

    <div>
          <h2 class="text-lg font-semibold text-[--text-primary]">Contraseña del administrador</h2>
          <p class="text-sm text-[--text-muted] mb-4">Defina la contraseña personal del administrador, esto no se puede modificar luego.</p>
          <div class="w-full h-0.5" style="background: var(--accent); opacity: 0.3;"></div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField name="password" type="password" label="Contraseña" required hint={PASSWORD_POLICY_HINT} />
      <FormField name="confirmPassword" type="password" label="Confirmar contraseña" required />
    </div>

    <div class="flex gap-3 pt-2">
      <Button type="submit" variant="primary" label="Crear administrador" />
      <Button variant="primary" href="/admin/administradores" label="Cancelar" />
    </div>
  </form>
</div>
