<script lang="ts">
  import { enhance } from '$app/forms';
  import { untrack } from 'svelte';
  import { ArrowLeft } from 'lucide-svelte';
  import FormField from '$lib/components/ui/FormField.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import RichTextField from '$lib/components/ui/RichTextField.svelte';
  import FormErrorSummary from '$lib/components/ui/FormErrorSummary.svelte';
  import { slugify } from '$lib/utils';
  import {
    validateEventForm,
    EVENT_LIMITS,
    EVENT_TYPES,
    EVENT_STATUSES,
  } from '$lib/validation/event';
  import {
    extractApiError,
    mapBackendFields,
    summarizeFormError,
  } from '$lib/validation/apiError';
  import { eventFieldMap } from '$lib/validation/fieldMaps';

  interface Props {
    data: { admins: any[] };
    form?: { error?: string; apiError?: unknown };
  }

  let { data, form }: Props = $props();

  // --- Field state (one $state per backend payload key)
  let nombre = $state('');                  // → title
  let slug = $state('');                    // → slug
  let slugEdited = $state(false);
  let tipo = $state<typeof EVENT_TYPES[number] | ''>('');
  let descripcion_corta = $state('');       // → short_description
  let descripcion_larga = $state('');       // → full_description
  let target_audience = $state('');
  let fecha_inicio = $state('');            // → event_date
  let fecha_fin = $state('');               // → event_end_date
  let registration_deadline = $state('');
  let lugar = $state('');                   // → location
  let cupo_maximo = $state('');             // → capacity
  let link_externo = $state('');            // → registration_url
  let banner_image_url = $state('');
  let poster_image_url = $state('');
  let video_url = $state('');
  let estado = $state<typeof EVENT_STATUSES[number]>('Próximo');

  // --- Touch tracking + backend errors + top-level summary
  let touched = $state<Record<string, boolean>>({});
  let submitAttempted = $state(false);
  let backendErrors = $state<Record<string, string>>({});
  let topError = $state('');

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

  let capacity_num = $derived<number | null>(
    cupo_maximo === '' ? null : Number(cupo_maximo)
  );
  let descripcion_corta_plain = $derived(stripHtml(descripcion_corta));
  let descripcion_larga_plain = $derived(stripHtml(descripcion_larga));
  let target_audience_plain = $derived(stripHtml(target_audience));

  let frontErrors = $derived(
    validateEventForm({
      title: nombre,
      slug: slug || undefined,
      type: (tipo || 'Otro') as typeof EVENT_TYPES[number],
      short_description: descripcion_corta_plain,
      full_description: descripcion_larga_plain,
      target_audience: target_audience_plain || undefined,
      location: lugar || undefined,
      event_date: fecha_inicio,
      event_end_date: fecha_fin || undefined,
      registration_deadline: registration_deadline || undefined,
      capacity: capacity_num,
      banner_image_url: banner_image_url || undefined,
      poster_image_url: poster_image_url || undefined,
      video_url: video_url || undefined,
      registration_url: link_externo || undefined,
      status: estado,
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
    tipo: touched.tipo || !!tipo || submitAttempted,
    descripcion_corta: touched.descripcion_corta || hasContent(descripcion_corta) || submitAttempted,
    descripcion_larga: touched.descripcion_larga || hasContent(descripcion_larga) || submitAttempted,
    target_audience: touched.target_audience || hasContent(target_audience) || submitAttempted,
    fecha_inicio: touched.fecha_inicio || hasContent(fecha_inicio) || submitAttempted,
    fecha_fin: touched.fecha_fin || hasContent(fecha_fin) || submitAttempted,
    registration_deadline: touched.registration_deadline || hasContent(registration_deadline) || submitAttempted,
    lugar: touched.lugar || hasContent(lugar) || submitAttempted,
    cupo_maximo: touched.cupo_maximo || hasContent(cupo_maximo) || submitAttempted,
    link_externo: touched.link_externo || hasContent(link_externo) || submitAttempted,
    banner_image_url: touched.banner_image_url || hasContent(banner_image_url) || submitAttempted,
    poster_image_url: touched.poster_image_url || hasContent(poster_image_url) || submitAttempted,
    video_url: touched.video_url || hasContent(video_url) || submitAttempted,
    estado: touched.estado || !!estado || submitAttempted,
  });

  let errors = $derived<Record<string, string>>({ ...frontErrors, ...backendErrors });
  let isValid = $derived(Object.keys(frontErrors).length === 0);

  $effect(() => {
    if (!slugEdited) slug = slugify(nombre);
  });

  $effect(() => {
    if (form?.apiError !== undefined || form?.error !== undefined) {
      const extracted = extractApiError(form?.apiError ?? form?.error ?? null);
      const mappedBackendErrors = mapBackendFields(extracted.fields, eventFieldMap);
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
</script>

<svelte:head>
  <title>Nuevo evento — Admin DLAB</title>
</svelte:head>

<div class="p-6 md:p-8 max-w-10xl max-h-10xl">
  <a href="/admin/events" class="text-sm text-[--text-muted] hover:text-[--text-secondary] flex items-center gap-1.5 mb-6">
    <ArrowLeft size={13} /> Eventos
  </a>
  <h1 class="text-2xl font-bold text-[--text-primary] mb-6">Nuevo evento</h1>

  <FormErrorSummary message={topError} onDismiss={() => (topError = '')}/>
  <div class="mb-2"></div>
  <form
    method="POST"
    action="?/saveEvent"
    enctype="multipart/form-data"
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
      return async ({ update }) => { await update(); };
    }}
    class="bg-surface rounded-xl border border-[--border] p-6 space-y-6 mt-4"
  >
    <div>
      <h2 class="text-lg font-semibold text-[--text-primary]">Información descriptiva del evento</h2>
      <p class="text-sm text-[--text-muted] mb-4">Defina la información base del evento, como su nombre, tipo y descripción para los usuarios finales.</p>
      <div class="w-full h-0.5" style="background: var(--accent); opacity: 0.3;"></div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        name="nombre"
        label="Nombre del evento"
        required
        bind:value={nombre}
        counter={EVENT_LIMITS.title.max}
        hint={`Máximo ${EVENT_LIMITS.title.max} caracteres`}
        error={errors.nombre || errors.title}
        touched={show.nombre}
      />
      <div class="space-y-1">
        <label for="slug" class="block text-md font-bold mb-1" style="font-family: var(--font-subheading);">Slug del evento</label>
        <input
          id="slug"
          name="slug"
          type="text"
          bind:value={slug}
          oninput={(event) => handleSlugInput((event.currentTarget as HTMLInputElement).value)}
          maxlength={EVENT_LIMITS.slug.max}
          class="block w-full rounded-lg border px-3 py-2.5 text-sm text-[--text-primary] placeholder-[--text-muted] focus:outline-none focus:ring-2 focus:ring-[--color-red] focus:border-[--color-red] transition-colors duration-150"
          class:border-red-400={show.slug && !!errors.slug}
          class:border-[--border]={!(show.slug && !!errors.slug)}
          style="background: var(--bg-surface);"
        />
        {#if show.slug && errors.slug}
          <p class="mt-1 text-xs text-red-500">{errors.slug}</p>
        {:else}
          <p class="mt-1 text-xs text-[--text-muted]">Opcional. Se genera automáticamente desde el nombre, pero puedes editarlo.</p>
        {/if}
      </div>
    </div>
    <FormField
      name="tipo"
      type="select"
      label="Tipo (Este campo no es obligatorio, si se deja sin seleccionar, se considera un evento de tipo 'Otro')"
      bind:value={tipo}
      error={errors.tipo || errors.type}
      touched={show.tipo}
    >
      <option value="">Seleccionar...</option>
      <option value="Taller">Taller</option>
      <option value="Convocatoria">Convocatoria</option>
      <option value="Charla">Charla</option>
      <option value="Hackatón">Hackatón</option>
      <option value="Día_De_Demostración">Día de demostración</option>
      <option value="Visita">Visita</option>
      <option value="Otro">Otro</option>
    </FormField>
    <RichTextField
      name="descripcion_corta"
      label="Descripción corta"
      required
      minHeightClass="min-h-[80px]"
      onchange={(html) => { descripcion_corta = html; markTouched('descripcion_corta'); }}
      counter={EVENT_LIMITS.short_description.max}
      hint={`Máximo ${EVENT_LIMITS.short_description.max} caracteres`}
      error={errors.descripcion_corta || errors.short_description}
      touched={show.descripcion_corta}
    />
    <RichTextField
      name="descripcion_larga"
      label="Descripción completa"
      required
      onchange={(html) => { descripcion_larga = html; markTouched('descripcion_larga'); }}
      error={errors.descripcion_larga || errors.full_description}
      touched={show.descripcion_larga}
    />
    <RichTextField
      name="target_audience"
      label="Audiencia objetivo"
      minHeightClass="min-h-[80px]"
      onchange={(html) => { target_audience = html; markTouched('target_audience'); }}
      counter={EVENT_LIMITS.target_audience.max}
      hint={`Máximo ${EVENT_LIMITS.target_audience.max} caracteres`}
      error={errors.target_audience}
      touched={show.target_audience}
    />

    <div>
      <h2 class="text-lg font-semibold text-[--text-primary]">Información organizacional del evento</h2>
      <p class="text-sm text-[--text-muted] mb-4">Defina la información organizacional del evento, como fechas, lugar, cupo y estado.</p>
      <div class="w-full h-0.5" style="background: var(--accent); opacity: 0.3;"></div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        name="fecha_inicio"
        type="datetime-local"
        label="Fecha inicio"
        min="1900-01-01T00:00"
        max="2500-12-31T23:59"
        required
        bind:value={fecha_inicio}
        error={errors.fecha_inicio || errors.event_date}
        touched={show.fecha_inicio}
      />
      <FormField
        name="fecha_fin"
        type="datetime-local"
        label="Fecha fin"
        min="1900-01-01T00:00"
        max="2500-12-31T23:59"
        required
        bind:value={fecha_fin}
        error={errors.fecha_fin || errors.event_end_date}
        touched={show.fecha_fin}
      />
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        name="lugar"
        required
        label="Lugar"
        bind:value={lugar}
        counter={EVENT_LIMITS.location.max}
        hint={`Máximo ${EVENT_LIMITS.location.max} caracteres`}
        error={errors.lugar || errors.location}
        touched={show.lugar}
      />
      <FormField
        name="registration_deadline"
        type="datetime-local"
        label="Cierre de registro"
        min="1900-01-01T00:00"
        max="2500-12-31T23:59"
        required
        bind:value={registration_deadline}
        error={errors.registration_deadline}
        touched={show.registration_deadline}
      />
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        name="cupo_maximo"
        type="number"
        label="Cupo máximo"
        required
        bind:value={cupo_maximo}
        min={EVENT_LIMITS.capacity.min}
        max={EVENT_LIMITS.capacity.max}
        hint={`Número entero entre ${EVENT_LIMITS.capacity.min} y ${EVENT_LIMITS.capacity.max}`}
        error={errors.cupo_maximo || errors.capacity}
        touched={show.cupo_maximo}
      />
      <FormField
        name="link_externo"
        type="url"
        label="Enlace externo (opcional)"
        bind:value={link_externo}
        counter={EVENT_LIMITS.registration_url.max}
        hint={`Máximo ${EVENT_LIMITS.registration_url.max} caracteres`}
        error={errors.link_externo || errors.registration_url}
        touched={show.link_externo}
      />
    </div>
    <FormField name="responsable_id" type="select" label="Responsable">
      <option value="">Sin asignar</option>
      {#each data.admins as a}
        <option value={a.id}>{a.label}</option>
      {/each}
    </FormField>

    <div>
      <h2 class="text-lg font-semibold text-[--text-primary]">Multimedia del evento</h2>
      <p class="text-sm text-[--text-muted] mb-4">Suba o enlace los archivos visuales del evento: banner, afiche y video.</p>
      <div class="w-full h-0.5" style="background: var(--accent); opacity: 0.3;"></div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="space-y-1">
        <label for="banner_image_file" class="block text-md font-bold mb-1" style="font-family: var(--font-subheading);">Banner del evento</label>
        <input id="banner_image_file" type="file" name="banner_image_file" accept="image/*" class="block w-full rounded-lg border border-[--border] bg-surface px-3 py-2.5 text-sm" />
        <p class="text-xs text-[--text-muted]">Sube el archivo aquí o pega una URL pública abajo.</p>
      </div>
      <div class="space-y-1">
        <label for="poster_image_file" class="block text-md font-bold mb-1" style="font-family: var(--font-subheading);">Afiche o flyer</label>
        <input id="poster_image_file" type="file" name="poster_image_file" accept="image/*" class="block w-full rounded-lg border border-[--border] bg-surface px-3 py-2.5 text-sm" />
        <p class="text-xs text-[--text-muted]">Sube el archivo aquí o pega una URL pública abajo.</p>
      </div>
      <FormField
        name="video_url"
        type="url"
        label="URL del video"
        bind:value={video_url}
        hint="Acepta enlaces de YouTube o Vimeo."
        error={errors.video_url}
        touched={show.video_url}
      />
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        name="banner_image_url"
        type="url"
        label="URL pública del banner"
        bind:value={banner_image_url}
        hint="Se usa si no subes un archivo."
        error={errors.banner_image_url}
        touched={show.banner_image_url}
      />
      <FormField
        name="poster_image_url"
        type="url"
        label="URL pública del afiche"
        bind:value={poster_image_url}
        hint="Se muestra debajo de la tarjeta lateral del evento."
        error={errors.poster_image_url}
        touched={show.poster_image_url}
      />
    </div>

    <div>
      <h2 class="text-lg font-semibold text-[--text-primary]">Estado y visibilidad del evento</h2>
      <p class="text-sm text-[--text-muted] mb-4">Defina el estado actual del evento y si desea que sea visible en el sitio público.</p>
      <div class="w-full h-0.5" style="background: var(--accent); opacity: 0.3;"></div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
      <FormField
        name="estado"
        type="select"
        label="Estado"
        bind:value={estado}
        error={errors.estado || errors.status}
        touched={show.estado}
      >
        <option value="Próximo">Próximo</option>
        <option value="Abierto">Abierto</option>
        <option value="En_Curso">En curso</option>
        <option value="Finalizado">Finalizado</option>
        <option value="Cancelado">Cancelado</option>
      </FormField>
      <div>
        <p class="text-sm font-medium text-[--text-secondary] block mb-1">Visible en el sitio</p>
        <label class="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" name="visible" class="h-5 w-9 rounded-full bg-[--border] checked:bg-[--color-red] transition-colors" />
          <span class="text-sm text-[--text-muted]">Visible en /events</span>
        </label>
      </div>
    </div>
    <div class="flex gap-3 pt-2">
      <Button type="submit" variant="primary" label="Crear evento" disabled={!submitAttempted ? (nombre.length === 0 || descripcion_corta_plain.length === 0 || descripcion_larga_plain.length === 0 || fecha_fin.length === 0 || fecha_inicio.length === 0 || lugar.length === 0 || registration_deadline.length === 0 || cupo_maximo.length === 0) : (submitAttempted && !isValid)} />
      <Button type="button" variant="secondary" href="/admin/events" label="Cancelar" />
    </div>
  </form>
</div>
