<script lang="ts">
  import { enhance } from '$app/forms';
  import { AlertCircle, CheckCircle2, Plus, X } from 'lucide-svelte';
  import { capture } from '$lib/utils/posthog';
  import FormField from '$lib/components/ui/FormField.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import AvailabilityPicker from '$lib/components/ui/AvailabilityPicker.svelte';
  import { TelInput } from 'svelte-tel-input';
  import type { CountryCode } from 'svelte-tel-input/types';

  interface Props {
    data: { carreras: any[]; habilidades: any[]; areas: any[] };
    form: any;
  }

  let { data, form }: Props = $props();

  let correoValue = $state('');
  let correoPersonalValue = $state('');
  let availabilitySlots = $state<any[]>([]);
  let phoneNumber = $state('');
  let phoneCountry = $state<CountryCode | null>('EC');
  let phoneValid = $state(true);
  let pendingTags = $state<string[]>([]);
  let newTagName = $state('');
  let tagError = $state('');
  let isCreatingTag = $state(false);
  
  // Form validation
  let nombresValue = $state('');
  let apellidosValue = $state('');
  let carreraValue = $state('');
  let semestreValue = $state('');
  let anioGraduacionValue = $state('');
  let fechaNacimientoValue = $state('');
  let motivacionValue = $state('');
  let interestChecked = $state(false);
  
  // Error toasts
  let errorToasts = $state<{id: number; msg: string}[]>([]);
  let toastId = 0;
  let lastFormError = $state('');
  
  function showErrorToast(message: string) {
    const id = ++toastId;
    errorToasts.push({id, msg: message});
    setTimeout(() => dismissToast(id), 5000);
  }
  
  function dismissToast(id: number) {
    const idx = errorToasts.findIndex(t => t.id === id);
    if (idx !== -1) errorToasts.splice(idx, 1);
  }
  
  // Real-time validation
  let emailError = $state('');
  let personalEmailError = $state('');
  let motivacionError = $state('');
  let anioGraduacionError = $state('');
  let anioGraduacionTouched = $state(false);

  function validateEmail(email: string): string {
  if (!email || email.length < 3) return '';

  // Regex: local part + "@" + any subdomain + ".usfq.edu.ec"
  const regex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.usfq\.edu\.ec$/;

  if (!regex.test(email)) {
    return 'Debe terminar en @*.usfq.edu.ec';
  }

  return '';
}

  
  function validatePersonalEmail(email: string): string {
    if (!email || email.length < 3) return '';
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email)) {
      return 'Correo electrónico inválido';
    }
    return '';
  }
  
  function validateMotivacion(text: string): string {
    if (!text || text.length === 0) return '';
    if (text.length < 50) {
      return `Mínimo 50 caracteres (faltan ${50 - text.length})`;
    }
    return '';
  }

  function validateAnioGraduacion(value: string): string {
    if (!value) return 'Requerido';
    const num = parseInt(value, 10);
    if (!Number.isFinite(num) || String(num) !== value.trim()) return 'Debe ser un número entero';
    if (num <= 2026) return 'Debe ser mayor a 2026';
    return '';
  }
  
  $effect(() => {
    emailError = validateEmail(correoValue);
    personalEmailError = validatePersonalEmail(correoPersonalValue);
    motivacionError = validateMotivacion(motivacionValue);
    if (anioGraduacionTouched) {
      anioGraduacionError = validateAnioGraduacion(anioGraduacionValue);
    }
  });
  
  $effect(() => {
    if (form?.error && form.error !== lastFormError) {
      lastFormError = form.error;
      showErrorToast(form.error);
    }
  });
  
  let formIsValid = $derived(
    nombresValue.trim() !== '' &&
    apellidosValue.trim() !== '' &&
    correoValue.trim() !== '' &&
    !emailError &&
    correoPersonalValue.trim() !== '' &&
    !personalEmailError &&
    phoneNumber.trim() !== '' &&
    fechaNacimientoValue !== '' &&
    carreraValue !== '' &&
    semestreValue !== '' &&
    !anioGraduacionError &&
    pendingTags.length > 0 &&
    interestChecked &&
    availabilitySlots.length > 0 &&
    motivacionValue.trim().length >= 50
  );

  function validateTagInput(value: string): string {
    const t = value.trim();
    if (!t) return 'Nombre requerido';
    if (t.length < 2 || t.length > 50) return 'Entre 2 y 50 caracteres';
    return '';
  }

  function addPendingTag() {
    const normalized = newTagName.trim();
    if (!validateTagInput(normalized) && !pendingTags.includes(normalized)) {
      pendingTags = [...pendingTags, normalized];
      newTagName = '';
      tagError = '';
      isCreatingTag = false;
    }
  }

  function removePendingTag(tag: string) {
    pendingTags = pendingTags.filter(t => t !== tag);
  }

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

  $effect(() => {
    if (form?.success && form?.nombre) {
      // Frontend complement to the authoritative `collaborator_signup_submitted`
      // emitted by `auth.controller.js#register` after successful persistence.
      // We don't have the new collaborator's stable ID here (signup returns no
      // distinct ID — activation happens later), so we emit the event without
      // an identify call; backend already identified the collaborator as
      // `collaborator:{id}`. NEVER use email as the distinct ID.
      capture('collaborator_signup_submitted', {
        major: carreraValue || null,
        semester: semestreValue ? Number(semestreValue) : null,
        intake_source: 'signup_form',
        route: '/signup',
        route_group: 'auth',
        source: 'frontend'
      });
    }
  });
