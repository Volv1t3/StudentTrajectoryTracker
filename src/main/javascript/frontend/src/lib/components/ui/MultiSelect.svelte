<script lang="ts">
  import { Search, X } from 'lucide-svelte';

  interface Option {
    id: number;
    nombre: string;
  }

  interface Props {
    name: string;
    label: string;
    options: Option[];
    selected?: number[];
    required?: boolean;
    hint?: string;
    error?: string;
  }

  let { 
    name, 
    label, 
    options, 
    selected = [], 
    required = false, 
    hint, 
    error 
  }: Props = $props();

  let open = $state(false);
  let searchQuery = $state('');
  let selectedIds = $state<number[]>([]);

  $effect(() => {
    selectedIds = [...selected];
  });

  let filteredOptions = $derived(
    options.filter(opt => 
      opt.nombre.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  let selectedOptions = $derived(
    options.filter(opt => selectedIds.includes(opt.id))
  );

  function toggle(id: number) {
    if (selectedIds.includes(id)) {
      selectedIds = selectedIds.filter(sid => sid !== id);
    } else {
      selectedIds = [...selectedIds, id];
    }
  }

  function remove(id: number) {
    selectedIds = selectedIds.filter(sid => sid !== id);
  }

  $effect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest('.multiselect-wrapper')) {
        open = false;
      }
    }
    
    if (open) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  });
</script>

<div class="multiselect-wrapper">
  <label for={`${name}-trigger`} class="block text-sm font-medium text-[--text-secondary] mb-1">
    {label}
    {#if required}<span class="text-red-500">*</span>{/if}
  </label>

  <button
    id={`${name}-trigger`}
    type="button"
    onclick={() => open = !open}
    class="w-full text-left px-3 py-2.5 text-sm rounded-lg border border-[--border] hover:border-[--text-muted] focus:outline-none focus:ring-2 focus:ring-[--color-red] transition-colors" style="background: var(--bg-surface);"
    class:border-red-400={error}
  >
    {#if selectedIds.length === 0}
      <span class="text-[--text-muted]">Selecciona...</span>
    {:else}
      <span class="text-[--text-secondary]">{selectedIds.length} seleccionada{selectedIds.length !== 1 ? 's' : ''}</span>
    {/if}
  </button>

  {#if selectedOptions.length > 0}
    <div class="flex flex-wrap gap-1.5 mt-2">
      {#each selectedOptions as option (option.id)}
        <span class="inline-flex items-center gap-1 bg-[--color-red-light] text-[--color-red] text-xs px-2 py-1 rounded-md">
          {option.nombre}
          <button type="button" onclick={() => remove(option.id)} class="hover:text-red-700">
            <X size={12} />
          </button>
        </span>
      {/each}
    </div>
  {/if}

  {#if open}
    <div class="absolute z-50 mt-1 w-full border border-[--border] rounded-lg shadow-lg max-h-60 overflow-hidden" style="background: var(--bg-surface);">
      <div class="p-2 border-b border-[--border]">
        <div class="relative">
          <Search class="absolute left-2 top-1/2 -translate-y-1/2 text-[--text-muted]" size={14} />
          <input
            type="text"
            placeholder="Buscar..."
            bind:value={searchQuery}
            class="w-full pl-8 pr-3 py-1.5 text-sm border border-[--border] rounded-md focus:outline-none focus:ring-1 focus:ring-[--color-red]" style="background: var(--bg-surface);"
          />
        </div>
      </div>
      <div class="overflow-y-auto max-h-48">
        {#each filteredOptions as option (option.id)}
          <label class="flex items-center gap-2 px-3 py-2 hover:bg-[--bg-secondary] cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={selectedIds.includes(option.id)}
              onchange={() => toggle(option.id)}
              class="h-4 w-4 rounded border-[--border] text-[--color-red] focus:ring-[--color-red]"
            />
            <span class="text-sm text-[--text-secondary]">{option.nombre}</span>
          </label>
        {/each}
        {#if filteredOptions.length === 0}
          <p class="text-sm text-[--text-muted] text-center py-4">Sin resultados</p>
        {/if}
      </div>
    </div>
  {/if}

  {#each selectedIds as id}
    <input type="hidden" name="{name}[]" value={id} />
  {/each}

  {#if hint && !error}
    <p class="mt-1 text-xs text-[--text-muted]">{hint}</p>
  {/if}
  {#if error}
    <p class="mt-1 text-xs text-red-500 flex items-center gap-1">
      {error}
    </p>
  {/if}
</div>

<style>
  .multiselect-wrapper {
    position: relative;
  }
</style>
