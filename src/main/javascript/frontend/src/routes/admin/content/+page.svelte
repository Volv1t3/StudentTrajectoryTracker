<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { ArrowUp, ArrowDown, CheckCircle2, AlertCircle } from 'lucide-svelte';
  import FormField from '$lib/components/ui/FormField.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import type {
    HomeHero,
    DlabIdentity,
    ValueProposition,
    ParticipationStep,
    SocialLink,
    ContactInfo,
  } from '$lib/types';

  type ActionResult = {
    success: boolean;
    scope: string;
    error: string | null;
  };

  interface Props {
    data: {
      homeHero: HomeHero;
      dlabIdentity: DlabIdentity;
      valuePropositions: ValueProposition[];
      participationSteps: ParticipationStep[];
      contacts: ContactInfo[];
      socialLinks: SocialLink[];
    };
    form?: ActionResult;
  }

  let { data, form }: Props = $props();

  // Local mutable copies of repeatable lists to support reordering UX. Re-synced
  // from server data after every action roundtrip via $effect below.
  let vpOrder = $state<ValueProposition[]>([...data.valuePropositions]);
  let stepOrder = $state<ParticipationStep[]>([...data.participationSteps]);

  $effect(() => {
    vpOrder = [...data.valuePropositions];
  });
  $effect(() => {
    stepOrder = [...data.participationSteps];
  });

  function moveVP(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= vpOrder.length) return;
    const next = [...vpOrder];
    [next[index], next[target]] = [next[target], next[index]];
    vpOrder = next;
  }

  function moveStep(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= stepOrder.length) return;
    const next = [...stepOrder];
    [next[index], next[target]] = [next[target], next[index]];
    stepOrder = next;
  }

  function bannerFor(prefix: string): { tone: 'success' | 'error'; message: string } | null {
    if (!form?.scope) return null;
    if (!form.scope.startsWith(prefix)) return null;
    return form.success
      ? { tone: 'success', message: 'Cambios guardados correctamente.' }
      : { tone: 'error', message: form.error ?? 'Ocurrió un error al guardar.' };
  }

  let heroBanner = $derived(bannerFor('home_hero'));
  let identityBanner = $derived(bannerFor('dlab_identity'));
  let vpBanner = $derived(bannerFor('value_propositions'));
  let stepBanner = $derived(bannerFor('participation_steps'));
  let contactBanner = $derived(bannerFor('contact_info'));
  let socialBanner = $derived(bannerFor('social_links'));

  // Empty-string helper so FormField bindings don't receive null.
  const s = (v: string | null | undefined) => v ?? '';

  const refreshAfterSubmit = () => {
    return async ({ result, update }: { result: { type: string }; update: (options?: { reset?: boolean; invalidateAll?: boolean }) => Promise<void> }) => {
      await update({ reset: false, invalidateAll: false });
      if (result.type === 'success') {
        await invalidateAll();
      }
    };
  };
</script>

<svelte:head>
  <title>Contenido CMS — Admin DLAB</title>
</svelte:head>

