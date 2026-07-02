<script lang="ts">
  import { enhance } from '$app/forms';
  import { untrack } from 'svelte';
  import { ArrowLeft, Trash2, Search } from 'lucide-svelte';
  import FormField from '$lib/components/ui/FormField.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import RichTextField from '$lib/components/ui/RichTextField.svelte';
  import AvailabilityPicker from '$lib/components/ui/AvailabilityPicker.svelte';
  import FormErrorSummary from '$lib/components/ui/FormErrorSummary.svelte';
  import { slugify } from '$lib/utils';
  import {
    validateProjectForm,
    PROJECT_LIMITS,
    PARTICIPATION_MODES,
    PROJECT_STATUSES,
  } from '$lib/validation/project';
  import {
    extractApiError,
    mapBackendFields,
    summarizeFormError,
  } from '$lib/validation/apiError';
  import { projectFieldMap } from '$lib/validation/fieldMaps';

  type TagOption = { id: number; name: string; slug: string; category: string };
  type MeetingDay = { dayOfWeek: string; startTime: string; endTime: string; notes: string };
  type SkillItem = { name: string; slug?: string };
  interface Props {
    data: {
      project: any;
      systemTags: TagOption[];
      projectTags: TagOption[];
      systemTagsMeta: { page: number; limit: number; total: number };
      projectTagsMeta: { page: number; limit: number; total: number };
      admins: any[];
    };
    form?: { error?: string; apiError?: unknown };
  }

  let { data, form }: Props = $props();

  let selectedCategoryIds = $state<number[]>(JSON.parse(data.project.category_tags_json || '[]'));
  let selectedSubcategoryIds = $state<number[]>(JSON.parse(data.project.subcategory_tags_json || '[]'));
  let newTags = $state<Array<{ name: string; slug?: string; category?: string }>>(JSON.parse(data.project.new_tags_json || '[]'));
  let requiredSkills = $state<SkillItem[]>(JSON.parse(data.project.required_skill_items_json || '[]'));
  let meetingDays = $state<MeetingDay[]>(JSON.parse(data.project.meeting_days_json || '[]'));
  let newTagName = $state('');
  let newTagCategory = $state(data.systemTags[0]?.name || 'Diseño');
  let newSkillName = $state('');

  // ---------------------------------------------------------------------
  // Core project field state — primed from the loaded project record.
  // ---------------------------------------------------------------------
  let nombre = $state<string>(data.project?.nombre || '');
  let slug = $state<string>(data.project?.slug || '');
  let slugEdited = $state(false);
  let descripcion_corta = $state<string>(data.project?.descripcion_corta || '');
  let descripcion_larga = $state<string>(data.project?.descripcion_larga || '');
  let target_audience = $state<string>(data.project?.target_audience || '');
  let modalidad = $state<typeof PARTICIPATION_MODES[number] | ''>(
    (data.project?.modalidad as typeof PARTICIPATION_MODES[number]) || ''
  );
  let cupo_maximo = $state<string>(
    data.project?.cupo_maximo == null ? '' : String(data.project.cupo_maximo)
  );
  let estado = $state<typeof PROJECT_STATUSES[number]>(
    (data.project?.estado as typeof PROJECT_STATUSES[number]) || 'Próximo'
  );
  let header_image_url = $state<string>(data.project?.header_image_url || '');
  let video_url = $state<string>(data.project?.video_url || '');

  let subcategorySearch = $state('');

  // ---------------------------------------------------------------------
  // Touch tracking + backend errors + top-level summary
  // ---------------------------------------------------------------------
  let touched = $state<Record<string, boolean>>({});
  let submitAttempted = $state(false);
  let backendErrors = $state<Record<string, string>>({});
  let topError = $state('');
  let confirmDelete = $state(false);

  function markTouched(key: string) {
    if (!touched[key]) touched = { ...touched, [key]: true };
    if (backendErrors[key]) {
      const { [key]: _drop, ...rest } = backendErrors;
      backendErrors = rest;
    }
  }

  function stripHtml(value: string): string {
    return value
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }

  let cupo_maximo_num = $derived<number | null>(
    cupo_maximo === '' || cupo_maximo === null || cupo_maximo === undefined
      ? null
      : Number(cupo_maximo)
  );
  let descripcion_corta_plain = $derived(stripHtml(descripcion_corta));
  let descripcion_larga_plain = $derived(stripHtml(descripcion_larga));
  let target_audience_plain = $derived(stripHtml(target_audience));

  let frontErrors = $derived(
    validateProjectForm({
      title: nombre,
      slug: slug || undefined,
      short_description: descripcion_corta_plain,
      full_description: descripcion_larga_plain,
      target_audience: target_audience_plain || undefined,
      participation_mode: modalidad || undefined,
      status: estado,
      header_image_url: header_image_url || undefined,
      video_url: video_url || undefined,
      max_collaborators: cupo_maximo_num,
    }) as Record<string, string>
  );

  function hasContent(value: unknown): boolean {
    if (value == null) return false;
    if (typeof value === 'string') {
      return stripHtml(value) !== '';
    }
    return true;
  }

  let show = $derived<Record<string, boolean>>({
    nombre: touched.nombre || hasContent(nombre) || submitAttempted,
    slug: touched.slug || hasContent(slug) || submitAttempted,
    descripcion_corta: touched.descripcion_corta || hasContent(descripcion_corta) || submitAttempted,
    descripcion_larga: touched.descripcion_larga || hasContent(descripcion_larga) || submitAttempted,
    target_audience: touched.target_audience || hasContent(target_audience) || submitAttempted,
    modalidad: touched.modalidad || !!modalidad || submitAttempted,
    cupo_maximo: touched.cupo_maximo || hasContent(cupo_maximo) || submitAttempted,
    estado: touched.estado || !!estado || submitAttempted,
    header_image_url: touched.header_image_url || hasContent(header_image_url) || submitAttempted,
    video_url: touched.video_url || hasContent(video_url) || submitAttempted,
  });

  let errors = $derived<Record<string, string>>({ ...frontErrors, ...backendErrors });
  let isValid = $derived(Object.keys(frontErrors).length === 0);

  $effect(() => {
    if (!slugEdited) slug = slugify(nombre);
  });

  $effect(() => {
    if (form?.apiError !== undefined || form?.error !== undefined) {
      const extracted = extractApiError(form?.apiError ?? form?.error ?? null);
      const mappedBackendErrors = mapBackendFields(extracted.fields, projectFieldMap);
      const nextTopError = summarizeFormError(extracted);
      const nextTouched: Record<string, boolean> = { ...untrack(() => touched) };
      for (const k of Object.keys(mappedBackendErrors)) nextTouched[k] = true;

      backendErrors = mappedBackendErrors;
      topError = nextTopError;
      submitAttempted = true;
      touched = nextTouched;
    }
  });

  function handleSlugInput(value: string) {
    slug = slugify(value);
    slugEdited = true;
    markTouched('slug');
  }

  const filteredSubcategories = $derived(
    (data.projectTags ?? []).filter((tag) => {
      const haystack = `${tag.name} ${tag.category}`.toLowerCase();
      return !subcategorySearch || haystack.includes(subcategorySearch.toLowerCase());
    })
  );

  if (meetingDays.length === 0) {
    meetingDays = [{ dayOfWeek: 'Lunes', startTime: '09:00', endTime: '10:00', notes: '' }];
  }

  function meetingDaysToSlots(days: MeetingDay[]) {
    return days.map((d) => ({ day_of_week: d.dayOfWeek, time_from: d.startTime, time_to: d.endTime, notes: d.notes }));
  }

  function slotsToMeetingDays(slots: { day_of_week: string; time_from: string; time_to: string; notes: string }[]) {
    return slots.map((s) => ({ dayOfWeek: s.day_of_week, startTime: s.time_from, endTime: s.time_to, notes: s.notes }));
  }

  let availabilitySlots = $derived(meetingDaysToSlots(meetingDays));

  function toggleCategory(tagId: number, checked: boolean) {
    selectedCategoryIds = checked
      ? [...selectedCategoryIds, tagId]
      : selectedCategoryIds.filter((id) => id !== tagId);
  }

  function toggleSubcategory(tagId: number, checked: boolean) {
    selectedSubcategoryIds = checked
      ? [...selectedSubcategoryIds, tagId]
      : selectedSubcategoryIds.filter((id) => id !== tagId);
  }

  function addNewTag() {
    const name = newTagName.trim();
    if (!name) return;
    newTags = [...newTags, { name, category: newTagCategory || 'General' }];
    newTagName = '';
    newTagCategory = 'General';
  }

  function removeNewTag(index: number) {
    newTags = newTags.filter((_, currentIndex) => currentIndex !== index);
  }

  function addRequiredSkill() {
    const name = newSkillName.trim();
    if (!name) return;
    if (!requiredSkills.some((skill) => skill.name.toLowerCase() === name.toLowerCase())) {
      requiredSkills = [...requiredSkills, { name }];
    }
    newSkillName = '';
  }

  function removeRequiredSkill(index: number) {
    requiredSkills = requiredSkills.filter((_, currentIndex) => currentIndex !== index);
  }


