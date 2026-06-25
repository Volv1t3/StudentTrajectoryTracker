<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import StatusBadge from '$lib/components/ui/StatusBadge.svelte';
  import InfoRow from '$lib/components/ui/InfoRow.svelte';

  interface AvailabilitySlot {
    day_of_week: string;
    time_from: string;
    time_to: string;
    notes: string;
  }

  interface CollaboratorProfileViewModel {
    firstName: string;
    middleName: string;
    lastName: string;
    secondLastName: string;
    personalEmail: string;
    usfqEmail: string;
    phoneNumber: string;
    dateOfBirth: string;
    major: string;
    currentUniversityYear: number;
    expectedGraduationYear: number;
    experienceDescription: string;
    motivationDescription: string;
    interestInMachinery: boolean;
    interestInDesign: boolean;
    interestInMaterials: boolean;
    trajectoryStatus: string;
    habilidades: string[];
    availabilitySlots: AvailabilitySlot[];
  }

  interface Props {
    colaborador: CollaboratorProfileViewModel;
    applicationsHref?: string;
    applicationsLabel?: string;
  }

  let {
    colaborador,
    applicationsHref = '',
    applicationsLabel = 'Ver mis solicitudes'
  }: Props = $props();

  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  function getSlotForDay(day: string, slots: AvailabilitySlot[]) {
    return slots.find((slot) => slot.day_of_week === day);
  }

  const fullName = $derived(
    `${colaborador.firstName} ${colaborador.middleName ? `${colaborador.middleName} ` : ''}${colaborador.lastName}${colaborador.secondLastName ? ` ${colaborador.secondLastName}` : ''}`.trim()
  );

  const displayEmail = $derived(colaborador.usfqEmail || colaborador.personalEmail);
  const initials = $derived(
    `${colaborador.firstName?.charAt(0) || ''}${colaborador.lastName?.charAt(0) || ''}` || '?'
  );

  function formatDisplayDate(value?: string) {
    if (!value) return '';
    const match = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return value;
    const [, year, month, day] = match;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  }
</script>

