<script lang="ts">
  import { FolderOpen, ImageIcon, Video } from 'lucide-svelte';
  import { capture } from '$lib/utils/posthog';
  import Button from '$lib/components/ui/Button.svelte';
  import InfoRow from '$lib/components/ui/InfoRow.svelte';
  import PageHero from '$lib/components/layout/PageHero.svelte';

  interface Event {
    id: number;
    title?: string;
    nombre: string;
    slug: string;
    type?: string;
    tipo: string;
    short_description?: string;
    descripcion_corta: string;
    full_description?: string;
    descripcion_larga: string;
    target_audience?: string | null;
    audiencia_objetivo?: string;
    fecha_inicio: string;
    fecha_fin: string;
    event_date?: string | null;
    event_end_date?: string | null;
    registration_deadline?: string | null;
    fecha_cierre_registro?: string;
    location?: string | null;
    lugar?: string;
    capacity?: number | null;
    cuota_maxima?: number;
    banner_media_asset_id?: number | null;
    video_media_asset_id?: number | null;
    poster_media_asset_id?: number | null;
    registration_url?: string | null;
    link_externo?: string;
    status?: string;
    is_highlighted?: boolean;
    is_visible?: boolean;
    created_by_admin_id?: number;
    created_at?: string;
    updated_at?: string;
    tags?: Array<{ id: number; name: string; slug: string }> | null;
    banner_image_url?: string;
    poster_image_url?: string;
    video_url?: string;
  }

  interface Props {
    data: { event: Event };
  }

  let { data }: Props = $props();

  $effect(() => {
    capture('event_viewed', {
      event_id: data.event.id,
      event_slug: data.event.slug,
      event_name: data.event.nombre,
      event_type: data.event.tipo,
      route: `/events/${data.event.slug}`,
      route_group: 'public',
      source: 'frontend'
    });
  });

  function handleExternalLinkClick() {
    capture('event_external_link_clicked', {
      event_id: data.event.id,
      event_slug: data.event.slug,
      event_name: data.event.nombre,
      event_type: data.event.tipo,
      link: data.event.link_externo,
      route: `/events/${data.event.slug}`,
      route_group: 'public',
      source: 'frontend'
    });
  }

  function getVideoEmbedUrl(source?: string | null) {
    if (!source) return null;

    try {
      const url = new URL(source);
      const host = url.hostname.replace(/^www\./, '');

      if (host.includes('youtu.be')) {
        const id = url.pathname.split('/').filter(Boolean)[0];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }

      if (host.includes('youtube.com') || host.includes('youtube-nocookie.com')) {
        const embedId = url.searchParams.get('v');
        if (embedId) return `https://www.youtube.com/embed/${embedId}`;
        const embedMatch = url.pathname.match(/\/embed\/([^/]+)/);
        if (embedMatch?.[1]) return `https://www.youtube.com/embed/${embedMatch[1]}`;
      }

      if (host.includes('vimeo.com')) {
        const vimeoId = url.pathname.split('/').filter(Boolean).pop();
        return vimeoId ? `https://player.vimeo.com/video/${vimeoId}` : null;
      }

      return null;
    } catch {
      return null;
    }
  }

  function toTitleCase(value: string) {
    return value
      .split(' ')
      .map((part) => part ? part.charAt(0).toUpperCase() + part.slice(1) : part)
      .join(' ');
  }

  function parseLocalDateTime(value?: string) {
    if (!value) return '';
    const normalized = String(value).trim().replace(' ', 'T');
    const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
    if (!match) return null;
    const [, year, month, day, hour, minute, second = '00'] = match;
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second)
    );
  }

  function formatDisplayDateTime(value?: string) {
    const parsed = parseLocalDateTime(value);
    if (!parsed) return '';

    const datePart = toTitleCase(
      parsed.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    );
    const timePart = parsed.toLocaleTimeString('es-EC', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    return `${datePart} · ${timePart}`;
  }

  const videoEmbedUrl = $derived(getVideoEmbedUrl(data.event.video_url));
</script>

<style>
  :global(.event-description ul) {
    list-style-type: disc;
    padding-left: 1.5rem;
    margin: 0.75rem 0;
  }
  :global(.event-description ol) {
    list-style-type: decimal;
    padding-left: 1.5rem;
    margin: 0.75rem 0;
  }
  :global(.event-description li) {
    margin: 0.25rem 0;
  }
  :global(.event-description li p) {
    margin: 0;
  }
  :global(.event-description ul ul) {
    list-style-type: circle;
  }
  :global(.event-description ul ul ul) {
    list-style-type: square;
  }
  :global(.event-description blockquote) {
    border-left: 3px solid var(--accent);
    padding-left: 1rem;
    margin: 0.75rem 0;
    color: var(--text-secondary);
    font-style: italic;
  }
  :global(.event-description pre) {
    background: var(--bg-secondary);
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    margin: 0.75rem 0;
    overflow-x: auto;
  }
  :global(.event-description code) {
    background: var(--bg-secondary);
    border-radius: 0.25rem;
    padding: 0.15rem 0.3rem;
    font-size: 0.875rem;
  }
  :global(.event-description pre code) {
    background: none;
    padding: 0;
  }
  :global(.event-description hr) {
    border: none;
    border-top: 2px solid var(--border);
    margin: 1rem 0;
  }
  :global(.event-description h1),
  :global(.event-description h2),
  :global(.event-description h3) {
    color: var(--text-primary);
    margin: 1.25rem 0 0.5rem;
  }
  :global(.event-description a) {
    color: var(--accent);
    text-decoration: underline;
  }
</style>

<svelte:head>
  <title>{data.event.nombre} — DLAB</title>
</svelte:head>

<PageHero
  title={data.event.nombre}
  subtitle={data.event.descripcion_corta}
  eyebrow={data.event.tipo}
/>

<section class="bg-surface pt-12 md:pt-16 pb-4 md:pb-6">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
      <div class="lg:col-span-2 space-y-8">
        <div>
          <div class="mb-6">
            <span class="text-lg uppercase tracking-widest block mb-4" style="color: var(--accent); font-family: var(--font-subheading);">Descripción del evento</span>
            <div class="w-full h-0.5" style="background: var(--accent); opacity: 0.3;"></div>
          </div>
          <div class="relative overflow-hidden rounded-2xl border border-[--border] mb-6" style="background: linear-gradient(135deg, var(--accent-light) 0%, color-mix(in srgb, var(--deep) 15%, transparent) 100%);">
            {#if data.event.banner_image_url}
              <img
                src={data.event.banner_image_url}
                alt={`Banner del evento ${data.event.nombre}`}
                class="w-full aspect-[16/9] object-cover"
              />
            {:else}
              <div class="hero-grid opacity-[0.12] absolute inset-0"></div>
              <div class="relative flex items-center justify-center aspect-[16/9]">
                <div class="w-24 h-24 rounded-2xl flex items-center justify-center" style="background: var(--accent); color: white; transform: rotate(-3deg);">
                  <FolderOpen size={44} />
                </div>
              </div>
            {/if}
          </div>
          <div class="event-description prose prose-sm max-w-none text-[--text-secondary] leading-relaxed">
            {@html data.event.descripcion_larga}
          </div>
        </div>
      </div>

      <aside class="lg:col-span-1 space-y-6">
        <div class="bg-[--bg-secondary] rounded-xl border border-[--border] p-6 sticky space-y-4">
          <div class="text-center mb-6">
            <span class="text-lg uppercase tracking-widest block mb-4" style="color: var(--accent); font-family: var(--font-subheading);">Detalles del evento</span>
            <div class="w-full h-0.5 mx-auto" style="background: var(--accent); opacity: 0.3;"></div>
          </div>
          <InfoRow
            icon="Calendar"
            label="Fecha de Inicio del Evento"
            value=''
          />
          <div class="flex flex-wrap gap-2">
            <span class='border-2 p-2 ml-6 bg-[--text-primary] hover:bg-[--color-red-hover] text-xs font-sans rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md'>{formatDisplayDateTime(data.event.fecha_inicio)}</span>
          </div>
          {#if data.event.fecha_fin}
            <InfoRow
              icon="Calendar"
              label="Fecha de Finalización del Evento"
              value=''
            />
            <div class="flex flex-wrap gap-2">
              <span class='border-2 p-2 ml-6 bg-[--text-primary] hover:bg-[--color-red-hover] text-xs font-sans rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md'>{formatDisplayDateTime(data.event.fecha_fin)}</span>
            </div>
          {/if}
          {#if data.event.fecha_cierre_registro}
            <InfoRow
              icon="Calendar"
              label="Cierre de registro del Evento"
              value=''
            />
            <div class="flex flex-wrap gap-2">
              <span class='border-2 p-2 ml-6 bg-[--text-primary] hover:bg-[--color-red-hover] text-xs font-sans rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md'>{formatDisplayDateTime(data.event.fecha_cierre_registro)}</span>
            </div>
          {/if}
          <InfoRow icon="Building2" label="Tipo de Evento" value='' />
          <div class="flex flex-wrap gap-2">
              <span class='border-2 p-2 ml-6 bg-[--text-primary] hover:bg-[--color-red-hover] text-xs font-sans rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md'>{data.event.tipo}</span>
            </div>
          {#if data.event.lugar}
            <InfoRow icon="Building2" label="Lugar del Evento" value='' />
            <div class="flex flex-wrap gap-2">
              <span class='border-2 p-2 ml-6 bg-[--text-primary] hover:bg-[--color-red-hover] text-xs font-sans rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md'>{data.event.lugar}s</span>
            </div>
          {/if}
          {#if data.event.cuota_maxima}
            <InfoRow icon="Users" label="Cupo máximo del Evento" value=''/>
            <div class="flex flex-wrap gap-2">
              <span class='border-2 p-2 ml-6 bg-[--text-primary] hover:bg-[--color-red-hover] text-xs font-sans rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md'>{String(data.event.cuota_maxima)} </span>
            </div>
          {/if}
          <div class="mt-12"></div>
          {#if data.event.link_externo}
            <Button variant="primary" fullWidth href={data.event.link_externo} target="_blank" label="Más información y Registro" icon="ExternalLink" onclick={handleExternalLinkClick} />
          {/if}
        </div>

        <div class="relative rounded-xl border border-[--border] overflow-hidden" style="background: linear-gradient(135deg, var(--accent-light) 0%, color-mix(in srgb, var(--deep) 15%, transparent) 100%);">
          <div class="px-5 pt-5">
            <span class="text-lg uppercase tracking-widest block mb-4 text-center" style="color: var(--accent); font-family: var(--font-subheading);">Afiche del evento</span>
          </div>
          {#if data.event.poster_image_url}
            <img
              src={data.event.poster_image_url}
              alt={`Afiche del evento ${data.event.nombre}`}
              class="w-full object-cover"
            />
          {:else}
            <div class="hero-grid opacity-[0.12] absolute inset-0"></div>
            <div class="relative flex items-center justify-center aspect-[4/5]">
              <div class="w-24 h-24 rounded-2xl flex items-center justify-center" style="background: var(--accent); color: white; transform: rotate(3deg);">
                <ImageIcon size={44} />
              </div>
            </div>
          {/if}
        </div>
      </aside>
    </div>
  </div>
</section>

<section class="py-16 md:py-12" style="background: var(--bg-primary);">
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-10">
      <span class="text-lg uppercase tracking-widest block mb-4" style="color: var(--accent); font-family: var(--font-subheading);">Video del evento</span>
      <div class="w-12 h-0.5 mx-auto" style="background: var(--accent); opacity: 0.3;"></div>
    </div>

    <div class="relative rounded-2xl border border-[--border] overflow-hidden shadow-xl" style="background: linear-gradient(135deg, var(--accent-light) 0%, color-mix(in srgb, var(--deep) 15%, transparent) 100%);">
      {#if videoEmbedUrl}
        <div class="relative w-full" style="padding-top: 56.25%;">
          <iframe
            class="absolute inset-0 h-full w-full"
            src={videoEmbedUrl}
            title={`Video del evento ${data.event.nombre}`}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
          ></iframe>
        </div>
      {:else}
        <div class="hero-grid opacity-[0.12] absolute inset-0"></div>
        <div class="relative flex items-center justify-center aspect-[16/9]">
          <div class="w-24 h-24 rounded-2xl flex items-center justify-center" style="background: var(--accent); color: white; transform: rotate(3deg);">
            <Video size={44} />
          </div>
        </div>
      {/if}
    </div>
  </div>
</section>