</script>

<svelte:head>
  <title>Editar Proyecto: {data.project?.nombre || 'Proyecto'} — Admin DLAB</title>
</svelte:head>

<div class="p-6 md:p-8 max-w-10xl max-h-10xl">
  <a href="/admin/projects" class="text-sm text-[--text-muted] hover:text-[--text-secondary] flex items-center gap-1.5 mb-6">
    <ArrowLeft size={13} /> Proyectos
  </a>
  <header class="mb-6 flex flex-wrap items-center justify-between gap-4">
    <h1 class="text-2xl font-bold text-[--text-primary]">Editar: {data.project?.nombre}</h1>
    <div>
      {#if !confirmDelete}
        <Button
          type="button"
          variant="primary"
          size="sm"
          icon="Trash2"
          label="Eliminar proyecto"
          onclick={() => (confirmDelete = true)}
        />
      {:else}
        <p class="text-sm text-red-600 mb-2">¿Estás seguro? Esta acción no se puede deshacer.</p>
        <form method="POST" action="?/deleteProject" use:enhance class="inline-flex gap-2">
          <Button type="submit" variant="primary" size="sm" icon="Trash2" label="Confirmar eliminación" />
          <Button type="button" variant="secondary" size="sm" label="Cancelar" onclick={() => (confirmDelete = false)} />
        </form>
      {/if}
    </div>
  </header>

  <FormErrorSummary message={topError} onDismiss={() => (topError = '')} />

  <form
    method="POST"
    action="?/saveProject"
    use:enhance={({ cancel }) => {
      submitAttempted = true;
      if (Object.keys(frontErrors).length > 0) {
        const next: Record<string, boolean> = {};
        for (const k of Object.keys(frontErrors)) next[k] = true;
        touched = { ...touched, ...next };
        topError = 'Revisa los campos marcados antes de continuar.';
        cancel();
        return;
      }
      return async ({ update }) => {
        await update();
      };
    }}
    enctype="multipart/form-data"
    class="bg-surface rounded-xl border border-[--border] p-6 space-y-6 mt-4"
  >
    <div>
          <h2 class="text-lg font-semibold text-[--text-primary]">Información descriptiva del proyecto</h2>
          <p class="text-sm text-[--text-muted] mb-4">Defina la información base del proyecto, como su nombre y su descripción para los usuarios finales.</p>
          <div class="w-full h-0.5" style="background: var(--accent); opacity: 0.3;"></div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        name="nombre"
        label="Nombre del proyecto"
        required
        bind:value={nombre}
        counter={PROJECT_LIMITS.title.max}
        hint={`Máximo ${PROJECT_LIMITS.title.max} caracteres`}
        error={errors.nombre || errors.title}
        touched={show.nombre}
      />
      <div class="space-y-1">
        <label for="slug" class="block text-md font-bold mb-1" style="font-family: var(--font-subheading);">Slug</label>
        <input
          id="slug"
          name="slug"
          type="text"
          bind:value={slug}
          oninput={(event) => handleSlugInput((event.currentTarget as HTMLInputElement).value)}
          maxlength={PROJECT_LIMITS.slug.max}
          class="block w-full rounded-lg border px-3 py-2.5 text-sm text-[--text-primary] placeholder-[--text-muted] focus:outline-none focus:ring-2 focus:ring-[--color-red] focus:border-[--color-red] transition-colors duration-150"
          class:border-red-400={show.slug && !!errors.slug}
          class:border-[--border]={!(show.slug && !!errors.slug)}
          style="background: var(--bg-surface);"
        />
        {#if show.slug && errors.slug}
          <p class="mt-1 text-xs text-red-500">{errors.slug}</p>
        {:else}
          <p class="mt-1 text-xs text-[--text-muted]">Se genera automáticamente desde el nombre, pero puedes editarlo.</p>
        {/if}
      </div>
    </div>
    <RichTextField
      name="descripcion_corta"
      label="Descripción corta"
      value={data.project?.descripcion_corta}
      required
      minHeightClass="min-h-[80px]"
      onchange={(html) => { descripcion_corta = html; markTouched('descripcion_corta'); }}
      counter={PROJECT_LIMITS.short_description.max}
      hint={`Máximo ${PROJECT_LIMITS.short_description.max} caracteres`}
      error={errors.descripcion_corta || errors.short_description}
      touched={show.descripcion_corta}
    />
    <RichTextField
      name="descripcion_larga"
      label="Descripción completa"
      value={data.project?.descripcion_larga}
      required
      onchange={(html) => { descripcion_larga = html; markTouched('descripcion_larga'); }}
      error={errors.descripcion_larga || errors.full_description}
      touched={show.descripcion_larga}
    />
    <RichTextField
      name="target_audience"
      label="Audiencia objetivo"
      value={data.project?.target_audience}
      minHeightClass="min-h-[80px]"
      onchange={(html) => { target_audience = html; markTouched('target_audience'); }}
      counter={PROJECT_LIMITS.target_audience.max}
      hint={`Máximo ${PROJECT_LIMITS.target_audience.max} caracteres`}
      error={errors.target_audience}
      touched={show.target_audience}
    />

    <div>
          <h2 class="text-lg font-semibold text-[--text-primary]">Información organizacional del proyecto</h2>
          <p class="text-sm text-[--text-muted] mb-4">Defina la información organizacional de su proyecto, como su cupo y modalidad, estado y la imagen del proyecto para los usuarios finales.</p>
          <div class="w-full h-0.5" style="background: var(--accent); opacity: 0.3;"></div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <FormField
        name="modalidad"
        type="select"
        label="Modalidad"
        bind:value={modalidad}
        error={errors.modalidad || errors.participation_mode}
        touched={show.modalidad}
      >
        <option value="">Sin definir</option>
        <option value="Presencial">Presencial</option>
        <option value="Remoto">Remoto</option>
        <option value="Híbrido">Híbrido</option>
      </FormField>
      <FormField
        name="cupo_maximo"
        type="number"
        label="Cupo máximo"
        bind:value={cupo_maximo}
        min={PROJECT_LIMITS.max_collaborators.min}
        max={PROJECT_LIMITS.max_collaborators.max}
        hint={`Número entero entre ${PROJECT_LIMITS.max_collaborators.min} y ${PROJECT_LIMITS.max_collaborators.max}`}
        error={errors.cupo_maximo || errors.max_collaborators}
        touched={show.cupo_maximo}
      />
      <FormField
        name="estado"
        type="select"
        label="Estado"
        required
        bind:value={estado}
        error={errors.estado || errors.status}
        touched={show.estado}
      >
        <option value="Próximo">Próximo</option>
        <option value="Activo">Activo</option>
        <option value="En_Pausa">En pausa</option>
        <option value="Completado">Completado</option>
        <option value="Archivado">Archivado</option>
      </FormField>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="space-y-1">
        <label class="block text-md font-bold mb-1" style="font-family: var(--font-subheading);">Imagen principal</label>
        <input type="file" name="header_image_file" accept="image/*" class="block w-full rounded-lg border border-[--border] bg-surface px-3 py-2.5 text-sm" />
        <p class="text-xs text-[--text-muted]">Sube un nuevo archivo o pega una URL pública abajo.</p>
      </div>
      <FormField
        name="header_image_url"
        type="url"
        label="URL de imagen principal"
        bind:value={header_image_url}
        error={errors.header_image_url}
        touched={show.header_image_url}
      />
      <FormField
        name="video_url"
        type="url"
        label="URL de video"
        bind:value={video_url}
        error={errors.video_url}
        touched={show.video_url}
      />
    </div>

    <FormField name="responsable_id" type="select" label="Responsable" value={data.project?.responsable_id}>
      <option value="">Sin asignar</option>
      {#each data.admins as admin}
        <option value={admin.id}>{admin.label}</option>
      {/each}
    </FormField>

    <section class="space-y-4">
      <div>
          <h2 class="text-lg font-semibold text-[--text-primary]">Información clasificatoria del proyecto</h2>
          <p class="text-sm text-[--text-muted] mb-4">Defina la categoría general del proyecto a crear.</p>
          <div class="w-full h-0.5" style="background: var(--accent); opacity: 0.3;"></div>
      </div>
      <div class="flex items-center justify-between gap-3">
        <span class="text-sm text-[--text-muted]">{(data.project.categories?.length ?? 0)} seleccionadas · {Math.abs((data.project.categories?.length ?? 0) - (data.systemTagsMeta?.total ?? 0 ))} {(data.project.categories?.length ?? 0) - (data.systemTagsMeta?.total ?? 0 ) > 1 ? 'disponibles': 'disponible'} ⋅ {data.systemTagsMeta?.total ?? 0} totales</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-auto border border-[--border] rounded-xl p-4 bg-[--bg-secondary]">
        {#each data.systemTags ?? [] as tag}
          <label class="flex items-start gap-3 rounded-lg bg-surface border border-[--border] p-3 cursor-pointer">
            <input
              type="checkbox"
              class="mt-1"
              checked={selectedCategoryIds.includes(tag.id)}
              onchange={(event) => toggleCategory(tag.id, (event.currentTarget as HTMLInputElement).checked)}
            />
            <span class="min-w-0">
              <span class="block font-medium text-[--text-primary]">{tag.name}</span>
              <span class="block text-xs text-[--text-muted]">Categoría del sistema</span>
            </span>
          </label>
        {/each}
      </div>
      <input type="hidden" name="category_tags_json" value={JSON.stringify(selectedCategoryIds)} />
    </section>

    <section class="space-y-4">
      <div>
          <h2 class="text-lg font-semibold text-[--text-primary]">Información clasificatoria del proyecto</h2>
          <p class="text-sm text-[--text-muted] mb-4">Defina las subcategorias del proyecto a crear, estas le permiten al usuario conocer más sobre el trabajo que se realizará dentro del proyecto</p>
          <div class="w-full h-0.5" style="background: var(--accent); opacity: 0.3;"></div>
      </div>
      <div class="flex items-center justify-between gap-3">
        <span class="text-xs text-[--text-muted]">{data.project.subcategories.length} disponibles · {data.projectTagsMeta?.total ?? 0} totales</span>
        <div class="relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted]" size={14} />
          <input
            type="text"
            bind:value={subcategorySearch}
            placeholder="Buscar subcategorías..."
            class="rounded-lg border border-[--border] bg-surface py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-red]"
          />
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-auto border border-[--border] rounded-xl p-4 bg-[--bg-secondary]">
        {#each filteredSubcategories as tag}
          <label class="flex items-start gap-3 rounded-lg bg-surface border border-[--border] p-3 cursor-pointer">
            <input
              type="checkbox"
              class="mt-1"
              checked={selectedSubcategoryIds.includes(tag.id)}
              onchange={(event) => toggleSubcategory(tag.id, (event.currentTarget as HTMLInputElement).checked)}
            />
            <span class="min-w-0">
              <span class="block font-medium text-[--text-primary]">{tag.name}</span>
              <span class="block text-xs text-[--text-muted]">Categoría padre: {tag.category}</span>
            </span>
          </label>
        {/each}
      </div>
      <input type="hidden" name="subcategory_tags_json" value={JSON.stringify(selectedSubcategoryIds)} />
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <FormField
          name="new_tag_name"
          label="Nombre de la subcategoría"
          bind:value={newTagName}
          counter={PROJECT_LIMITS.tag_name.max}
          hint={`Máximo ${PROJECT_LIMITS.tag_name.max} caracteres`}
        />
        <FormField name="new_tag_category" type="select" label="Categoría padre" bind:value={newTagCategory}>
          {#each data.systemTags ?? [] as tag}
            <option value={tag.name}>{tag.name}</option>
          {/each}
        </FormField>
        <Button type="button" variant="secondary" label="Agregar subcategoría" icon="Plus" onclick={addNewTag} classes='text-md '/>
      </div>
      {#if newTags.length > 0}
        <div class="flex flex-wrap gap-2">
          {#each newTags as tag, index}
            <span class="inline-flex items-center gap-2 rounded-full bg-[--bg-secondary] border border-[--border] px-3 py-1 text-sm text-[--text-primary]">
              {tag.name} · {tag.category}
              <button type="button" class="text-[--text-muted] hover:text-[--text-primary]" onclick={() => removeNewTag(index)}>
                <Trash2 size={14} />
              </button>
            </span>
          {/each}
        </div>
      {/if}
      <input type="hidden" name="new_tags_json" value={JSON.stringify(newTags)} />
    </section>

    <section class="space-y-4">
    <div>
          <h2 class="text-lg font-semibold text-[--text-primary]">Información clasificatoria del proyecto</h2>
          <p class="text-sm text-[--text-muted] mb-4">Defina las habilidades esperadas de los participantes del proyecto, esto permite a los usuarios medir su capacidad de aportación al proyecto</p>
          <div class="w-full h-0.5" style="background: var(--accent); opacity: 0.3;"></div>
      </div>
      <div class="flex items-center justify-between gap-3">
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <FormField
          name="required_skill_name"
          label="Nueva habilidad"
          bind:value={newSkillName}
          counter={PROJECT_LIMITS.required_skill_name.max}
          hint={`Máximo ${PROJECT_LIMITS.required_skill_name.max} caracteres`}
        />
        <div class="md:col-span-2">
          <Button type="button" variant="secondary" label="Agregar habilidad" icon="Plus" onclick={addRequiredSkill} />
        </div>
      </div>
      {#if requiredSkills.length > 0}
        <div class="flex flex-wrap gap-2">
          {#each requiredSkills as skill, index}
            <span class="inline-flex items-center gap-2 rounded-full bg-[--bg-secondary] border border-[--border] px-3 py-1 text-sm text-[--text-primary]">
              {skill.name}
              <button type="button" class="text-[--text-muted] hover:text-[--text-primary]" onclick={() => removeRequiredSkill(index)}>
                <Trash2 size={14} />
              </button>
            </span>
          {/each}
        </div>
      {/if}
      <input type="hidden" name="required_skill_items_json" value={JSON.stringify(requiredSkills)} />
      <input type="hidden" name="required_skills_text" value={requiredSkills.map((skill) => skill.name).join(', ')} />
    </section>

    <div>
          <h2 class="text-lg font-semibold text-[--text-primary]">Días de reunión del proyecto</h2>
          <p class="text-sm text-[--text-muted] mb-4">Defina los días de reunión del proyecto y su horario de reunión esperado.</p>
          <div class="w-full h-0.5" style="background: var(--accent); opacity: 0.3;"></div>
      </div>
    <section class="space-y-4">
      <AvailabilityPicker bind:value={availabilitySlots} onchange={(slots) => { meetingDays = slotsToMeetingDays(slots); }} />
      {#if meetingDays.some((d) => d.notes)}
        <div class="space-y-2">
          {#each meetingDays as day}
            {#if day.notes}
              <div class="rounded-xl border border-[--border] bg-[--bg-secondary] px-3 py-2 text-sm">
                <p class="font-medium text-[--text-primary]">{day.dayOfWeek}</p>
                <p class="text-xs text-[--text-muted]">{day.notes}</p>
              </div>
            {/if}
          {/each}
        </div>
      {/if}
      <input type="hidden" name="meeting_days_json" value={JSON.stringify(meetingDays)} />
    </section>

    <div class="flex items-center gap-6 pt-2">
      <label class="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" name="visible" checked={data.project?.visible} class="h-5 w-9 rounded-full bg-[--border] checked:bg-[--color-red] transition-colors" />
        <span class="text-sm text-[--text-muted]">Visible en /projects</span>
      </label>
      <label class="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" name="highlighted" checked={data.project?.is_highlighted} class="h-5 w-9 rounded-full bg-[--border] checked:bg-[--color-red] transition-colors" />
        <span class="text-sm text-[--text-muted]">Destacar en portada</span>
      </label>
    </div>

    <div class="flex gap-3 pt-2">
      <Button type="submit" variant="primary" label="Guardar cambios" disabled={!submitAttempted ? (nombre.length === 0 || descripcion_corta_plain.length === 0 || descripcion_larga_plain.length === 0): (submitAttempted && !isValid)} />
      <Button type="button" variant="primary" href="/admin/projects" label="Cancelar" />
    </div>
  </form>
</div>
