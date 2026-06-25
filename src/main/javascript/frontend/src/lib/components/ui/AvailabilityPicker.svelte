<script lang="ts">
  import { X } from 'lucide-svelte';
  import Button from '$lib/components/ui/Button.svelte';

  interface AvailabilitySlot {
    day_of_week: string;
    time_from: string;
    time_to: string;
    notes: string;
  }

  interface Props {
    value?: AvailabilitySlot[];
    onchange?: (slots: AvailabilitySlot[]) => void;
    readonly?: boolean;
  }

  let { value = $bindable([]), onchange, readonly = false }: Props = $props();

  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  
  let showModal = $state(false);
  let selectedDay = $state('');
  let timeFrom = $state('');
  let timeTo = $state('');
  let notes = $state('');

  function openModal(day: string) {
    const existing = value.find(s => s.day_of_week === day);
    selectedDay = day;
    timeFrom = existing?.time_from || '09:00';
    timeTo = existing?.time_to || '17:00';
    notes = existing?.notes || '';
    showModal = true;
  }

  function saveSlot() {
    if (!timeFrom || !timeTo) return;
    
    const newSlots = value.filter(s => s.day_of_week !== selectedDay);
    newSlots.push({
      day_of_week: selectedDay,
      time_from: timeFrom,
      time_to: timeTo,
      notes: notes.trim()
    });
    
    value = newSlots.sort((a, b) => days.indexOf(a.day_of_week) - days.indexOf(b.day_of_week));
    onchange?.(value);
    showModal = false;
  }

  function removeSlot(day: string, e: Event) {
    e.stopPropagation();
    value = value.filter(s => s.day_of_week !== day);
    onchange?.(value);
  }

  function closeModal() {
    showModal = false;
  }

  function hasSlot(day: string) {
    return value.some(s => s.day_of_week === day);
  }

  function getSlot(day: string) {
    return value.find(s => s.day_of_week === day);
  }
</script>

<div class="space-y-3 relative mb-4">
  <div class="grid grid-cols-7 gap-2">
    {#each days as day}
      {@const slot = getSlot(day)}
      <div class="relative">
        {#if readonly}
          <div
            class="w-full flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all text-xs"
            class:border-[--accent]={hasSlot(day)}
            class:bg-[--accent]={hasSlot(day)}
            class:bg-opacity-10={hasSlot(day)}
            class:border-[--border]={!hasSlot(day)}
            style="color: {hasSlot(day) ? 'var(--accent)' : 'var(--text-secondary)'}"
          >
            <span class="font-medium">{day.slice(0, 3)}</span>
            {#if slot}
              <span class="text-[10px] mt-1 px-1.5 py-0.5 rounded-full font-medium" style="color: var(--accent); background-color: var(--bg-primary);">
                {slot.time_from.slice(0,5)}-{slot.time_to.slice(0,5)}
              </span>
            {/if}
          </div>
        {:else}
          <button
            type="button"
            onclick={() => openModal(day)}
            class="w-full flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all text-xs"
            class:border-[--accent]={hasSlot(day)}
            class:bg-[--accent]={hasSlot(day)}
            class:bg-opacity-10={hasSlot(day)}
            class:border-[--border]={!hasSlot(day)}
            class:hover:border-[--accent]={!hasSlot(day)}
            style="color: {hasSlot(day) ? 'var(--accent)' : 'var(--text-secondary)'}"
          >
            <span class="font-medium">{day.slice(0, 3)}</span>
            {#if slot}
              <span class="text-[10px] mt-1 px-1.5 py-0.5 rounded-full font-medium" style="color: var(--accent); background-color: var(--bg-primary);">
                {slot.time_from.slice(0,5)}-{slot.time_to.slice(0,5)}
              </span>
            {/if}
          </button>
          {#if slot}
            <button
              type="button"
              onclick={(e) => removeSlot(day, e)}
              class="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
              style="background: var(--accent); color: white;"
              aria-label="Eliminar {day}"
            >
              <X size={10} />
            </button>
          {/if}
        {/if}
      </div>
    {/each}
  </div>

  {#if showModal}
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div 
      class="absolute inset-0  bg-opacity-50 flex items-center justify-center z-50 rounded-lg" 
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      tabindex="-1"
      onclick={closeModal}
      onkeydown={(e) => e.key === 'Escape' && closeModal()}
    >
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="bg-surface rounded-xl p-6 max-w-md w-full mx-4 border border-[--border] group" onclick={(e) => e.stopPropagation()}>
        <div class="flex items-center justify-between mb-4">
          <h3 id="modal-title" class="text-lg font-semibold" style="color: var(--text-primary);">
            Disponibilidad: {selectedDay}
          </h3>
          <button
            type="button"
            onclick={closeModal}
            class="p-1 rounded-lg hover:bg-[--bg-secondary] transition-colors group"
            aria-label="Cerrar"
          >
            <X size={18} class="text-[--text-muted] group-hover:text-[--text-primary]"/>
          </button>

        </div>
        
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="time-from" class="text-xs font-medium block mb-1" style="color: var(--text-secondary);">Desde</label>
              <input
                id="time-from"
                type="time"
                bind:value={timeFrom}
                class="w-full px-3 py-2 rounded-lg border text-sm"
                style="background: var(--bg-secondary); border-color: var(--border); color: var(--text-primary);"
              />
            </div>
            <div>
              <label for="time-to" class="text-xs font-medium block mb-1" style="color: var(--text-secondary);">Hasta</label>
              <input
                id="time-to"
                type="time"
                bind:value={timeTo}
                class="w-full px-3 py-2 rounded-lg border text-sm"
                style="background: var(--bg-secondary); border-color: var(--border); color: var(--text-primary);"
              />
            </div>
          </div>

          <div>
            <label for="slot-notes" class="text-xs font-medium block mb-1" style="color: var(--text-secondary);">Notas (opcional)</label>
            <input
              id="slot-notes"
              type="text"
              bind:value={notes}
              placeholder="ej: Solo mañanas"
              maxlength="200"
              class="w-full px-3 py-2 rounded-lg border text-sm"
              style="background: var(--bg-secondary); border-color: var(--border); color: var(--text-primary);"
            />
          </div>

          <Button type="button" variant="primary" fullWidth onclick={saveSlot} label="Registrar" />
        </div>
      </div>
    </div>
  {/if}
</div>
