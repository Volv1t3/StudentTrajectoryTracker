<script lang="ts">
  import { enhance } from '$app/forms';
  import { untrack } from 'svelte';
  import { CheckCircle } from 'lucide-svelte';
  import { capture } from '$lib/utils/posthog';
  import FormField from '$lib/components/ui/FormField.svelte';
  import RichTextField from '$lib/components/ui/RichTextField.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import InfoRow from '$lib/components/ui/InfoRow.svelte';
  import PageHero from '$lib/components/layout/PageHero.svelte';
  import FormErrorSummary from '$lib/components/ui/FormErrorSummary.svelte';
  import { validateContactForm, CONTACT_LIMITS } from '$lib/validation/contact';
  import { extractApiError, mapBackendFields, summarizeFormError } from '$lib/validation/apiError';
  import { contactFieldMap } from '$lib/validation/fieldMaps';
  import SafeRichText from "$lib/components/ui/SafeRichText.svelte";

  interface Content {
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    title_description?: string;
    contact_email?: string;
    contact_location?: string;
    contact_headline?: string;
    contact_description?: string;
    social_instagram?: string;
    social_usfq?: string;
  }

  interface Props {
    data: { content: Content };
    form: any;
  }

  let { data, form }: Props = $props();

  let nombre = $state('');     // → name
  let correo = $state('');     // → email
  let asunto = $state('');     // → subject
  let mensaje = $state('');    // → message (rich text)

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

  function stripHtml(s: string) {
    return s.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
  }

  let mensajePlain = $derived(stripHtml(mensaje));

  let frontErrors = $derived(
    validateContactForm({
      name: nombre,
      email: correo,
      subject: asunto,
      message: mensajePlain,
    }) as Record<string, string>
  );

  function hasContent(v: unknown): boolean {
    if (v == null) return false;
    if (typeof v === 'string') return v.trim() !== '';
    return true;
  }

  let show = $derived<Record<string, boolean>>({
    nombre: touched.nombre || hasContent(nombre) || submitAttempted,
    correo: touched.correo || hasContent(correo) || submitAttempted,
    asunto: touched.asunto || hasContent(asunto) || submitAttempted,
    mensaje: touched.mensaje || mensajePlain.length > 0 || submitAttempted,
  });

  let errors = $derived<Record<string, string>>({ ...frontErrors, ...backendErrors });
  let isValid = $derived(Object.keys(frontErrors).length === 0 && mensajePlain.length > 0);

  $effect(() => {
    if (form?.apiError !== undefined || form?.error !== undefined) {
      const extracted = extractApiError(form?.apiError ?? form?.error ?? null);
      const mappedBackendErrors = mapBackendFields(extracted.fields, contactFieldMap);
      const nextTopError = summarizeFormError(extracted);
      const nextTouched: Record<string, boolean> = { ...untrack(() => touched) };
      for (const k of Object.keys(mappedBackendErrors)) nextTouched[k] = true;

      backendErrors = mappedBackendErrors;
      topError = nextTopError;
      submitAttempted = true;
      touched = nextTouched;
    }
  });

  $effect(() => {
    if (form?.success) {
      capture('contact_form_submitted', {
        route: '/contact',
        route_group: 'public',
        source: 'frontend'
      });
    }
  });
</script>

<svelte:head>
  <title>Contacto — DLAB</title>
</svelte:head>

<PageHero
  title="Contacto"
  subtitle="¿Tienes preguntas? Estamos para ayudarte."
/>

<section class="bg py-14 md:py-20">
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
      <div>
        <div class="text-center mb-12">
          <span class="text-lg uppercase tracking-widest block mb-4" style="color: var(--accent); font-family: var(--font-subheading);">Directorio del D.Lab</span>
          <div class="w-full h-0.5 mx-auto mb-6" style="background: var(--accent); opacity: 0.3;"></div>
        </div>
        {#if data.content.first_name || data.content.last_name}
          <div class="mb-6 rounded-xl border border-[--border] bg-[--bg-secondary] p-4">
            <p class="text-sm font-semibold text-[--text-primary]">
              {data.content.first_name || ''}
              {#if data.content.middle_name} {data.content.middle_name}{/if}
              {#if data.content.last_name} {data.content.last_name}{/if}
            </p>
            {#if data.content.title_description}
              <p class="text-sm text-[--text-muted] mt-1">{data.content.title_description}</p>
            {/if}
          </div>
        {/if}
        <ul class="space-y-5">
          <li>
            <InfoRow icon="Card" label="Email" value={data.content.contact_email || ''} href="mailto:{data.content.contact_email}" />
          </li>
          <li>
            <InfoRow icon="MapPin" label="Ubicación" value={data.content.contact_location || ''} />
          </li>
          <li>
            <InfoRow icon="Clock" label="" value={data.content.contact_headline || ''} />
            <div class="pl-6 mt-1 text-sm">
              <SafeRichText html={data.content.contact_description || ''} />
            </div>
          </li>
        </ul>
      </div>

      <div>
        <div class="text-center mb-12">
          <span class="text-lg uppercase tracking-widest block mb-4" style="color: var(--accent); font-family: var(--font-subheading);">Comunícate con nosotros</span>
          <div class="w-full h-0.5 mx-auto mb-6" style="background: var(--accent); opacity: 0.3;"></div>
        </div>
        {#if form?.success}
          <div class="bg-green-100 border border-green-200 rounded-xl p-6 text-center">
            <div class="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle class="text-green-500" size={28} />
            </div>
            <p class="font-semibold text-green-900">¡Mensaje enviado!</p>
            <p class="text-sm text-green-700 mt-1">Te responderemos lo antes posible.</p>
          </div>
        {:else}
          <FormErrorSummary message={topError} onDismiss={() => (topError = '')} />
          <form
            method="POST"
            action="?/submitContact"
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
            class="space-y-4"
          >
            <FormField
              name="nombre"
              label="Ingresa tu Nombre"
              required
              placeholder="Tu nombre completo"
              bind:value={nombre}
              counter={CONTACT_LIMITS.name.max}
              error={errors.nombre || errors.name}
              touched={show.nombre}
            />
            <FormField
              name="correo"
              type="email"
              label="Ingresa tu correo electrónico"
              required
              placeholder="tu@correo.com"
              bind:value={correo}
              error={errors.correo || errors.email}
              touched={show.correo}
            />
            <FormField
              name="asunto"
              label="Ingresa el Asunto de tu mensaje"
              required
              placeholder="¿En qué podemos ayudarte?"
              bind:value={asunto}
              counter={CONTACT_LIMITS.subject.max}
              error={errors.asunto || errors.subject}
              touched={show.asunto}
            />
            <RichTextField
              name="mensaje"
              label="Escribe tu mensaje"
              placeholder="Escribe tu mensaje..."
              required
              minHeightClass="min-h-[120px]"
              onchange={(html) => { mensaje = html; markTouched('mensaje'); }}
              counter={CONTACT_LIMITS.message.max}
              hint={`Máximo ${CONTACT_LIMITS.message.max} caracteres`}
              error={errors.mensaje || errors.message}
              touched={show.mensaje}
            />
            <Button type="submit" variant="primary" fullWidth label="Enviar mensaje" disabled={submitAttempted ? ( mensajePlain.length === 0 || asunto.length === 0 || correo.length === 0 || nombre.length === 0 ) : ( !submitAttempted && !isValid)} />
          </form>
        {/if}
      </div>
    </div>
  </div>
</section>
