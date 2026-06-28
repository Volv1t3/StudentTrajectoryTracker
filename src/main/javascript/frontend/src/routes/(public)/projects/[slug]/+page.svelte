<script lang="ts">
  import { FolderOpen } from 'lucide-svelte';
  import { capture } from '$lib/utils/posthog';
  import Button from '$lib/components/ui/Button.svelte';
  import InfoRow from '$lib/components/ui/InfoRow.svelte';
  import PageHero from '$lib/components/layout/PageHero.svelte';

  interface Project {
    id: number;
    nombre: string;
    slug: string;
    estado: string;
    categoria: string;
    descripcion_corta: string;
    descripcion_larga: string;
    disponibilidad_semanal_requerida: string | null;
    modalidad: string;
    habilidades_requeridas: string[];
    categorias?: Array<{ id: number; name: string; slug: string; category: string }>;
    subcategorias?: Array<{ id: number; name: string; slug: string; category: string }>;
    meeting_days?: Array<{ id: number; day_of_week: string; start_time: string; end_time: string; notes: string | null }>;
    meeting_days_summary?: string | null;
    header_image_url?: string | null;
    video_url?: string | null;
    responsable_nombre?: string;
    responsable_usfq_email?: string | null;
    fecha_inicio?: string;
    fecha_fin_estimada?: string;
    current_collaborator_count: number;
    max_collaborators: number | null;
  }



  interface Props {
    data: {
      project: Project;
      user: any;
      activeAssignmentCount: number;
      hasReachedProjectLimit: boolean;
      hasLiveApplicationForProject: boolean;
      hasLiveAssignmentForProject: boolean;
      isProjectFull: boolean;
      projectAcceptsApplications: boolean;
    };
  }

  let { data }: Props = $props();

  $effect(() => {
    capture('project_viewed', {
      project_id: data.project.id,
      project_slug: data.project.slug,
      project_name: data.project.nombre,
      category: data.project.categoria,
      modality: data.project.modalidad,
      status: data.project.estado,
      route: `/projects/${data.project.slug}`,
      route_group: 'public',
      source: 'frontend'
    });
  });

  function handleApplyClick() {
    capture('project_apply_started', {
      project_id: data.project.id,
      project_slug: data.project.slug,
      project_name: data.project.nombre,
      category: data.project.categoria,
      route: `/projects/${data.project.slug}`,
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

  const videoEmbedUrl = $derived(getVideoEmbedUrl(data.project.video_url));
</script>

<style>
  :global(.project-description ul) {
    list-style-type: disc;
    padding-left: 1.5rem;
    margin: 0.75rem 0;
  }
  :global(.project-description ol) {
    list-style-type: decimal;
    padding-left: 1.5rem;
    margin: 0.75rem 0;
  }
  :global(.project-description li) {
    margin: 0.25rem 0;
  }
  :global(.project-description li p) {
    margin: 0;
  }
  :global(.project-description ul ul) {
    list-style-type: circle;
  }
  :global(.project-description ul ul ul) {
    list-style-type: square;
  }
  :global(.project-description blockquote) {
    border-left: 3px solid var(--accent);
    padding-left: 1rem;
    margin: 0.75rem 0;
    color: var(--text-secondary);
    font-style: italic;
  }
  :global(.project-description pre) {
    background: var(--bg-secondary);
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    margin: 0.75rem 0;
    overflow-x: auto;
  }
  :global(.project-description code) {
    background: var(--bg-secondary);
    border-radius: 0.25rem;
    padding: 0.15rem 0.3rem;
    font-size: 0.875rem;
  }
  :global(.project-description pre code) {
    background: none;
    padding: 0;
  }
  :global(.project-description hr) {
    border: none;
    border-top: 2px solid var(--border);
    margin: 1rem 0;
  }
  :global(.project-description h1),
  :global(.project-description h2),
  :global(.project-description h3) {
    color: var(--text-primary);
    margin: 1.25rem 0 0.5rem;
  }
  :global(.project-description a) {
    color: var(--accent);
    text-decoration: underline;
  }
</style>

<svelte:head>
  <title>{data.project.nombre} — DLAB</title>
</svelte:head>

<PageHero
  title={data.project.nombre}
  subtitle={data.project.descripcion_corta}
  eyebrow={data.project.categoria}
>
  {#if data.projectAcceptsApplications}
    <br><br>
    {#if !data.user}
      <Button
        variant='primary'
        disabled
        size='lg'
        label='Necesitas Iniciar Sesión para Solicitar tu Vinculación al proyecto'
      />
    {:else if data.isProjectFull}
      <div class="space-y-3">
        <Button
          variant='primary'
          disabled
          size='lg'
          icon='Lock'
          label='El proyecto alcanzó su cupo máximo'
        />
        <p class="text-sm text-[--color-text-muted-on-dark] max-w-xl mx-auto">
          Este proyecto ya cuenta con {data.project.current_collaborator_count} registro(s)
          {#if data.project.max_collaborators !== null} de un total de {data.project.max_collaborators}{/if}.
        </p>
      </div>
    {:else if data.hasLiveAssignmentForProject}
      <div class="space-y-3">
        <Button
          variant='primary'
          disabled
          size='lg'
          icon='Lock'
          label='Ya estás vinculado a este proyecto'
        />
        <p class="text-sm text-[--color-text-muted-on-dark] max-w-xl mx-auto">
          Ya tienes una vinculación activa o pausada con este proyecto.
        </p>
      </div>
    {:else if data.hasLiveApplicationForProject}
      <div class="space-y-3">
        <Button
          variant='primary'
          disabled
          size='lg'
          icon='Lock'
          label='Ya tienes una solicitud activa para este proyecto'
        />
        <p class="text-sm text-[--color-text-muted-on-dark] max-w-xl mx-auto">
          Ya existe una solicitud pendiente o en revisión para este proyecto.
        </p>
      </div>
    {:else if data.hasReachedProjectLimit}
      <div class="space-y-3">
        <Button
          variant='primary'
          disabled
          size='lg'
          icon='Lock'
          label='Ya participas en 2 proyectos activos'
        />
        <p class="text-sm text-[--color-text-muted-on-dark] max-w-xl mx-auto">
          No puedes aplicar a más proyectos mientras tengas 2 vinculaciones activas. Revisa tus solicitudes o finaliza una participación activa antes de volver a aplicar.
        </p>
      </div>
    {:else}
      <Button
      variant="primary"
      size="lg"
      href={data.user ? `/projects/${data.project.slug}/apply` : `/login?return=/projects/${data.project.slug}/apply`}
      label="Aplicar a este proyecto"
      onclick={handleApplyClick}
    />
    {/if}
  {:else}
      <Button
        variant='primary'
        disabled
        size='lg'
        icon='Lock'
        label= 'El Estado actual del Proyecto no permite recibir Solicitudes de Viculación'
      />
  {/if}
</PageHero>

<!-- Body -->
<section class="bg-surface pt-12 md:pt-16 pb-4 md:pb-6">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
      <div class="lg:col-span-2 space-y-8">
        <div>
          <div class="mb-6">
            <span class="text-lg uppercase tracking-widest block mb-4" style="color: var(--accent); font-family: var(--font-subheading);">Descripción del proyecto</span>
            <div class="w-full h-0.5" style="background: var(--accent); opacity: 0.3;"></div>
          </div>
          <div class="relative overflow-hidden rounded-2xl border border-[--border] mb-6" style="background: linear-gradient(135deg, var(--accent-light) 0%, color-mix(in srgb, var(--deep) 15%, transparent) 100%);">
            {#if data.project.header_image_url}
              <img
                src={data.project.header_image_url}
                alt={`Imagen de portada de ${data.project.nombre}`}
                class="w-full aspect-[16/9] object-cover"
              />
            {:else}
              <div class="hero-grid opacity-[0.12] absolute inset-0"></div>
              <div class="relative flex items-center justify-center aspect-video">
                <div class="w-24 h-24 rounded-2xl flex items-center justify-center" style="background: var(--accent); color: white; transform: rotate(-3deg);">
                  <FolderOpen size={44} />
                </div>
              </div>
            {/if}
          </div>
          <div class="project-description prose prose-sm max-w-none text-[--text-secondary] leading-relaxed">
            {@html data.project.descripcion_larga}
          </div>
        </div>
        {#if (data.project.habilidades_requeridas ?? []).length > 0}
          <div>
            <div class="mb-6">
              <span class="text-lg uppercase tracking-widest block mb-4" style="color: var(--accent); font-family: var(--font-subheading);">Habilidades requeridas</span>
              <div class="w-full h-0.5" style="background: var(--accent); opacity: 0.3;"></div>
            </div>
            <div class="flex flex-wrap gap-2">
              {#each data.project.habilidades_requeridas as skill}
                <span class='border-2 p-2 bg-[--text-primary] hover:bg-[--color-red-hover] text-xs font-sans rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md'>{skill}</span>
              {/each}
            </div>
          </div>
        {/if}
      </div>
      <aside class="lg:col-span-1">
        <div class="bg-[--bg-secondary] rounded-xl border border-[--border] p-6 sticky  space-y-4">
          <div class="text-center mb-6">
            <span class="text-lg uppercase tracking-widest block mb-4" style="color: var(--accent); font-family: var(--font-subheading);">Detalles del proyecto</span>
            <div class="w-full h-0.5 mx-auto" style="background: var(--accent); opacity: 0.3;"></div>
          </div>
          <InfoRow icon="Clock" label="Dedicación" value={data.project.disponibilidad_semanal_requerida ?? 'No definida'} />
          <InfoRow icon="MapPin" label="Modalidad" value={data.project.modalidad} />
          <InfoRow icon="Users" label="Registrados / Cupo total" value={data.project.max_collaborators !== null ? `${data.project.current_collaborator_count} / ${data.project.max_collaborators}` : `${data.project.current_collaborator_count} / Sin cupo definido`} />
          <InfoRow icon="MapPin" label="Categorías del proyecto" value=''/>
          {#if (data.project.categorias ?? []).length > 0}
            <div class="ml-6">
              <div class="flex flex-wrap gap-2">
                {#each data.project.categorias ?? [] as cat}
                  <span class='border-2 p-2 bg-[--text-primary] hover:bg-[--color-red-hover] text-xs font-sans rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md'>{cat.name}</span>
                {/each}
              </div>
            </div>
          {/if}
          <InfoRow icon="MapPin" label="Subcategorias del proyecto" value=''/>
          {#if (data.project.subcategorias ?? []).length > 0}
            <div class="ml-6">
              <div class="flex flex-wrap gap-2">
                {#each data.project.subcategorias ?? [] as cat}
                  <span class='border-2 p-2 bg-[--text-primary] hover:bg-[--color-red-hover] text-xs font-sans rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md'>{cat.name}</span>
                {/each}
              </div>
            </div>
          {/if}
          {#if data.project.fecha_inicio}
            <InfoRow icon="Calendar" label="Inicio estimado" value={new Date(data.project.fecha_inicio).toLocaleDateString()} />
          {/if}
          {#if data.project.responsable_nombre}
            <InfoRow
              icon="User"
              label="Responsable"
              value={data.project.responsable_usfq_email ? `${data.project.responsable_nombre} · ${data.project.responsable_usfq_email}` : data.project.responsable_nombre}
            />
          {/if}
        </div>
      </aside>
    </div>
  </div>
</section>

{#if data.project.meeting_days && data.project.meeting_days.length > 0}
  <section class="bg-surface pt-4 md:pt-6 pb-12 md:pb-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-6">
        <span class="text-lg uppercase tracking-widest block mb-4" style="color: var(--accent); font-family: var(--font-subheading);">Días de reunión</span>
        <div class="w-full h-0.5" style="background: var(--accent); opacity: 0.3;"></div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
        {#each data.project.meeting_days as day}
          <div class="rounded-lg border border-[--border] bg-[--bg-secondary] p-4">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <strong class="text-[--text-primary]">{day.day_of_week}</strong>
              <span class="text-sm text-[--text-secondary]">{day.start_time} - {day.end_time}</span>
            </div>
            {#if day.notes}
              <p class="text-sm text-[--text-muted] mt-2">{day.notes}</p>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  </section>
{:else if data.project.meeting_days_summary}
  <section class="bg-surface pt-4 md:pt-6 pb-12 md:pb-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-6">
        <span class="text-lg uppercase tracking-widest block mb-4" style="color: var(--accent); font-family: var(--font-subheading);">Días de reunión</span>
        <div class="w-full h-0.5" style="background: var(--accent); opacity: 0.3;"></div>
      </div>
      <p class="text-[--text-secondary]">{data.project.meeting_days_summary}</p>
    </div>
  </section>
{/if}

<section class="py-16 md:py-12" style="background: var(--bg-primary);">
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-10">
      <span class="text-lg uppercase tracking-widest block mb-4" style="color: var(--accent); font-family: var(--font-subheading);">Video del proyecto</span>
      <div class="w-12 h-0.5 mx-auto" style="background: var(--accent); opacity: 0.3;"></div>
    </div>

    <div class="relative rounded-2xl border border-[--border] overflow-hidden shadow-xl" style="background: linear-gradient(135deg, var(--accent-light) 0%, color-mix(in srgb, var(--deep) 15%, transparent) 100%);">
      {#if videoEmbedUrl}
        <div class="relative w-full" style="padding-top: 56.25%;">
          <iframe
            class="absolute inset-0 h-full w-full"
            src={videoEmbedUrl}
            title={`Video del proyecto ${data.project.nombre}`}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
          ></iframe>
        </div>
      {:else}
        <div class="hero-grid opacity-[0.12] absolute inset-0"></div>
        <div class="relative flex items-center justify-center aspect-[16/9]">
          <div class="w-24 h-24 rounded-2xl flex items-center justify-center" style="background: var(--accent); color: white; transform: rotate(3deg);">
            <FolderOpen size={44} />
          </div>
        </div>
      {/if}
    </div>
  </div>
</section>
