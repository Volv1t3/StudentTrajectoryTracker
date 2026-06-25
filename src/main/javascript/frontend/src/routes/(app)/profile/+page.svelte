<script lang="ts">
  import { enhance } from '$app/forms';
  import { Plus, X } from 'lucide-svelte';
  import { capture, identify, distinctIdForCollaborator } from '$lib/utils/posthog';
  import Button from '$lib/components/ui/Button.svelte';
  import StatusBadge from '$lib/components/ui/StatusBadge.svelte';
  import FormField from '$lib/components/ui/FormField.svelte';
  import AvailabilityPicker from '$lib/components/ui/AvailabilityPicker.svelte';
  import CollaboratorProfileView from '$lib/components/profile/CollaboratorProfileView.svelte';
  import { TelInput } from 'svelte-tel-input';
  import type { CountryCode } from 'svelte-tel-input/types';

  interface Tag { id: number; name: string; slug: string; category: string; }

  interface AvailabilitySlot {
    day_of_week: string;
    time_from: string;
    time_to: string;
    notes: string;
  }

  interface Colaborador {
    id: number;
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
    profileComplete: boolean;
    habilidades: string[];
    habilidadIds: number[];
    availabilitySlots: AvailabilitySlot[];
  }

  interface Props {
    data: { colaborador: Colaborador; allTags: Tag[] };
    form: any;
  }

  // Reuse the same list of carreras from signup so the profile editor shows the same options
  const CARRERAS = [
    "Administración de Empresas PR", "Administración de Empresas SP", "Animación Digital", "Antropología", 
    "Arquitectura", "Artes Liberales", "Artes Visuales", "Artes Visuales Conc. Dis. Moda", "Biología", 
    "Biología (Galápagos)", "Biotecnología", "Ciencias Políticas", "Cine", "Composición Medios Contemporáneos", 
    "Computación", "Comunicación PR", "Derecho", "Diseño de Interiores", "Diseño de Medios Interactivos", 
    "Diseño Gráfico Comunicacional", "Doctorado en Microbiología PhD", "Doctorado Materiales Avanzados", 
    "Dr. Ecología y Sol. Globales", "Economía", "Educación PR", "Ejecución Música Contemporánea", 
    "Esp. Cirugía Pediátrica", "Esp. Cuidados Intens. Pediátr.", "Esp. Derecho y Economía Compet.", 
    "Esp. en Anestesiología", "Esp. en Cirugía Maxilofacial", "Esp. en Endodoncia", 
    "Esp. en Hematología Pediátrica", "Esp. en Nefrología Pediátrica", "Esp. en Neonatología y CIN", 
    "Esp. en Neurología Pediátrica", "Esp. en Odontopediatría", "Esp. en Ortodoncia", 
    "Esp. Endocrinología Pediátrica", "Esp. Imagenología", "Esp. Infectología Pediátrica", 
    "Esp. Med. Emer. y Des. Pediátrica", "Esp. Ortopedía y Traumatología", "Esp. Periodonci e Implan Quiru", 
    "Esp. Rehab. Oral Prot. Implant.", "Especialización Neurocirugía", "Finanzas", "Física", "Gastronomía", 
    "Gestión Ambiental SP", "Hospitalidad y Hotelería PR", "Informática y Programación", 
    "Ing. Electrónica y Automatización", "Ing. Mat. Aplicada y Computación", "Ingeniería Ambiental", 
    "Ingeniería Civil", "Ingeniería en Agroempresa", "Ingeniería en Alimentos", "Ingeniería Industrial", 
    "Ingeniería Mecánica", "Ingeniería Química", "Literatura", "M. Estrategia Gob. Territorial", 
    "M. Soluc. Ambientales y Sost.", "Maestría Administración Empresas", "Maestría Analítica de Negocios", 
    "Maestría Ciencia y Tec. Alimentos", "Maestría Derecho Administrativo", "Maestría Dir. Emp. Constr. Inm.", 
    "Maestría en Ciencia de Datos", "Maestría en Ecología Tropical", "Maestría en Economía E. Compor.", 
    "Maestría en Economía E. Comput.", "Maestría en Educación", "Maestría en Epidemiología", 
    "Maestría en Finanzas", "Maestría en Física", "Maestría en Gerencia en Salud", 
    "Maestría en Ing. Circular", "Maestría en Ingeniería Civil", "Maestría en Int. Artificial", 
    "Maestría en Medios Digitales", "Maestría en Nanoelectrónica CM", "Maestría en Nanoelectrónica SE", 
    "Maestría en Restaurantes + A&B", "Maestría en Enseñanza de Inglés", "Maestría Gerencia de Datos y N", 
    "Maestría Gerencia de Marketing", "Maestría Gest. Emp. Deportivas", "Maestría Gestión Ambiental", 
    "Maestría Ing. Industrial C y P", "Maestría Ing. Industrial L y S", "Maestría Litigio y Arbitraje I", 
    "Maestría Microbiología", "Maestría S.I. Gestión del Agua", "Matemática", "Medicina", 
    "Medicina Veterinaria", "Mercadotecnia PR", "M. Gestión Cadena de Suministro", 
    "M. Gestión y Desarrollo Talento", "M.S. Pública mención en SAO", "M.S. Pública mención en SMIF", 
    "Negocios Internacionales", "Nutrición y Dietética", "Odontología", "Periodismo PR", 
    "Producción Musical y Sonora", "Psicología Clínica", "Psicología PR", "Publicidad", 
    "Relaciones Internacionales", "Tec. Sup. Guía Nat. Galápagos", "Turismo"
  ];

  let { data, form }: Props = $props();
  let isEditing = $state(false);
  let isCreatingTag = $state(false);
  let newTagName = $state('');
  let tagError = $state('');
  let pendingNewTags = $state<string[]>([]);
  let editingAvailability = $state<AvailabilitySlot[]>([]);
  let phoneNumber = $state('');
  let phoneCountry = $state<CountryCode | null>('EC');
  let phoneValid = $state(true);

  // Snapshot of the contact fields that the user can edit, captured when edit
  // mode begins. Used at submit time to compute `sections_updated` precisely.
  let originalContactSnapshot = $state<{ personalEmail: string; phoneNumber: string } | null>(null);
  let originalAvailabilityKey = $state<string>('');

  function availabilityKey(slots: AvailabilitySlot[] | null | undefined): string {
    return JSON.stringify((slots || []).map((s) => ({
      d: s.day_of_week,
      f: s.time_from,
      t: s.time_to,
      n: s.notes ?? ''
    })));
  }

  function buildSectionsUpdated(formEl: HTMLFormElement): string[] {
    const sections: string[] = [];
    // skills: any newly created tag is a clear signal of a skill section update.
    if (pendingNewTags.length > 0) sections.push('skills');
    // availability: compare normalized snapshot against current.
    if (originalAvailabilityKey !== availabilityKey(editingAvailability)) {
      sections.push('availability');
    }
    // contact: personalEmail or phoneNumber changed.
    const fd = new FormData(formEl);
    const currentPersonalEmail = String(fd.get('personalEmail') || '').trim();
    const currentPhone = String(fd.get('phoneNumber') || '').trim();
    const baseline = originalContactSnapshot;
    if (baseline && (currentPersonalEmail !== baseline.personalEmail || currentPhone !== baseline.phoneNumber)) {
      sections.push('contact');
    }
    return sections;
  }

  function handleProfileEnhance() {
    return ({ formElement }: { formElement: HTMLFormElement }) => {
      const sectionsAtSubmit = buildSectionsUpdated(formElement);
      return async ({ result, update }: { result: any; update: () => Promise<void> }) => {
        await update();
        if (result.type === 'success' && result.data?.success) {
          // Identify with stable ID + person properties (the collaborator.id is
          // available from server-side data here; we never use email).
          if (data?.colaborador?.id) {
            identify(distinctIdForCollaborator(data.colaborador.id), {
              role: 'collaborator',
              usfq_email: data.colaborador.usfqEmail || undefined,
              major: data.colaborador.major || undefined
            });
          }
          capture('profile_updated', {
            sections_updated: sectionsAtSubmit,
            route: '/profile',
            route_group: 'app',
            source: 'frontend'
          });
        }
      };
    };
  }

  $effect(() => {
    if (form?.success) {
      isEditing = false;
      pendingNewTags = [];
      newTagName = '';
      isCreatingTag = false;
    }
  });

  $effect(() => {
    if (isEditing && data.colaborador) {
      editingAvailability = [...(data.colaborador.availabilitySlots || [])];
      phoneNumber = data.colaborador.phoneNumber || '';
      originalContactSnapshot = {
        personalEmail: (data.colaborador.personalEmail || '').trim(),
        phoneNumber: (data.colaborador.phoneNumber || '').trim()
      };
      originalAvailabilityKey = availabilityKey(data.colaborador.availabilitySlots);
    }
  });


  function addPendingTag() {
    const normalized = newTagName.trim().toLowerCase();
    if (!pendingNewTags.includes(normalized)) {
      pendingNewTags = [...pendingNewTags, normalized];
      newTagName = '';
      tagError = '';
      isCreatingTag = false;
    }
  }

  function removePendingTag(tag: string) {
    pendingNewTags = pendingNewTags.filter(t => t !== tag);
  }

  function validateTagInput(value: string): string {
    const normalized = value.trim();
    if (!normalized) return 'Nombre requerido';
    if (/\s/.test(normalized)) return 'Una sola palabra (usa - _ o . como separadores)';
    if (normalized.length < 2 || normalized.length > 50) return 'Entre 2 y 50 caracteres';
    return '';
  }

  function cancelEdit() {
    isEditing = false;
    pendingNewTags = [];
    newTagName = '';
    tagError = '';
    isCreatingTag = false;
  }

  const c = $derived(data.colaborador);
