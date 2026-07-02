<script lang="ts">
  import { enhance } from '$app/forms';
  import { Plus, X } from 'lucide-svelte';
  import { capture, identify, distinctIdForCollaborator } from '$lib/utils/posthog';
  import Button from '$lib/components/ui/Button.svelte';
  import StatusBadge from '$lib/components/ui/StatusBadge.svelte';
  import FormField from '$lib/components/ui/FormField.svelte';
  import FormErrorSummary from '$lib/components/ui/FormErrorSummary.svelte';
  import RichTextField from '$lib/components/ui/RichTextField.svelte';
  import AvailabilityPicker from '$lib/components/ui/AvailabilityPicker.svelte';
  import CollaboratorProfileView from '$lib/components/profile/CollaboratorProfileView.svelte';
  import { TelInput } from 'svelte-tel-input';
  import type { CountryCode } from 'svelte-tel-input/types';
  import { COLLAB_LIMITS, validateAvailabilityForm, validateProfileForm } from '$lib/validation/collaborator';
  import { extractApiError, mapBackendFields, summarizeFormError } from '$lib/validation/apiError';
  import { profileFieldMap } from '$lib/validation/fieldMaps';
  import InfoRow from "$lib/components/ui/InfoRow.svelte";

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
  let firstName = $state('');
  let middleName = $state('');
  let lastName = $state('');
  let secondLastName = $state('');
  let personalEmail = $state('');
  let dateOfBirth = $state('');
  let major = $state('');
  let currentUniversityYear = $state('');
  let expectedGraduationYear = $state('');
  let motivationDescription = $state('');
  let experienceDescription = $state('');
  let interestInMachinery = $state(false);
  let interestInDesign = $state(false);
  let interestInMaterials = $state(false);
  let touched = $state<Record<string, boolean>>({});
  let submitAttempted = $state(false);
  let backendErrors = $state<Record<string, string>>({});
  let topError = $state('');

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

  function hasRichTextContent(value: string): boolean {
    return value.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim() !== '';
  }

  function markTouched(key: string) {
    if (!touched[key]) touched = { ...touched, [key]: true };
    if (backendErrors[key]) {
      const { [key]: _drop, ...rest } = backendErrors;
      backendErrors = rest;
    }
  }

  const profileFrontErrors = $derived(
    validateProfileForm({
      firstName,
      middleName: middleName || undefined,
      lastName,
      secondLastName: secondLastName || undefined,
      personalEmail: personalEmail || undefined,
      phoneNumber: phoneNumber || undefined,
      dateOfBirth: dateOfBirth || undefined,
      major: major || undefined,
      currentUniversityYear: currentUniversityYear ? Number(currentUniversityYear) : null,
      expectedGraduationYear: expectedGraduationYear ? Number(expectedGraduationYear) : null,
      motivationDescription: motivationDescription || undefined,
      experienceDescription: experienceDescription || undefined,
      interestInMachinery,
      interestInDesign,
      interestInMaterials,
    }) as Record<string, string>
  );

  const availabilityFrontErrors = $derived(
    validateAvailabilityForm({
      slots: editingAvailability,
    }) as Record<string, string>
  );

  const frontErrors = $derived<Record<string, string>>({
    ...profileFrontErrors,
    ...(availabilityFrontErrors.slots ? { availability_slots: availabilityFrontErrors.slots } : {}),
    ...(!phoneValid && phoneNumber.trim() ? { phoneNumber: 'Número de teléfono inválido' } : {}),
  });

  const errors = $derived<Record<string, string>>({
    ...frontErrors,
    ...backendErrors,
  });

  const show = $derived<Record<string, boolean>>({
    firstName: touched.firstName || firstName.trim().length > 0 || submitAttempted,
    middleName: touched.middleName || middleName.trim().length > 0 || submitAttempted,
    lastName: touched.lastName || lastName.trim().length > 0 || submitAttempted,
    secondLastName: touched.secondLastName || secondLastName.trim().length > 0 || submitAttempted,
    personalEmail: touched.personalEmail || personalEmail.trim().length > 0 || submitAttempted,
    phoneNumber: touched.phoneNumber || phoneNumber.trim().length > 0 || submitAttempted,
    dateOfBirth: touched.dateOfBirth || dateOfBirth.trim().length > 0 || submitAttempted,
    major: touched.major || major.trim().length > 0 || submitAttempted,
    currentUniversityYear:
      touched.currentUniversityYear || currentUniversityYear.trim().length > 0 || submitAttempted,
    expectedGraduationYear:
      touched.expectedGraduationYear || expectedGraduationYear.trim().length > 0 || submitAttempted,
    motivationDescription:
      touched.motivationDescription || hasRichTextContent(motivationDescription) || submitAttempted,
    experienceDescription:
      touched.experienceDescription || hasRichTextContent(experienceDescription) || submitAttempted,
    availability_slots:
      touched.availability_slots || editingAvailability.length > 0 || submitAttempted,
  });

  const phoneInputClass = $derived(
    `block w-full rounded-lg border px-3 py-2.5 text-sm text-[--text-primary] placeholder-[--text-muted] focus:outline-none focus:ring-2 focus:ring-[--color-red] focus:border-[--color-red] transition-colors duration-150 ${
      show.phoneNumber && errors.phoneNumber ? 'border-red-400' : 'border-[--border]'
    }`
  );

  function handleProfileEnhance() {
    return ({ formElement, cancel }: { formElement: HTMLFormElement; cancel: () => void }) => {
      submitAttempted = true;
      if (Object.keys(frontErrors).length > 0 || tagError) {
        touched = {
          ...touched,
          firstName: true,
          middleName: true,
          lastName: true,
          secondLastName: true,
          personalEmail: true,
          phoneNumber: true,
          dateOfBirth: true,
          major: true,
          currentUniversityYear: true,
          expectedGraduationYear: true,
          motivationDescription: true,
          experienceDescription: true,
          availability_slots: true,
        };
        topError = tagError || 'Revisa los campos marcados antes de continuar.';
        cancel();
        return;
      }
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
      topError = '';
      backendErrors = {};
      touched = {};
      submitAttempted = false;
    }
  });

  $effect(() => {
    if (form?.apiError !== undefined || form?.error !== undefined) {
      const extracted = extractApiError(form?.apiError ?? form?.error ?? null);
      backendErrors = mapBackendFields(extracted.fields, profileFieldMap);
      topError = summarizeFormError(extracted);
      submitAttempted = true;
      const next: Record<string, boolean> = { ...touched };
      for (const k of Object.keys(backendErrors)) next[k] = true;
      touched = next;
    }
  });

  $effect(() => {
    if (isEditing && data.colaborador) {
      editingAvailability = [...(data.colaborador.availabilitySlots || [])];
      firstName = data.colaborador.firstName || '';
      middleName = data.colaborador.middleName || '';
      lastName = data.colaborador.lastName || '';
      secondLastName = data.colaborador.secondLastName || '';
      personalEmail = data.colaborador.personalEmail || '';
      phoneNumber = data.colaborador.phoneNumber || '';
      dateOfBirth = data.colaborador.dateOfBirth || '';
      major = data.colaborador.major || '';
      currentUniversityYear = String(data.colaborador.currentUniversityYear || '');
      expectedGraduationYear = String(data.colaborador.expectedGraduationYear || '');
      motivationDescription = data.colaborador.motivationDescription || '';
      experienceDescription = data.colaborador.experienceDescription || '';
      interestInMachinery = Boolean(data.colaborador.interestInMachinery);
      interestInDesign = Boolean(data.colaborador.interestInDesign);
      interestInMaterials = Boolean(data.colaborador.interestInMaterials);
      originalContactSnapshot = {
        personalEmail: (data.colaborador.personalEmail || '').trim(),
        phoneNumber: (data.colaborador.phoneNumber || '').trim()
      };
      originalAvailabilityKey = availabilityKey(data.colaborador.availabilitySlots);
    }
  });


  function addPendingTag() {
    const trimmed = newTagName.trim();
    if (!pendingNewTags.includes(trimmed)) {
      pendingNewTags = [...pendingNewTags, trimmed];
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
    if (normalized.length < 2 || normalized.length > 50) return 'Entre 2 y 50 caracteres';
    return '';
  }

  function cancelEdit() {
    isEditing = false;
    pendingNewTags = [];
    newTagName = '';
    tagError = '';
    isCreatingTag = false;
    topError = '';
    backendErrors = {};
    touched = {};
    submitAttempted = false;
  }

  const c = $derived(data.colaborador);
</script>

<svelte:head>
  <title>Mi perfil — DLAB</title>
</svelte:head>

<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
  <header class="mb-6 flex flex-wrap items-center justify-between gap-4">
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
    <InfoRow label="Todos los datos registrados son necesarios, por lo que no podemos permitir campos vacíos durante tu registro o modificación de perfil. Los datos registrados se mantendran en nuestros registros. Si bien los puedes cambiar, por políticas internas no se pueden eliminar" icon="Info" classes="text-xs text-red-800" value=""/>
    <form method="POST" action="?/updateProfile" use:enhance={handleProfileEnhance()} class="grid grid-cols-1 md:grid-cols-12 gap-5">
      <div class="md:col-span-12">
        <FormErrorSummary message={topError} onDismiss={() => (topError = '')} />
      </div>
      <div class="md:col-span-4 bg-surface rounded-xl border border-[--border] p-8">
        <h3 class="font-semibold text-[--text-primary] mb-3">Información personal</h3>
        <div class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              name="firstName"
              label="Nombre"
              required
              bind:value={firstName}
              counter={COLLAB_LIMITS.firstName.max}
              hint={`Máximo ${COLLAB_LIMITS.firstName.max} caracteres`}
              error={errors.firstName}
              touched={show.firstName}
            />
            <FormField
              name="middleName"
              label="Segundo nombre"
              bind:value={middleName}
              counter={COLLAB_LIMITS.middleName.max}
              hint={`Máximo ${COLLAB_LIMITS.middleName.max} caracteres`}
              error={errors.middleName}
              touched={show.middleName}
            />
            <FormField
              name="lastName"
              label="Apellido"
              required
              bind:value={lastName}
              counter={COLLAB_LIMITS.lastName.max}
              hint={`Máximo ${COLLAB_LIMITS.lastName.max} caracteres`}
              error={errors.lastName}
              touched={show.lastName}
            />
            <FormField
              name="secondLastName"
              label="Segundo apellido"
              bind:value={secondLastName}
              counter={COLLAB_LIMITS.secondLastName.max}
              hint={`Máximo ${COLLAB_LIMITS.secondLastName.max} caracteres`}
              error={errors.secondLastName}
              touched={show.secondLastName}
            />
          </div>
          <div class="space-y-4">
            <FormField
              name="personalEmail"
              type="email"
              label="Email personal"
              bind:value={personalEmail}
              placeholder="tu.correo@gmail.com"
              counter={COLLAB_LIMITS.personalEmail.max}
              hint={`Máximo ${COLLAB_LIMITS.personalEmail.max} caracteres`}
              error={errors.personalEmail}
              touched={show.personalEmail}
            />
            <div class="space-y-1">
              <label for="phone-input" class="block text-md font-bold mb-1" style="font-family: var(--font-subheading);">
                Teléfono
              </label>
              <TelInput 
                id="phone-input"
                bind:value={phoneNumber}
                bind:country={phoneCountry}
                bind:valid={phoneValid}
                oninput={() => markTouched('phoneNumber')}
                options={{ autoPlaceholder: true, spaces: true }}
                class={phoneInputClass}
                style="background: var(--bg-surface);"
              />
              <input type="hidden" name="phoneNumber" value={phoneNumber} />
              {#if show.phoneNumber && errors.phoneNumber}
                <p class="mt-1 text-xs text-red-500">{errors.phoneNumber}</p>
              {:else}
                <p class="mt-1 text-xs text-[--text-muted]">Entre {COLLAB_LIMITS.phoneNumber.min} y {COLLAB_LIMITS.phoneNumber.max} caracteres.</p>
              {/if}
            </div>
            <FormField
              name="dateOfBirth"
              type="date"
              label="Fecha de nacimiento"
              bind:value={dateOfBirth}
              error={errors.dateOfBirth}
              touched={show.dateOfBirth}
            />
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
          <FormField
            name="major"
            type="select"
            label="Carrera"
            required
            bind:value={major}
            error={errors.major}
            touched={show.major}
          >
            <option value="">Selecciona tu carrera</option>
            {#each CARRERAS as carrera}
              <option value={carrera}>{carrera}</option>
            {/each}
          </FormField>
          <div class="grid grid-cols-2 gap-4">
            <FormField
              name="currentUniversityYear"
              type="number"
              label="Semestre actual"
              min={1}
              max={12}
              bind:value={currentUniversityYear}
              hint="Entre 1 y 12"
              error={errors.currentUniversityYear}
              touched={show.currentUniversityYear}
            />
            <FormField
              name="expectedGraduationYear"
              type="number"
              label="Año graduación"
              min={2026}
              bind:value={expectedGraduationYear}
              error={errors.expectedGraduationYear}
              touched={show.expectedGraduationYear}
            />
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
                  Agregar: {newTagName.trim()}
                </button>
              {/if}
            </div>
          {/if}
        </div>

        <div class="bg-surface rounded-xl border border-[--border] p-6">
          <h3 class="font-semibold text-[--text-primary]">Áreas de interés del D.Lab</h3>
          <label class="flex items-center gap-3 cursor-pointer">
            <input type="hidden" name="interestInMachinery" value="false" />
            <input type="checkbox" name="interestInMachinery" value="true" bind:checked={interestInMachinery} class="h-4 w-4 rounded border-[--border] text-[--color-red]" />
            <span class="text-sm text-[--text-secondary]">Maquinaria (manejo de máquinas)</span>
          </label>
          <label class="flex items-center gap-3 cursor-pointer">
            <input type="hidden" name="interestInDesign" value="false" />
            <input type="checkbox" name="interestInDesign" value="true" bind:checked={interestInDesign} class="h-4 w-4 rounded border-[--border] text-[--color-red]" />
            <span class="text-sm text-[--text-secondary]">Diseño</span>
          </label>
          <label class="flex items-center gap-3 cursor-pointer">
            <input type="hidden" name="interestInMaterials" value="false" />
            <input type="checkbox" name="interestInMaterials" value="true" bind:checked={interestInMaterials} class="h-4 w-4 rounded border-[--border] text-[--color-red]" />
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
        {#if show.availability_slots && errors.availability_slots}
          <p class="mt-2 text-xs text-red-500">{errors.availability_slots}</p>
        {/if}
      </div>

      <!-- Motivación | Experiencia previa -->
      <div class="md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div class="bg-surface rounded-xl border border-[--border] p-6">
          <RichTextField
            name="motivationDescription"
            label="Motivación"
            value={motivationDescription}
            minHeightClass="min-h-[120px]"
            onchange={(html) => { motivationDescription = html; markTouched('motivationDescription'); }}
            hint={`Mínimo ${COLLAB_LIMITS.motivationDescription.min} caracteres`}
            error={errors.motivationDescription}
            touched={show.motivationDescription}
          />
        </div>

        <div class="bg-surface rounded-xl border border-[--border] p-6">
          <RichTextField
            name="experienceDescription"
            label="Experiencia previa"
            value={experienceDescription}
            minHeightClass="min-h-[120px]"
            onchange={(html) => { experienceDescription = html; markTouched('experienceDescription'); }}
            error={errors.experienceDescription}
            touched={show.experienceDescription}
          />
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