<div class="p-6 md:p-8 max-w-10xl space-y-10">
  <header>
    <h1 class="text-2xl font-bold text-[--text-primary]">Contenido CMS</h1>
    <p class="text-sm text-[--text-muted] mt-1">
      Edita las secciones del sitio público. Cada sección se guarda de forma
      independiente.
    </p>
  </header>

  <!-- =====================================================================
       1. HOME HERO  (singleton)
  ===================================================================== -->
  <section class="bg-surface rounded-xl border border-[--border] p-6 space-y-6">
    <div>
      <h2 class="text-lg font-semibold text-[--text-primary]">Hero principal</h2>
      <p class="text-sm text-[--text-muted] mb-4">
        Encabezado principal de la página de inicio: titular, llamados a la acción
        e imagen de fondo.
      </p>
      <div class="w-full h-0.5" style="background: var(--accent); opacity: 0.3;"></div>
    </div>

    {#if heroBanner}
      <div
        class="rounded-lg border px-4 py-3 text-sm flex items-center gap-2"
        class:border-green-200={heroBanner.tone === 'success'}
        class:bg-green-50={heroBanner.tone === 'success'}
        class:text-green-700={heroBanner.tone === 'success'}
        class:border-red-200={heroBanner.tone === 'error'}
        class:bg-red-50={heroBanner.tone === 'error'}
        class:text-red-700={heroBanner.tone === 'error'}
      >
        {#if heroBanner.tone === 'success'}<CheckCircle2 size={16} />{:else}<AlertCircle size={16} />{/if}
        {heroBanner.message}
      </div>
    {/if}

    <form method="POST" action="?/saveHomeHero" use:enhance={refreshAfterSubmit} class="space-y-4">
      <FormField name="headline" label="Titular" required value={s(data.homeHero.headline)} />
      <FormField
        name="subheadline"
        type="textarea"
        rows={2}
        label="Subtítulo"
        value={s(data.homeHero.subheadline)}
      />

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          name="primary_cta_label"
          label="Texto del botón primario"
          required
          value={s(data.homeHero.primary_cta_label)}
        />
        <FormField
          name="secondary_cta_label"
          label="Texto del botón secundario"
          value={s(data.homeHero.secondary_cta_label)}
        />
      </div>

      <p class="text-xs text-[--text-muted]">
        Los destinos de los botones y la imagen de fondo se gestionan desde la configuración del sitio. Esta sección solo permite editar los textos.
      </p>

      <div class="pt-2">
        <Button type="submit" variant="primary" label="Guardar hero" />
      </div>
    </form>
  </section>

  <!-- =====================================================================
       2. DLAB IDENTITY  (singleton)
  ===================================================================== -->
  <section class="bg-surface rounded-xl border border-[--border] p-6 space-y-6">
    <div>
      <h2 class="text-lg font-semibold text-[--text-primary]">Identidad DLAB</h2>
      <p class="text-sm text-[--text-muted] mb-4">
        Bloque institucional usado en las páginas “Sobre nosotros” y derivadas.
      </p>
      <div class="w-full h-0.5" style="background: var(--accent); opacity: 0.3;"></div>
    </div>

    {#if identityBanner}
      <div
        class="rounded-lg border px-4 py-3 text-sm flex items-center gap-2"
        class:border-green-200={identityBanner.tone === 'success'}
        class:bg-green-50={identityBanner.tone === 'success'}
        class:text-green-700={identityBanner.tone === 'success'}
        class:border-red-200={identityBanner.tone === 'error'}
        class:bg-red-50={identityBanner.tone === 'error'}
        class:text-red-700={identityBanner.tone === 'error'}
      >
        {#if identityBanner.tone === 'success'}<CheckCircle2 size={16} />{:else}<AlertCircle size={16} />{/if}
        {identityBanner.message}
      </div>
    {/if}

    <form method="POST" action="?/saveDlabIdentity" use:enhance={refreshAfterSubmit} class="space-y-4">
      <FormField name="title" label="Título" required value={s(data.dlabIdentity.title)} />
      <FormField
        name="body"
        type="textarea"
        rows={6}
        label="Cuerpo"
        required
        value={s(data.dlabIdentity.body)}
      />

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div class="space-y-4">
          <h3 class="text-base font-semibold text-[--text-primary]">Misión</h3>
          <FormField
            name="mission_title"
            label="Título de misión"
            value={s(data.dlabIdentity.mission_title)}
          />
          <FormField
            name="mission_body"
            type="textarea"
            rows={5}
            label="Contenido de misión"
            value={s(data.dlabIdentity.mission_body)}
          />
        </div>

        <div class="space-y-4">
          <h3 class="text-base font-semibold text-[--text-primary]">Visión</h3>
          <FormField
            name="vision_title"
            label="Título de visión"
            value={s(data.dlabIdentity.vision_title)}
          />
          <FormField
            name="vision_body"
            type="textarea"
            rows={5}
            label="Contenido de visión"
            value={s(data.dlabIdentity.vision_body)}
          />
        </div>
      </div>

      <p class="text-xs text-[--text-muted]">
        Los recursos multimedia (imagen y video) se gestionan desde la configuración del sitio.
      </p>

      <div class="pt-2">
        <Button type="submit" variant="primary" label="Guardar identidad" />
      </div>
    </form>
  </section>

  <!-- =====================================================================
       4. VALUE PROPOSITIONS  (repeatable + reorder + visibility)
  ===================================================================== -->
  <section class="bg-surface rounded-xl border border-[--border] p-6 space-y-6">
    <div>
      <h2 class="text-lg font-semibold text-[--text-primary]">Propuestas de valor</h2>
      <p class="text-sm text-[--text-muted] mb-4">
        Beneficios mostrados en la página principal. Edita, reordena u oculta cada
        tarjeta de forma independiente.
      </p>
      <div class="w-full h-0.5" style="background: var(--accent); opacity: 0.3;"></div>
    </div>

    {#if vpBanner}
      <div
        class="rounded-lg border px-4 py-3 text-sm flex items-center gap-2"
        class:border-green-200={vpBanner.tone === 'success'}
        class:bg-green-50={vpBanner.tone === 'success'}
        class:text-green-700={vpBanner.tone === 'success'}
        class:border-red-200={vpBanner.tone === 'error'}
        class:bg-red-50={vpBanner.tone === 'error'}
        class:text-red-700={vpBanner.tone === 'error'}
      >
        {#if vpBanner.tone === 'success'}<CheckCircle2 size={16} />{:else}<AlertCircle size={16} />{/if}
        {vpBanner.message}
      </div>
    {/if}

    {#if vpOrder.length === 0}
      <div class="rounded-lg border border-dashed border-[--border] bg-[--bg-secondary] p-6 text-sm text-[--text-muted]">
        Aún no hay propuestas de valor. Crea la primera abajo.
      </div>
    {:else}
      <div class="space-y-4">
        {#each vpOrder as vp, index (vp.id)}
          <article class="rounded-lg border border-[--border] bg-[--bg-secondary] p-4 space-y-4">
            <div class="flex items-center justify-between gap-3">
              <div class="text-sm text-[--text-muted]">
                #{index + 1} · ID {vp.id}
              </div>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="p-1.5 rounded-md hover:bg-[--border] disabled:opacity-40"
                  aria-label="Subir"
                  disabled={index === 0}
                  onclick={() => moveVP(index, -1)}
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  type="button"
                  class="p-1.5 rounded-md hover:bg-[--border] disabled:opacity-40"
                  aria-label="Bajar"
                  disabled={index === vpOrder.length - 1}
                  onclick={() => moveVP(index, 1)}
                >
                  <ArrowDown size={16} />
                </button>
              </div>
            </div>

            <form method="POST" action="?/updateValueProposition" use:enhance={refreshAfterSubmit} class="space-y-3">
              <input type="hidden" name="id" value={vp.id} />

              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField name="title" label="Título" required value={s(vp.title)} />
                <FormField
                  name="target_audience"
                  label="Audiencia objetivo"
                  value={s(vp.target_audience)}
                />
              </div>

              <FormField
                name="description"
                type="textarea"
                rows={3}
                label="Descripción"
                required
                value={s(vp.description)}
              />

              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  name="icon_identifier"
                  label="Identificador de ícono"
                  value={s(vp.icon_identifier)}
                />
                <FormField
                  name="sort_order"
                  type="number"
                  label="Orden"
                  value={vp.sort_order}
                />
              </div>

              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_visible"
                  class="h-5 w-9 rounded-full bg-[--border] checked:bg-[--color-red] transition-colors"
                  checked={vp.is_visible}
                />
                <span class="text-sm text-[--text-muted]">Visible en el sitio público</span>
              </label>

              <div class="flex flex-wrap gap-2 pt-1">
                <Button type="submit" variant="primary" label="Guardar" />
              </div>
            </form>

            <form method="POST" action="?/deleteValueProposition" use:enhance={refreshAfterSubmit}>
              <input type="hidden" name="id" value={vp.id} />
              <Button type="submit" variant="danger" icon="Trash2" label="Eliminar" />
            </form>
          </article>
        {/each}
      </div>

      <form method="POST" action="?/reorderValuePropositions" use:enhance={refreshAfterSubmit} class="pt-2">
        <input
          type="hidden"
          name="ordered_ids_json"
          value={JSON.stringify(vpOrder.map((v) => v.id))}
        />
        <Button type="submit" variant="secondary" label="Guardar orden actual" />
      </form>
    {/if}

    <div class="pt-4 border-t border-[--border]">
      <h3 class="text-sm font-semibold text-[--text-primary] mb-3">Agregar propuesta de valor</h3>
      <form method="POST" action="?/createValueProposition" use:enhance={refreshAfterSubmit} class="space-y-3">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField name="title" label="Título" required />
          <FormField name="target_audience" label="Audiencia objetivo" />
        </div>
        <FormField name="description" type="textarea" rows={3} label="Descripción" required />
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField name="icon_identifier" label="Identificador de ícono" />
          <FormField name="sort_order" type="number" label="Orden" value={vpOrder.length} />
        </div>
        <label class="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="is_visible"
            class="h-5 w-9 rounded-full bg-[--border] checked:bg-[--color-red] transition-colors"
            checked
          />
          <span class="text-sm text-[--text-muted]">Visible al crearse</span>
        </label>
        <div class="pt-1">
          <Button type="submit" variant="primary" icon="Plus" label="Crear propuesta" />
        </div>
      </form>
    </div>
  </section>

  <!-- =====================================================================
       5. PARTICIPATION STEPS  (repeatable + reorder + visibility)
  ===================================================================== -->
  <section class="bg-surface rounded-xl border border-[--border] p-6 space-y-6">
    <div>
      <h2 class="text-lg font-semibold text-[--text-primary]">Pasos de participación</h2>
      <p class="text-sm text-[--text-muted] mb-4">
        Pasos que un colaborador debe seguir para vincularse. Numera, reordena y
        oculta cada paso de forma independiente.
      </p>
      <div class="w-full h-0.5" style="background: var(--accent); opacity: 0.3;"></div>
    </div>

    {#if stepBanner}
      <div
        class="rounded-lg border px-4 py-3 text-sm flex items-center gap-2"
        class:border-green-200={stepBanner.tone === 'success'}
        class:bg-green-50={stepBanner.tone === 'success'}
        class:text-green-700={stepBanner.tone === 'success'}
        class:border-red-200={stepBanner.tone === 'error'}
        class:bg-red-50={stepBanner.tone === 'error'}
        class:text-red-700={stepBanner.tone === 'error'}
      >
        {#if stepBanner.tone === 'success'}<CheckCircle2 size={16} />{:else}<AlertCircle size={16} />{/if}
        {stepBanner.message}
      </div>
    {/if}

    {#if stepOrder.length === 0}
      <div class="rounded-lg border border-dashed border-[--border] bg-[--bg-secondary] p-6 text-sm text-[--text-muted]">
        Aún no hay pasos de participación. Crea el primero abajo.
      </div>
    {:else}
      <div class="space-y-4">
        {#each stepOrder as step, index (step.id)}
          <article class="rounded-lg border border-[--border] bg-[--bg-secondary] p-4 space-y-4">
            <div class="flex items-center justify-between gap-3">
              <div class="text-sm text-[--text-muted]">
                Paso {step.step_number} · ID {step.id}
              </div>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="p-1.5 rounded-md hover:bg-[--border] disabled:opacity-40"
                  aria-label="Subir"
                  disabled={index === 0}
                  onclick={() => moveStep(index, -1)}
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  type="button"
                  class="p-1.5 rounded-md hover:bg-[--border] disabled:opacity-40"
                  aria-label="Bajar"
                  disabled={index === stepOrder.length - 1}
                  onclick={() => moveStep(index, 1)}
                >
                  <ArrowDown size={16} />
                </button>
              </div>
            </div>

            <form method="POST" action="?/updateParticipationStep" use:enhance={refreshAfterSubmit} class="space-y-3">
              <input type="hidden" name="id" value={step.id} />

              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  name="step_number"
                  type="number"
                  label="Número de paso"
                  value={step.step_number}
                />
                <FormField
                  name="icon_identifier"
                  label="Identificador de ícono"
                  value={s(step.icon_identifier)}
                />
              </div>

              <FormField name="title" label="Título" required value={s(step.title)} />
              <FormField
                name="description"
                type="textarea"
                rows={3}
                label="Descripción"
                required
                value={s(step.description)}
              />

              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_visible"
                  class="h-5 w-9 rounded-full bg-[--border] checked:bg-[--color-red] transition-colors"
                  checked={step.is_visible}
                />
                <span class="text-sm text-[--text-muted]">Visible en el sitio público</span>
              </label>

              <div class="pt-1">
                <Button type="submit" variant="primary" label="Guardar" />
              </div>
            </form>

            <form method="POST" action="?/deleteParticipationStep" use:enhance={refreshAfterSubmit}>
              <input type="hidden" name="id" value={step.id} />
              <Button type="submit" variant="danger" icon="Trash2" label="Eliminar" />
            </form>
          </article>
        {/each}
      </div>

      <form method="POST" action="?/reorderParticipationSteps" use:enhance={refreshAfterSubmit} class="pt-2">
        <input
          type="hidden"
          name="ordered_ids_json"
          value={JSON.stringify(stepOrder.map((step) => step.id))}
        />
        <Button type="submit" variant="secondary" label="Guardar orden actual" />
      </form>
    {/if}

    <div class="pt-4 border-t border-[--border]">
      <h3 class="text-sm font-semibold text-[--text-primary] mb-3">Agregar paso</h3>
      <form method="POST" action="?/createParticipationStep" use:enhance={refreshAfterSubmit} class="space-y-3">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField
            name="step_number"
            type="number"
            label="Número de paso"
            value={stepOrder.length + 1}
          />
          <FormField name="icon_identifier" label="Identificador de ícono" />
        </div>
        <FormField name="title" label="Título" required />
        <FormField name="description" type="textarea" rows={3} label="Descripción" required />
        <label class="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="is_visible"
            class="h-5 w-9 rounded-full bg-[--border] checked:bg-[--color-red] transition-colors"
            checked
          />
          <span class="text-sm text-[--text-muted]">Visible al crearse</span>
        </label>
        <div class="pt-1">
          <Button type="submit" variant="primary" icon="Plus" label="Crear paso" />
        </div>
      </form>
    </div>
  </section>

  <!-- =====================================================================
       6. CONTACT INFO  (repeatable + active toggle)
  ===================================================================== -->
  <section class="bg-surface rounded-xl border border-[--border] p-6 space-y-6">
    <div>
      <h2 class="text-lg font-semibold text-[--text-primary]">Información de contacto</h2>
      <p class="text-sm text-[--text-muted] mb-4">
        Personas y datos de contacto mostrados en la página de contacto. El estado
        activo controla si aparece en el sitio público.
      </p>
      <div class="w-full h-0.5" style="background: var(--accent); opacity: 0.3;"></div>
    </div>

    {#if contactBanner}
      <div
        class="rounded-lg border px-4 py-3 text-sm flex items-center gap-2"
        class:border-green-200={contactBanner.tone === 'success'}
        class:bg-green-50={contactBanner.tone === 'success'}
        class:text-green-700={contactBanner.tone === 'success'}
        class:border-red-200={contactBanner.tone === 'error'}
        class:bg-red-50={contactBanner.tone === 'error'}
        class:text-red-700={contactBanner.tone === 'error'}
      >
        {#if contactBanner.tone === 'success'}<CheckCircle2 size={16} />{:else}<AlertCircle size={16} />{/if}
        {contactBanner.message}
      </div>
    {/if}

    {#if data.contacts.length === 0}
      <div class="rounded-lg border border-dashed border-[--border] bg-[--bg-secondary] p-6 text-sm text-[--text-muted]">
        Aún no hay contactos. Agrega el primero abajo.
      </div>
    {:else}
      <div class="space-y-4">
        {#each data.contacts as contact (contact.id)}
          <article class="rounded-lg border border-[--border] bg-[--bg-secondary] p-4 space-y-4">
            <div class="flex items-center justify-between gap-3">
              <div class="text-sm text-[--text-muted]">
                ID {contact.id} · {contact.is_active ? 'Activo' : 'Inactivo'}
              </div>
              <form method="POST" action="?/setContactInfoActive" use:enhance={refreshAfterSubmit}>
                <input type="hidden" name="id" value={contact.id} />
                <input type="hidden" name="is_active" value={contact.is_active ? '' : 'on'} />
                <Button
                  type="submit"
                  variant={contact.is_active ? 'outline' : 'secondary'}
                  label={contact.is_active ? 'Desactivar' : 'Activar'}
                />
              </form>
            </div>

            <form method="POST" action="?/updateContactInfo" use:enhance={refreshAfterSubmit} class="space-y-3">
              <input type="hidden" name="id" value={contact.id} />

              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FormField
                  name="first_name"
                  label="Nombre"
                  required
                  value={s(contact.first_name)}
                />
                <FormField
                  name="middle_name"
                  label="Segundo nombre"
                  value={s(contact.middle_name)}
                />
                <FormField
                  name="last_name"
                  label="Apellido"
                  required
                  value={s(contact.last_name)}
                />
              </div>

              <FormField
                name="title_description"
                label="Cargo / descripción"
                value={s(contact.title_description)}
              />

              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  name="contact_email"
                  type="email"
                  label="Correo electrónico"
                  value={s(contact.contact_email)}
                />
                <FormField
                  name="contact_phone"
                  label="Teléfono"
                  value={s(contact.contact_phone)}
                />
              </div>

              <FormField
                name="physical_location"
                label="Ubicación física"
                value={s(contact.physical_location)}
              />

              <FormField
                name="cta_headline"
                label="Encabezado CTA"
                value={s(contact.cta_headline)}
              />
              <FormField
                name="cta_description"
                type="textarea"
                rows={2}
                label="Descripción CTA"
                value={s(contact.cta_description)}
              />

              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_active"
                  class="h-5 w-9 rounded-full bg-[--border] checked:bg-[--color-red] transition-colors"
                  checked={contact.is_active}
                />
                <span class="text-sm text-[--text-muted]">Activo (visible públicamente)</span>
              </label>

              <div class="pt-1">
                <Button type="submit" variant="primary" label="Guardar" />
              </div>
            </form>

            <form method="POST" action="?/deleteContactInfo" use:enhance={refreshAfterSubmit}>
              <input type="hidden" name="id" value={contact.id} />
              <Button type="submit" variant="danger" icon="Trash2" label="Eliminar" />
            </form>
          </article>
        {/each}
      </div>
    {/if}

    <div class="pt-4 border-t border-[--border]">
      <h3 class="text-sm font-semibold text-[--text-primary] mb-3">Agregar contacto</h3>
      <form method="POST" action="?/createContactInfo" use:enhance={refreshAfterSubmit} class="space-y-3">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <FormField name="first_name" label="Nombre" required />
          <FormField name="middle_name" label="Segundo nombre" />
          <FormField name="last_name" label="Apellido" required />
        </div>
        <FormField name="title_description" label="Cargo / descripción" />
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField name="contact_email" type="email" label="Correo electrónico" />
          <FormField name="contact_phone" label="Teléfono" />
        </div>
        <FormField name="physical_location" label="Ubicación física" />
        <FormField name="cta_headline" label="Encabezado CTA" />
        <FormField name="cta_description" type="textarea" rows={2} label="Descripción CTA" />
        <label class="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="is_active"
            class="h-5 w-9 rounded-full bg-[--border] checked:bg-[--color-red] transition-colors"
            checked
          />
          <span class="text-sm text-[--text-muted]">Activo al crearse</span>
        </label>
        <div class="pt-1">
          <Button type="submit" variant="primary" icon="Plus" label="Crear contacto" />
        </div>
      </form>
    </div>
  </section>

  <!-- =====================================================================
       7. SOCIAL LINKS  (repeatable + visibility, sort_order via field)
  ===================================================================== -->
  <section class="bg-surface rounded-xl border border-[--border] p-6 space-y-6">
    <div>
      <h2 class="text-lg font-semibold text-[--text-primary]">Redes sociales</h2>
      <p class="text-sm text-[--text-muted] mb-4">
        Enlaces a redes sociales mostrados en el footer. Usa el campo “Orden” para
        controlar el orden de aparición.
      </p>
      <div class="w-full h-0.5" style="background: var(--accent); opacity: 0.3;"></div>
    </div>

    {#if socialBanner}
      <div
        class="rounded-lg border px-4 py-3 text-sm flex items-center gap-2"
        class:border-green-200={socialBanner.tone === 'success'}
        class:bg-green-50={socialBanner.tone === 'success'}
        class:text-green-700={socialBanner.tone === 'success'}
        class:border-red-200={socialBanner.tone === 'error'}
        class:bg-red-50={socialBanner.tone === 'error'}
        class:text-red-700={socialBanner.tone === 'error'}
      >
        {#if socialBanner.tone === 'success'}<CheckCircle2 size={16} />{:else}<AlertCircle size={16} />{/if}
        {socialBanner.message}
      </div>
    {/if}

    {#if data.socialLinks.length === 0}
      <div class="rounded-lg border border-dashed border-[--border] bg-[--bg-secondary] p-6 text-sm text-[--text-muted]">
        Aún no hay redes sociales configuradas. Agrega la primera abajo.
      </div>
    {:else}
      <div class="space-y-4">
        {#each data.socialLinks as link (link.id)}
          <article class="rounded-lg border border-[--border] bg-[--bg-secondary] p-4 space-y-4">
            <div class="text-sm text-[--text-muted]">ID {link.id}</div>

            <form method="POST" action="?/updateSocialLink" use:enhance={refreshAfterSubmit} class="space-y-3">
              <input type="hidden" name="id" value={link.id} />

              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField name="platform" label="Plataforma" required value={s(link.platform)} />
                <FormField name="url" type="url" label="URL" required value={s(link.url)} />
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  name="icon_identifier"
                  label="Identificador de ícono"
                  value={s(link.icon_identifier)}
                />
                <FormField
                  name="sort_order"
                  type="number"
                  label="Orden"
                  value={link.sort_order}
                />
              </div>

              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_visible"
                  class="h-5 w-9 rounded-full bg-[--border] checked:bg-[--color-red] transition-colors"
                  checked={link.is_visible}
                />
                <span class="text-sm text-[--text-muted]">Visible en el sitio público</span>
              </label>

              <div class="pt-1">
                <Button type="submit" variant="primary" label="Guardar" />
              </div>
            </form>

            <form method="POST" action="?/deleteSocialLink" use:enhance={refreshAfterSubmit}>
              <input type="hidden" name="id" value={link.id} />
              <Button type="submit" variant="danger" icon="Trash2" label="Eliminar" />
            </form>
          </article>
        {/each}
      </div>
    {/if}

    <div class="pt-4 border-t border-[--border]">
      <h3 class="text-sm font-semibold text-[--text-primary] mb-3">Agregar red social</h3>
      <form method="POST" action="?/createSocialLink" use:enhance={refreshAfterSubmit} class="space-y-3">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField name="platform" label="Plataforma" required />
          <FormField name="url" type="url" label="URL" required />
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField name="icon_identifier" label="Identificador de ícono" />
          <FormField
            name="sort_order"
            type="number"
            label="Orden"
            value={data.socialLinks.length}
          />
        </div>
        <label class="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="is_visible"
            class="h-5 w-9 rounded-full bg-[--border] checked:bg-[--color-red] transition-colors"
            checked
          />
          <span class="text-sm text-[--text-muted]">Visible al crearse</span>
        </label>
        <div class="pt-1">
          <Button type="submit" variant="primary" icon="Plus" label="Crear red social" />
        </div>
      </form>
    </div>
  </section>
</div>