</script>

<svelte:head>
  <title>Mi perfil — DLAB</title>
</svelte:head>

<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
  <header class="flex items-center justify-between mb-8">
    <div>
      <h1 class="text-2xl font-bold text-[--text-primary]">Mi perfil</h1>
      <p class="text-[--text-muted] text-sm mt-0.5">Gestiona tu información en D.Lab</p>
    </div>
    <div>
    <Button variant="primary" size="sm" onclick={() => isEditing ? cancelEdit() : (isEditing = true)} label={isEditing ? 'Cancelar edición' : 'Editar perfil'} icon={isEditing ? 'X' : 'Pencil'} />
    </div>
  </header>

  {#if !isEditing}
    <CollaboratorProfileView colaborador={c} applicationsHref="/my-applications" applicationsLabel="Ver mis solicitudes" />

  {:else}
    <!-- Edit mode: Redesigned form layout -->
    <form method="POST" action="?/updateProfile" use:enhance={handleProfileEnhance()} class="grid grid-cols-1 md:grid-cols-12 gap-5">
      <div class="md:col-span-4 bg-surface rounded-xl border border-[--border] p-8">
        <h3 class="font-semibold text-[--text-primary] mb-3">Información personal</h3>
        <div class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField name="firstName" label="Nombre" required value={c.firstName} />
            <FormField name="middleName" label="Segundo nombre" value={c.middleName} />
            <FormField name="lastName" label="Apellido" required value={c.lastName} />
            <FormField name="secondLastName" label="Segundo apellido" value={c.secondLastName} />
          </div>
          <div class="space-y-4">
            <FormField name="personalEmail" type="email" label="Email personal" value={c.personalEmail} placeholder="tu.correo@gmail.com" />
            <div class="space-y-1">
              <label for="phone-input" class="block text-md font-bold mb-1" style="font-family: var(--font-subheading);">
                Teléfono
              </label>
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
            <FormField name="dateOfBirth" type="date" label="Fecha de nacimiento" value={c.dateOfBirth} />
          </div>
        </div>
      </div>

      <div class="md:col-span-4 flex items-center justify-center">
        <!-- Slim profile preview while editing -->
        <div class="max-w-xs w-full bg-surface rounded-xl border border-[--border] p-6 text-center">
         <div class="w-20 h-20 text-primary rounded-full flex items-center justify-center text-2xl font-bold mx-auto" style="background-color:  var(--bg-primary);">
            {c.firstName.charAt(0)}{c.lastName.charAt(0)}
          </div>
          <h2 class="text-base font-bold text-[--text-primary] mt-4">{c.firstName} {c.lastName}</h2>
          <p class="text-sm text-[--text-muted]">{c.major}</p>
          <p class="text-xs text-[--text-muted] mt-0.5">Semestre {c.currentUniversityYear}</p>
          <div class="mt-3"><StatusBadge status={c.trajectoryStatus} /></div>
        </div>
      </div>

      <div class="md:col-span-4 bg-surface rounded-xl border border-[--border] p-8">
        <h3 class="font-semibold text-[--text-primary] mb-3">Académico</h3>
        <div class="space-y-4">
          <FormField name="major" type="select" label="Carrera" required value={c.major}>
            <option value="">Selecciona tu carrera</option>
            {#each CARRERAS as carrera}
              <option value={carrera}>{carrera}</option>
            {/each}
          </FormField>
          <div class="grid grid-cols-2 gap-4">
            <FormField name="currentUniversityYear" type="number" label="Semestre actual" min={1} max={6} value={String(c.currentUniversityYear)} />
            <FormField name="expectedGraduationYear" type="number" label="Año graduación" min={2024} max={2035} value={String(c.expectedGraduationYear)} />
          </div>
        </div>
      </div>

      <!-- Habilidades | Áreas de interés -->
      <div class="md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div class="bg-surface rounded-xl border border-[--border] p-6">
          <h3 class="font-semibold text-[--text-primary]">Habilidades</h3>
          <div class="flex flex-wrap gap-2 mb-3">
            {#each c.habilidades as h, i}
              <span class="text-xs bg-[--bg-secondary] text-[--text-secondary] px-2.5 py-1 rounded-full">{h}</span>
              <input type="hidden" name="tag_ids" value={c.habilidadIds[i]} />
            {/each}
            {#each pendingNewTags as tag}
              <span class="text-xs bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full flex items-center gap-1">
                {tag} <span class="text-[10px]">(nuevo)</span>
                <button type="button" onclick={() => removePendingTag(tag)} class="hover:text-blue-900"><X size={12} /></button>
              </span>
              <input type="hidden" name="new_tags" value={tag} />
            {/each}
          </div>
          <!-- In edit mode we do NOT allow adding existing skills; only creating new ones as in signup -->
          {#if !isCreatingTag}
            <button type="button" onclick={() => { isCreatingTag = true; tagError = ''; }} class="flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg border transition-colors" style="border-color: var(--accent); color: var(--accent);">
              <Plus size={12} /> Crear habilidad
            </button>
          {:else}
            <div class="space-y-2">
              <div class="flex gap-2">
                <input type="text" bind:value={newTagName} placeholder="ej: react-native, python" class="flex-1 text-sm rounded-lg border px-3 py-2" style="background: var(--bg-secondary); border-color: var(--border); color: var(--text-primary);" oninput={() => tagError = validateTagInput(newTagName)} />
                <button type="button" onclick={() => { isCreatingTag = false; newTagName = ''; tagError = ''; }} class="px-2 py-2 text-[--text-muted]"><X size={16} /></button>
              </div>
              {#if tagError}<p class="text-xs text-red-500">{tagError}</p>{/if}
              {#if newTagName.trim()}
                <button type="button" onclick={addPendingTag} class="text-xs px-3 py-1.5 rounded-lg border transition-colors" style="border-color: var(--accent); color: var(--accent);">
                  Agregar: {newTagName.trim().toLowerCase()}
                </button>
              {/if}
            </div>
          {/if}
        </div>

        <div class="bg-surface rounded-xl border border-[--border] p-6">
          <h3 class="font-semibold text-[--text-primary]">Áreas de interés del D.Lab</h3>
          <label class="flex items-center gap-3 cursor-pointer">
            <input type="hidden" name="interestInMachinery" value="false" />
            <input type="checkbox" name="interestInMachinery" value="true" checked={c.interestInMachinery} class="h-4 w-4 rounded border-[--border] text-[--color-red]" />
            <span class="text-sm text-[--text-secondary]">Maquinaria (manejo de máquinas)</span>
          </label>
          <label class="flex items-center gap-3 cursor-pointer">
            <input type="hidden" name="interestInDesign" value="false" />
            <input type="checkbox" name="interestInDesign" value="true" checked={c.interestInDesign} class="h-4 w-4 rounded border-[--border] text-[--color-red]" />
            <span class="text-sm text-[--text-secondary]">Diseño</span>
          </label>
          <label class="flex items-center gap-3 cursor-pointer">
            <input type="hidden" name="interestInMaterials" value="false" />
            <input type="checkbox" name="interestInMaterials" value="true" checked={c.interestInMaterials} class="h-4 w-4 rounded border-[--border] text-[--color-red]" />
            <span class="text-sm text-[--text-secondary]">Materiales</span>
          </label>
        </div>
      </div>

      <!-- Disponibilidad semanal full-width -->
      <div class="md:col-span-12 bg-surface rounded-xl border border-[--border] p-6">
        <h3 class="font-semibold text-[--text-primary] mb-2">Disponibilidad semanal</h3>
        <p class="text-xs text-[--text-muted] mb-6">Selecciona los días y horarios en los que estás disponible</p>
        <AvailabilityPicker bind:value={editingAvailability} />
        <input type="hidden" name="availability_slots" value={JSON.stringify(editingAvailability)} />
      </div>

      <!-- Motivación | Experiencia previa -->
      <div class="md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div class="bg-surface rounded-xl border border-[--border] p-6">
          <FormField name="motivationDescription" type="textarea" label="Motivación" value={c.motivationDescription} rows={4} />
        </div>

        <div class="bg-surface rounded-xl border border-[--border] p-6">
          <FormField name="experienceDescription" type="textarea" label="Experiencia previa" value={c.experienceDescription} rows={4} />
        </div>
      </div>

      <!-- Actions -->
      <div class="md:col-span-12 bg-surface rounded-xl border border-[--border] p-6 flex items-center justify-end">
        <div class="flex gap-3">
          <Button type="submit" variant="primary" label="Guardar cambios" />
          <Button type="button" variant="secondary" onclick={cancelEdit} label="Cancelar" />
        </div>
      </div>
    </form>
  {/if}
</div>