<div class="grid grid-cols-1 md:grid-cols-12 gap-5">
  <div class="md:col-span-4 bg-surface rounded-xl border border-[--border] p-8 shadow-lg">
    <h3 class="font-semibold text-[--text-primary] mb-3">Información personal</h3>
    <div class="space-y-3">
      <InfoRow icon="User" label="Nombre completo" value={fullName} />
      <InfoRow icon="Mail" label="Email personal" value={colaborador.personalEmail} />
      {#if colaborador.usfqEmail}<InfoRow icon="Mail" label="Email USFQ" value={colaborador.usfqEmail} />{/if}
      {#if colaborador.phoneNumber}<InfoRow icon="Phone" label="Teléfono" value={colaborador.phoneNumber} />{/if}
      {#if colaborador.dateOfBirth}<InfoRow icon="Calendar" label="Fecha de nacimiento" value={formatDisplayDate(colaborador.dateOfBirth)} />{/if}
    </div>
  </div>

  <div class="md:col-span-4 flex items-center justify-center">
    <div class="max-w-xs w-full bg-surface rounded-xl border border-[--border] p-6 text-center">
      <div class="w-20 h-20 text-primary rounded-full flex items-center justify-center text-2xl font-bold mx-auto" style="background-color: var(--bg-primary);">
        {initials}
      </div>
      <h2 class="text-base font-bold text-[--text-primary] mt-4">{colaborador.firstName} {colaborador.lastName}</h2>
      <p class="text-sm text-[--text-muted]">{colaborador.major}</p>
      <p class="text-xs text-[--text-muted] mt-0.5">Semestre {colaborador.currentUniversityYear}</p>
      <div class="mt-3"><StatusBadge status={colaborador.trajectoryStatus} /></div>
      <p class="text-xs text-[--text-muted] mt-4 truncate">{displayEmail}</p>
      {#if applicationsHref}
        <div class="mt-4 pt-4 border-t border-[--border]">
          <Button variant="primary" href={applicationsHref} fullWidth size="sm" label={applicationsLabel} />
        </div>
      {/if}
    </div>
  </div>

  <div class="md:col-span-4 bg-surface rounded-xl border border-[--border] p-8 shadow-lg">
    <h3 class="font-semibold text-[--text-primary] mb-3">Académico</h3>
    <div class="space-y-3">
      <InfoRow icon="GraduationCap" label="Carrera" value={colaborador.major} />
      <InfoRow icon="Hash" label="Semestre" value={String(colaborador.currentUniversityYear)} />
      <InfoRow icon="Calendar" label="Año graduación esperado" value={String(colaborador.expectedGraduationYear)} />
    </div>
  </div>

  <div class="md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-5">
    <div class="bg-surface rounded-xl border border-[--border] p-6">
      <h3 class="font-semibold text-[--text-primary] mb-3">Habilidades</h3>
      <div class="flex flex-wrap gap-2">
        {#each colaborador.habilidades as habilidad}
          <span class="border-2 p-2 bg-[--text-primary] hover:bg-[--color-red-hover] text-xs font-sans rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">{habilidad}</span>
        {:else}
          <p class="text-sm text-[--text-muted]">Sin habilidades registradas</p>
        {/each}
      </div>
    </div>

    <div class="bg-surface rounded-xl border border-[--border] p-6">
      <h3 class="font-semibold text-[--text-primary] mb-3">Áreas de interés</h3>
      <div class="flex flex-wrap gap-2">
        {#if colaborador.interestInMachinery}<span class="border-2 p-4 bg-[--text-primary] hover:bg-[--color-red-hover] text-xs font-sans rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">Maquinaria</span>{/if}
        {#if colaborador.interestInDesign}<span class="border-2 p-4 bg-[--text-primary] hover:bg-[--color-red-hover] text-xs font-sans rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">Diseño</span>{/if}
        {#if colaborador.interestInMaterials}<span class="border-2 p-4 bg-[--text-primary] hover:bg-[--color-red-hover] text-xs font-sans rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">Materiales</span>{/if}
        {#if !colaborador.interestInMachinery && !colaborador.interestInDesign && !colaborador.interestInMaterials}
          <p class="text-sm text-[--text-muted]">Sin áreas de interés</p>
        {/if}
      </div>
    </div>
  </div>

  <div class="md:col-span-12 bg-surface rounded-xl border border-[--border] p-6">
    <h3 class="font-semibold text-[--text-primary] mb-3">Disponibilidad semanal</h3>
    <div class="grid grid-cols-7 gap-2">
      {#each days as day}
        {@const slot = getSlotForDay(day, colaborador.availabilitySlots)}
        <div class="flex flex-col items-center justify-center p-2 rounded-lg border text-xs {slot ? 'border-[--accent] bg-[--accent] bg-opacity-10' : 'border-[--border]'}" style="color: {slot ? 'var(--accent)' : 'var(--text-muted)'}">
          <span class="font-medium">{day.slice(0, 3)}</span>
          {#if slot}
            <span class="text-[10px] mt-0.5">{slot.time_from.slice(0, 5)}-{slot.time_to.slice(0, 5)}</span>
          {:else}
            <span class="text-[10px] mt-0.5">—</span>
          {/if}
        </div>
      {/each}
    </div>
    {#if colaborador.availabilitySlots && colaborador.availabilitySlots.length > 0}
      <div class="mt-3 space-y-1">
        {#each colaborador.availabilitySlots as slot}
          {#if slot.notes}
            <p class="text-xs text-[--text-muted]">{slot.day_of_week}: {slot.notes}</p>
          {/if}
        {/each}
      </div>
    {:else}
      <p class="text-xs text-[--text-muted] mt-3">Sin disponibilidad registrada</p>
    {/if}
  </div>

  <div class="md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-5">
    <div class="bg-surface rounded-xl border border-[--border] p-6">
      <h3 class="font-semibold text-[--text-primary] mb-3">Motivación</h3>
      <p class="text-sm text-[--text-secondary] leading-relaxed">{colaborador.motivationDescription || 'Sin motivación registrada'}</p>
    </div>

    <div class="bg-surface rounded-xl border border-[--border] p-6">
      <h3 class="font-semibold text-[--text-primary] mb-3">Experiencia previa</h3>
      <p class="text-sm text-[--text-secondary] leading-relaxed">{colaborador.experienceDescription || 'Sin experiencia previa registrada'}</p>
    </div>
  </div>
</div>
