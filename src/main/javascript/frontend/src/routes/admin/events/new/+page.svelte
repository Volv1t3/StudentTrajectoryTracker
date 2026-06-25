<script lang="ts">
  import { enhance } from '$app/forms';
  import { ArrowLeft } from 'lucide-svelte';
  import FormField from '$lib/components/ui/FormField.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { slugify } from '$lib/utils';

  interface Props {
    data: { admins: any[] };
    form?: { error?: string };
  }

  let { data, form }: Props = $props();
  let nombre = $state('');
  let slug = $state('');
  let slugEdited = $state(false);

  $effect(() => {
    if (!slugEdited) {
      slug = slugify(nombre);
    }
  });

  function handleSlugInput(value: string) {
    slug = slugify(value);
    slugEdited = true;
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

  {#if form?.error}
    <div class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {form.error}
    </div>
  {/if}

  <form method="POST" action="?/saveEvent" enctype="multipart/form-data" use:enhance class="bg-surface rounded-xl border border-[--border] p-6 space-y-6">
    <div>
          <h2 class="text-lg font-semibold text-[--text-primary]">Información descriptiva del evento</h2>
          <p class="text-sm text-[--text-muted] mb-4">Defina la información base del evento, como su nombre, tipo y descripción para los usuarios finales.</p>
          <div class="w-full h-0.5" style="background: var(--accent); opacity: 0.3;"></div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField name="nombre" label="Nombre del evento" required bind:value={nombre} />
      <div class="space-y-1">
        <label for="slug" class="block text-md font-bold mb-1" style="font-family: var(--font-subheading);">Slug del evento</label>
        <input
          id="slug"
          name="slug"
          type="text"
          bind:value={slug}
          oninput={(event) => handleSlugInput((event.currentTarget as HTMLInputElement).value)}
          class="block w-full rounded-lg border border-[--border] px-3 py-2.5 text-sm text-[--text-primary] placeholder-[--text-muted] focus:outline-none focus:ring-2 focus:ring-[--color-red] focus:border-[--color-red] transition-colors duration-150"
          style="background: var(--bg-surface);"
        />
        <p class="mt-1 text-xs text-[--text-muted]">Opcional. Se genera automáticamente desde el nombre, pero puedes editarlo.</p>
      </div>
    </div>
    <FormField name="tipo" type="select" label="Tipo" required>
      <option value="">Seleccionar...</option>
      <option value="Taller">Taller</option>
      <option value="Convocatoria">Convocatoria</option>
      <option value="Charla">Charla</option>
      <option value="Hackatón">Hackatón</option>
      <option value="Día_De_Demostración">Día de demostración</option>
      <option value="Visita">Visita</option>
      <option value="Otro">Otro</option>
    </FormField>
    <FormField name="descripcion_corta" type="textarea" rows={2} label="Descripción corta" required />
    <FormField name="descripcion_larga" type="textarea" rows={6} label="Descripción completa" required />
    <FormField name="target_audience" type="textarea" rows={2} label="Audiencia objetivo" />

    <div>
          <h2 class="text-lg font-semibold text-[--text-primary]">Información organizacional del evento</h2>
          <p class="text-sm text-[--text-muted] mb-4">Defina la información organizacional del evento, como fechas, lugar, cupo y estado.</p>
          <div class="w-full h-0.5" style="background: var(--accent); opacity: 0.3;"></div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField name="fecha_inicio" type="datetime-local" label="Fecha inicio" required />
      <FormField name="fecha_fin" type="datetime-local" label="Fecha fin" required />
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField name="lugar" label="Lugar" />
      <FormField name="registration_deadline" type="datetime-local" label="Cierre de registro" />
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField name="cupo_maximo" type="number" label="Cupo máximo" />
      <FormField name="link_externo" type="url" label="Enlace externo (opcional)" />
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
      <FormField name="video_url" type="url" label="URL del video" hint="Acepta enlaces de YouTube o Vimeo." />
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField name="banner_image_url" type="url" label="URL pública del banner" hint="Se usa si no subes un archivo." />
      <FormField name="poster_image_url" type="url" label="URL pública del afiche" hint="Se muestra debajo de la tarjeta lateral del evento." />
    </div>

    <div>
          <h2 class="text-lg font-semibold text-[--text-primary]">Estado y visibilidad del evento</h2>
          <p class="text-sm text-[--text-muted] mb-4">Defina el estado actual del evento y si desea que sea visible en el sitio público.</p>
          <div class="w-full h-0.5" style="background: var(--accent); opacity: 0.3;"></div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
      <FormField name="estado" type="select" label="Estado" value="Próximo">
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
      <Button type="submit" variant="primary" label="Crear evento" />
      <Button type="button" variant="secondary" href="/admin/events" label="Cancelar" />
    </div>
  </form>
</div>