</script>

<svelte:head>
  <title>Únete a DLAB — DLAB</title>
</svelte:head>

<!-- Error Toasts -->
<div class="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
  {#each errorToasts as toast (toast.id)}
    <div class="pointer-events-auto bg-red-600 text-white pl-4 pr-10 py-3 rounded-lg shadow-lg max-w-sm relative overflow-hidden">
      <div class="flex items-start gap-2">
        <AlertCircle size={16} class="flex-shrink-0 mt-0.5" />
        <p class="text-sm leading-snug">{toast.msg}</p>
      </div>
      <button type="button" onclick={() => dismissToast(toast.id)} class="absolute top-2 right-2 p-1 rounded hover:bg-red-700 transition-colors">
        <X size={14} />
      </button>
      <div class="absolute bottom-0 left-0 h-0.5 bg-red-300 animate-shrink"></div>
    </div>
  {/each}
</div>

<div class="w-full max-w-2xl">
  <div class="bg-surface rounded-2xl shadow-xl border border-[--border] overflow-hidden">
    <div class="px-8 py-6 border-b" style="border-color: var(--border);">
      <div class="text-center">
        <span class="text-lg uppercase tracking-widest block mb-3" style="color: var(--accent); font-family: var(--font-subheading);">Únete a DLAB</span>
        <div class="w-full h-0.5 mx-auto mb-3" style="background: var(--accent); opacity: 0.3;"></div>
        <p class="text-[--text-muted] text-sm">Completa el formulario para expresar tu interés en colaborar</p>
      </div>
    </div>

    {#if form?.success}
      <div class="px-8 py-14 text-center">
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 class="text-green-600" size={32} />
        </div>
        <h2 class="text-xl font-bold text-[--text-primary]">¡Solicitud recibida!</h2>
        <p class="text-[--text-secondary] text-sm mt-2 leading-relaxed max-w-sm mx-auto">
          Gracias <strong>{form.nombre}</strong>. Enviaremos una confirmacion por correo y tu solicitud quedara en revision hasta que un administrador la apruebe.
        </p>
        <Button variant="ghost" href="/" label="Volver al inicio" classes="mt-8" />
      </div>
    {:else}
      <form method="POST" action="?/register" use:enhance class="px-8 py-6 space-y-7">
        <!-- Personal info -->
        <fieldset>
          <legend class="block mb-4">
            <span class="text-lg uppercase tracking-widest block mb-3" style="color: var(--accent); font-family: var(--font-subheading);">Información personal</span>
            <div class="w-full h-0.5" style="background: var(--accent); opacity: 0.3;"></div>
          </legend>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField name="nombres" label="Nombres" required placeholder="Ej: María José" bind:value={nombresValue} error={form?.errors?.nombres} />
            <FormField name="apellidos" label="Apellidos" required placeholder="Ej: Rodríguez López" bind:value={apellidosValue} error={form?.errors?.apellidos} />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <FormField
              name="correo_institucional"
              type="email"
              label="Correo institucional USFQ"
              required
              placeholder="tu.nombre@usfq.edu.ec"
              hint="Debes usar un correo que termine en .usfq.edu.ec"
              error={emailError || form?.errors?.correo_institucional}
              bind:value={correoValue}
            />
            <FormField
              name="correo_personal"
              type="email"
              label="Correo personal"
              required
              placeholder="tu.email@gmail.com"
              error={personalEmailError || form?.errors?.correo_personal}
              bind:value={correoPersonalValue}
            />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div class="space-y-1">
              <label for="phone-input" class="block text-md font-bold mb-1" style="font-family: var(--font-subheading);">
                Teléfono <span class="text-red-500">*</span>
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
              <input type="hidden" name="telefono" value={phoneNumber} />
              {#if form?.errors?.telefono}
                <p class="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle size={11} /> {form.errors.telefono}
                </p>
              {/if}
            </div>
            <FormField
              name="fecha_nacimiento"
              type="date"
              label="Fecha de nacimiento"
              required
              bind:value={fechaNacimientoValue}
              error={form?.errors?.fecha_nacimiento}
            />
            </div>
          <div class="space-y-4 mt-4">
            <FormField name="carrera" type="select" label="Carrera" required bind:value={carreraValue} error={form?.errors?.carrera}>
              <option value="">Selecciona tu carrera</option>
              {#each CARRERAS as carrera}
                <option value={carrera}>{carrera}</option>
              {/each}
            </FormField>
            <div class="grid grid-cols-2 gap-4">
              <FormField name="semestre" type="number" label="Semestre actual" required placeholder="Ej: 5" min={1} max={12} bind:value={semestreValue} error={form?.errors?.semestre} />
              <div onfocusout={() => { anioGraduacionTouched = true; anioGraduacionError = validateAnioGraduacion(anioGraduacionValue); }}>
                <FormField name="anio_graduacion" type="number" label="Año esperado de graduación" required placeholder="Ej: 2030" min={2027} bind:value={anioGraduacionValue} error={(anioGraduacionTouched ? anioGraduacionError : '') || form?.errors?.anio_graduacion} />
              </div>
            </div>
          </div>
        </fieldset>

        <div class="border-t border-[--border]"></div>

        <!-- Profile -->
        <fieldset>
          <legend class="block mb-4">
            <span class="text-lg uppercase tracking-widest block mb-3" style="color: var(--accent); font-family: var(--font-subheading);">Perfil y habilidades</span>
            <div class="w-full h-0.5" style="background: var(--accent); opacity: 0.3;"></div>
          </legend>
          
          <!-- Tags / Habilidades -->
          <div class="space-y-3">
            <p class="block text-md font-bold" style="font-family: var(--font-subheading);">
              Habilidades <span class="text-red-500">*</span>
            </p>
            <div class="flex flex-wrap gap-2 mb-3 min-h-[32px]">
              {#each pendingTags as tag}
                <span class="text-xs bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full flex items-center gap-1">
                  {tag}
                  <button type="button" onclick={() => removePendingTag(tag)} class="hover:text-blue-900"><X size={12} /></button>
                </span>
                <input type="hidden" name="new_tags" value={tag} />
              {:else}
                <p class="text-xs text-[--text-muted]">Agrega al menos una habilidad</p>
              {/each}
            </div>
            {#if !isCreatingTag}
              <button type="button" onclick={() => { isCreatingTag = true; tagError = ''; }} class="flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg border transition-colors" style="border-color: var(--accent); color: var(--accent);">
                <Plus size={12} /> Crear habilidad
              </button>
            {:else}
              <div class="space-y-2">
                <div class="flex gap-2">
                  <input type="text" bind:value={newTagName} placeholder="ej: react-native, python" class="flex-1 text-sm rounded-lg border px-3 py-2" style="background: var(--bg-surface); border-color: var(--border); color: var(--text-primary);" oninput={() => tagError = validateTagInput(newTagName)} />
                  <button type="button" onclick={() => { isCreatingTag = false; newTagName = ''; tagError = ''; }} class="px-2 py-2 text-[--text-muted]"><X size={16} /></button>
                </div>
                {#if tagError}<p class="text-xs text-red-500">{tagError}</p>{/if}
                {#if newTagName.trim() && !validateTagInput(newTagName)}
                  <button type="button" onclick={addPendingTag} class="text-xs px-3 py-1.5 rounded-lg border transition-colors" style="border-color: var(--accent); color: var(--accent);">
                    Agregar: {newTagName.trim().toLowerCase()}
                  </button>
                {/if}
              </div>
            {/if}
            {#if form?.errors?.habilidades}
              <p class="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle size={11} /> {form.errors.habilidades}
              </p>
            {/if}
          </div>

          <!-- Interests -->
          <div class="space-y-3 mt-6">
            <p class="block text-md font-bold" style="font-family: var(--font-subheading);">
              Áreas de interés del D.Lab <span class="text-red-500">*</span>
            </p>
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="hidden" name="interestInMachinery" value="false" />
              <input type="checkbox" name="interestInMachinery" value="true" onchange={(e) => interestChecked = e.currentTarget.checked || document.querySelector('input[name="interestInDesign"]:checked') !== null || document.querySelector('input[name="interestInMaterials"]:checked') !== null} class="h-4 w-4 rounded border-[--border] text-[--color-red]" />
              <span class="text-sm text-[--text-secondary]">Maquinaria (manejo de máquinas)</span>
            </label>
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="hidden" name="interestInDesign" value="false" />
              <input type="checkbox" name="interestInDesign" value="true" onchange={(e) => interestChecked = e.currentTarget.checked || document.querySelector('input[name="interestInMachinery"]:checked') !== null || document.querySelector('input[name="interestInMaterials"]:checked') !== null} class="h-4 w-4 rounded border-[--border] text-[--color-red]" />
              <span class="text-sm text-[--text-secondary]">Diseño</span>
            </label>
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="hidden" name="interestInMaterials" value="false" />
              <input type="checkbox" name="interestInMaterials" value="true" onchange={(e) => interestChecked = e.currentTarget.checked || document.querySelector('input[name="interestInMachinery"]:checked') !== null || document.querySelector('input[name="interestInDesign"]:checked') !== null} class="h-4 w-4 rounded border-[--border] text-[--color-red]" />
              <span class="text-sm text-[--text-secondary]">Materiales</span>
            </label>
          </div>
          
          <div class="mt-6">
            <p class="text-sm font-medium block mb-2" style="color: var(--text-primary);">
              Disponibilidad semanal <span class="text-red-500">*</span>
            </p>
            <p class="text-xs mb-3" style="color: var(--text-muted);">
              Selecciona los días y horarios en los que estás disponible para participar
            </p>
            <AvailabilityPicker bind:value={availabilitySlots} />
            <input type="hidden" name="availability_slots" value={JSON.stringify(availabilitySlots)} />
            {#if form?.errors?.disponibilidad_semanal}
              <p class="text-xs text-red-500 mt-2 flex items-center gap-1">
                <AlertCircle size={11} /> {form.errors.disponibilidad_semanal}
              </p>
            {/if}
          </div>

          <FormField
            name="motivacion"
            type="textarea"
            label="¿Por qué quieres unirte a DLAB?"
            required
            placeholder="Cuéntanos sobre tu interés (mínimo 50 caracteres)"
            rows={4}
            bind:value={motivacionValue}
            error={motivacionError || form?.errors?.motivacion} 
          />
          <div class="mb-4"></div>
          <FormField name="experiencia_previa" type="textarea" label="Experiencia previa relevante (opcional)" placeholder="Proyectos, trabajos..." rows={3} />
        </fieldset>

        <div class="border-t border-[--border]"></div>

        <!-- Consent -->
        <div>
          <label class="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" name="consentimiento_datos" class="mt-0.5 h-4 w-4 rounded border-[--border] text-[--color-red] focus:ring-[--color-red]" />
            <span class="text-sm text-[--text-secondary] leading-relaxed">
              Acepto que mis datos sean almacenados y procesados por DLAB para la gestión de mi participación.
              <span class="text-red-500">*</span>
            </span>
          </label>
          {#if form?.errors?.consentimiento_datos}
            <p class="text-xs text-red-500 mt-1.5 ml-7 flex items-center gap-1">
              <AlertCircle size={11} /> Debes aceptar el consentimiento para continuar.
            </p>
          {/if}
        </div>

        <Button type="submit" variant="primary" fullWidth size="lg" label="Enviar solicitud" disabled={!formIsValid} />

        <p class="text-center text-sm text-[--text-muted]">
          ¿Ya tienes cuenta?
          <a href="/login" class="text-[--color-red] hover:underline font-medium ml-1">Inicia sesión</a>
        </p>
      </form>
    {/if}
  </div>
</div>

<style>
  @keyframes shrink {
    from { width: 100%; }
    to { width: 0%; }
  }
  .animate-shrink {
    animation: shrink 5s linear forwards;
  }
</style>
