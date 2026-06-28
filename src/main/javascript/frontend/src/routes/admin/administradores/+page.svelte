<script lang="ts">
  import { Search } from 'lucide-svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { TelInput} from 'svelte-tel-input'; 
  import type { CountryCode } from 'svelte-tel-input/types';

  interface Admin {
    id: number;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    second_last_name: string | null;
    personal_email: string;
    usfq_email: string;
    phone_number: string | null;
    is_active: boolean;
    created_at: string;
  }

  let { data }: { data: { administradores: Admin[]; meta: { page: number; limit: number; total: number } } } = $props();
  
  //? Datos para formato de numero de telefono
  let searchQuery = $state('');
  let phoneNumber = $state('');
  let phoneCountry = $state<CountryCode | null>('EC');
  let phoneValid = $state(true);

  //? Datos para el conteo de administradores 

  /**
   * Funcion que permite identificar administradores en base a si estan activos o no
   * @param status
   */
  function byStatus(status: boolean) {
    return data.administradores.filter(c => c.is_active == status);
  }


  let filtered = $derived(data.administradores.filter(a => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = `${a.first_name} ${a.middle_name || ''} ${a.last_name} ${a.second_last_name || ''}`.toLowerCase();
    return name.includes(q) || a.usfq_email.toLowerCase().includes(q) || a.personal_email.toLowerCase().includes(q);
  }));

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function formatPhoneNumber(raw: string | null): string {
    if (!raw) return '—';
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('593') && digits.length >= 12) {
      const local = digits.slice(3);
      return `+593 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
    }
    if (digits.length === 10) {
      return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
    }
    return raw;
  }
</script>

<svelte:head>
  <title>Administradores — Admin DLAB</title>
</svelte:head>

<div class="p-6 md:p-8">
  <header class="mb-6 flex flex-wrap items-center justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold text-[--text-primary]">Administradores</h1>
      <div class="flex flex-wrap gap-3 mt-4">
      <span class="text-sm text-green-700 px-2 py-1 rounded-full font-semibold" style="background-color: var(--bg-surface);">Activos: {byStatus(true).length}</span>
      <span class="text-sm  text-yellow-700 px-2 py-1 rounded-full font-semibold" style="background-color: var(--bg-surface);">Inactivos: {byStatus(false).length}</span>
      <span class="text-sm text-primary px-2 py-1 rounded-full font-semibold" style="background-color: var(--bg-surface);">Total: {data.administradores.length}</span>
    </div>
    </div>
    
    <Button href="/admin/administradores/nuevo" label="Nuevo administrador" variant="primary" size="sm" icon="Plus" />
  </header>


  
  <div class="flex flex-wrap gap-3 mb-5">
    <div class="relative flex-1 min-w-52">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted]" size={13} />
      <input type="text" bind:value={searchQuery} placeholder="Buscar por nombre o correo..." class="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-[--border] bg-surface focus:ring-2 focus:ring-[--color-red] focus:outline-none" />
    </div>
  </div>

  <div class="bg-surface rounded-xl border border-[--border] overflow-x-auto">
    <table class="w-full text-sm">
      <thead class="bg-[--bg-secondary] border-b border-[--border] text-sm font-semibold text-[--text-muted] uppercase tracking-wide">
        <tr>
          <th class="px-4 py-3 text-left">Administrador</th>
          <th class="px-4 py-3 text-left">Correo institucional</th>
          <th class="px-4 py-3 text-left">Teléfono</th>
          <th class="px-4 py-3 text-left">Estado</th>
          <th class="px-4 py-3 text-left">Fecha de Registro</th>
          <th class="px-4 py-3 text-left">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {#each filtered as a (a.id)}
          <tr class="border-b border-[--border] hover:bg-[--bg-secondary] transition-colors">
            <td class="px-4 py-3">
              <p class="font-medium text-[--text-primary]">{a.first_name} {a.middle_name || ''} {a.last_name} {a.second_last_name || ''}</p>
              <p class="text-xs text-[--text-muted]" style="font-style: italic;">{a.personal_email}</p>
            </td>
            <td class="px-4 py-3 text-[--text-secondary] text-sm">{a.usfq_email}</td>

            <td class="px-4 py-3 text-[--text-secondary]">
               <TelInput
                id="phone-input"
                value={a.phone_number ?? ''}
                options={{ autoPlaceholder: true, spaces: true }}
                class="block w-full  px-3 py-2.5 text-sm text-[--text-primary] placeholder-[--text-muted] focus:outline-none focus:ring-2 focus:ring-[--color-red] focus:border-[--color-red] transition-colors duration-150"
                style="background: var(--bg-surface);"
              />
            </td>
            <td class="px-4 py-3">
              <span class="inline-block px-2 py-0.5 rounded-full text-sm font-semibold {a.is_active ? 'text-green-700' : 'text-yellow-700'}" style="background-color: var(--bg-primary)">
                {a.is_active ? 'Activo' : 'Inactivo'}
              </span>
            </td>
            <td class="px-4 py-3 text-xs text-[--text-muted]">{formatDate(a.created_at)}</td>
            <td class="px-4 py-3">
              <Button variant="primary" size="md" href="/admin/administradores/{a.id}" label="Editar" icon='Pen'/>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
