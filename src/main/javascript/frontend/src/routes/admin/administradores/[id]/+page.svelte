<script lang="ts">
  import { enhance } from '$app/forms';
  import { ArrowLeft } from 'lucide-svelte';
  import FormField from '$lib/components/ui/FormField.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { TelInput } from 'svelte-tel-input';
  import type { CountryCode } from 'svelte-tel-input/types';

  let { data, form: formResult }: { data: { admin: any }; form: { error?: string } | null } = $props();
  let a = $derived(data.admin);
  let confirmDelete = $state(false);
  let phoneNumber = $state(a.phone_number || '');
  let phoneCountry = $state<CountryCode | null>('EC');
  let phoneValid = $state(true);
  let correoValue = $state(a.usfq_email || '');

  function validateEmail(email: string): string {
    if (!email || email.length < 3) return '';
    const regex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-.]*usfq\.edu\.ec$/;
    if (!regex.test(email)) {
      return 'Debe terminar en @*.usfq.edu.ec';
    }
    return '';
  }

  let emailError = $derived(validateEmail(correoValue));

</script>

<svelte:head>
  <title>Editar Administrador — Admin DLAB</title>
</svelte:head>

<div class="p-6 md:p-8 max-w-10xl max-h-10xl">
  <a href="/admin/administradores" class="text-sm text-[--text-muted] hover:text-[--text-secondary] flex items-center gap-1.5 mb-6">
    <ArrowLeft size={13} /> Administradores
  </a>
  <header class="mb-6 flex flex-wrap items-center justify-between gap-4">
  

  <h1 class="text-2xl font-bold text-[--text-primary] mb-6">Editar administrador</h1>
  <div>
    {#if !confirmDelete}
      <Button variant="primary" size="sm" label="Eliminar administrador" onclick={() => confirmDelete = true} />
    {:else}
      <p class="text-sm text-red-600 mb-2">¿Estás seguro? Esta acción no se puede deshacer.</p>
      <form method="POST" action="?/delete" use:enhance class="inline-flex gap-2">
        <Button type="submit" variant="primary" size="sm" label="Confirmar eliminación" />
        <Button variant="primary" size="sm" label="Cancelar" onclick={() => confirmDelete = false} />
      </form>
    {/if}
  </div>
  </header>
  
  {#if formResult?.error}
    <div class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {formResult.error}
    </div>
  {/if}

  <form method="POST" action="?/update" use:enhance class="bg-surface rounded-xl border border-[--border] p-6 space-y-6">
    <div>
          <h2 class="text-lg font-semibold text-[--text-primary]">Información personal del administrador</h2>
          <p class="text-sm text-[--text-muted] mb-4">Defina la información personal del administrador, esto puede ser modificado por el administrador luego.</p>
          <div class="w-full h-0.5" style="background: var(--accent); opacity: 0.3;"></div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField name="firstName" label="Nombre" required value={a.first_name} />
      <FormField name="middleName" label="Segundo nombre" hint="Opcional." value={a.middle_name || ''} />
      <FormField name="lastName" label="Apellido" required value={a.last_name} />
      <FormField name="secondLastName" label="Segundo apellido" hint="Opcional." value={a.second_last_name || ''} />
    </div>

    <div>
          <h2 class="text-lg font-semibold text-[--text-primary]">Información de contacto del administrador</h2>
          <p class="text-sm text-[--text-muted] mb-4">Defina la información de contacto del administrador, esto puede ser modificado por el administrador luego.</p>
          <div class="w-full h-0.5" style="background: var(--accent); opacity: 0.3;"></div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField name="personalEmail" type="email" label="Correo personal" required value={a.personal_email} />
      <FormField name="usfqEmail" type="email" label="Correo institucional USFQ" required 
       error={emailError}
              bind:value={correoValue}/>
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
      <FormField name="dateOfBirth" type="date" label="Fecha de nacimiento" hint="Opcional." value={a.date_of_birth?.slice(0, 10) || ''} />
    </div>

    <div class="flex items-center gap-2">
      <input id="isActive" name="isActive" type="checkbox" checked={a.is_active} class="rounded border-[--border]" />
      <label for="isActive" class="text-sm text-[--text-secondary]">Cuenta activa</label>
    </div>

    <div class="flex gap-3 pt-2">
      <Button type="submit" variant="primary" label="Guardar cambios" />
      <Button variant="primary" href="/admin/administradores" label="Cancelar" />
    </div>
  </form>

  
</div>
