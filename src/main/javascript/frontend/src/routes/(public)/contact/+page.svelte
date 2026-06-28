<script lang="ts">
  import { enhance } from '$app/forms';
  import { CheckCircle } from 'lucide-svelte';
  import { capture } from '$lib/utils/posthog';
  import FormField from '$lib/components/ui/FormField.svelte';
  import RichTextField from '$lib/components/ui/RichTextField.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import InfoRow from '$lib/components/ui/InfoRow.svelte';
  import PageHero from '$lib/components/layout/PageHero.svelte';

  interface Content {
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    title_description?: string;
    contact_email?: string;
    contact_location?: string;
    contact_availability?: string;
    social_instagram?: string;
    social_usfq?: string;
  }

  interface Props {
    data: { content: Content };
    form: any;
  }

  let { data, form }: Props = $props();

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

<!-- Body -->
<section class="bg py-14 md:py-20">
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
      <!-- Contact Info -->
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
            <InfoRow
              icon="Card"
              label="Email"
              value={data.content.contact_email || ''}
              href="mailto:{data.content.contact_email}"
            />
          </li>
          <li>
            <InfoRow
              icon="MapPin"
              label="Ubicación"
              value={data.content.contact_location || ''}
            />
          </li>
          <li>
            <InfoRow
              icon="Clock"
              label="Disponibilidad"
              value={data.content.contact_availability || ''}
            />
          </li>
        </ul>
        
      </div>

      <!-- Contact Form -->
      <div>
        <div>
        <div class="text-center mb-12">
      <span class="text-lg uppercase tracking-widest block mb-4" style="color: var(--accent); font-family: var(--font-subheading);">Comunícate con nosotros</span>
      <div class="w-full h-0.5 mx-auto mb-6" style="background: var(--accent); opacity: 0.3;"></div>
    </div>
        {#if form?.success}
          <div class="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <div class="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle class="text-green-500" size={28} />
            </div>
            <p class="font-semibold text-green-900">¡Mensaje enviado!</p>
            <p class="text-sm text-green-700 mt-1">Te responderemos lo antes posible.</p>
          </div>
        {:else}
          {#if form?.error}
            <div class="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
              {form.error}
            </div>
          {/if}
          <form method="POST" action="?/submitContact" use:enhance class="space-y-4">
            <FormField name="nombre" label="Ingresa tu Nombre" required placeholder="Tu nombre completo" error={form?.errors?.nombre}/>
            <FormField name="correo" type="email" label="Ingresa tu correo electrónico de la USFQ" required placeholder="tu@estud.usfq.edu.ec" error={form?.errors?.correo} />
            <FormField name="codigo_banner" type="text" label="Ingresa tu código banner de la USFQ" required placeholder="00123456" error={form?.errors?.codigo_banner}/>
            <FormField name="asunto" label="Ingresa el Asunto de tu mensaje" required placeholder="¿En qué podemos ayudarte?" error={form?.errors?.asunto} />
            <RichTextField name="mensaje" label="Escribe tu mensaje" placeholder="Escribe tu mensaje..." required minHeightClass="min-h-[120px]" />
            <Button type="submit" variant="primary" fullWidth label="Enviar mensaje" />
          </form>
        {/if}
      </div>
    </div>
  </div>
  </div>
</section>
