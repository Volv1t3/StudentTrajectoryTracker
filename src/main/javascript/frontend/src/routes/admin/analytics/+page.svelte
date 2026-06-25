<script lang="ts">
  import { ExternalLink, BarChart3, Users, FolderKanban, Workflow } from 'lucide-svelte';

  interface Props {
    data: { embedUrl: string; publicUrl: string };
  }

  let { data }: Props = $props();

  const kpiGroups = [
    {
      title: 'Tráfico y comportamiento',
      description: 'CTR del landing, engagement de descubrimiento de proyectos, vistas únicas por ruta pública.',
      Icon: BarChart3
    },
    {
      title: 'Registros y perfiles',
      description: 'Volumen de signups, tasa de activación y enriquecimiento de perfil.',
      Icon: Users
    },
    {
      title: 'Proyectos consultados y vinculación',
      description: 'Vistas por proyecto, solicitudes recibidas y vinculaciones creadas.',
      Icon: FolderKanban
    },
    {
      title: 'Embudo de participación',
      description: 'Landing → signup → activación → vista de proyecto → solicitud → vinculación.',
      Icon: Workflow
    }
  ];

  const hasEmbed = $derived(Boolean(data.embedUrl));
</script>

<svelte:head>
  <title>Analítica — Admin DLAB</title>
</svelte:head>

<div class="p-6 md:p-8">
  <header class="mb-6 flex flex-wrap items-start justify-between gap-3">
    <div>
      <h1 class="text-2xl font-bold text-[--text-primary]">Analítica</h1>
      <p class="text-[--text-muted] text-sm mt-1 max-w-2xl">
        Tablero KPI embebido desde PostHog. La captura de eventos se realiza en frontend y backend según el contrato canónico documentado en <code class="text-xs px-1.5 py-0.5 rounded" style="background: var(--bg-secondary);">agent-task-coordination.md</code>.
      </p>
    </div>
    {#if data.publicUrl}
      <a
        href={data.publicUrl}
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border transition-colors"
        style="border-color: var(--border); color: var(--text-secondary); background: var(--bg-surface);"
      >
        <ExternalLink size={14} /> Abrir en PostHog
      </a>
    {/if}
  </header>

  <!-- KPI groups -->
  <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    {#each kpiGroups as group}
      {@const Icon = group.Icon}
      <div class="rounded-xl border p-4" style="border-color: var(--border); background: var(--bg-surface);">
        <div class="flex items-center gap-2 mb-2">
          <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg" style="background: var(--bg-secondary); color: var(--accent);">
            <Icon size={16} />
          </span>
          <h3 class="text-sm font-semibold text-[--text-primary]">{group.title}</h3>
        </div>
        <p class="text-xs text-[--text-muted] leading-relaxed">{group.description}</p>
      </div>
    {/each}
  </section>

  <!-- Embed -->
  <section class="rounded-xl border overflow-hidden" style="border-color: var(--border); background: var(--bg-surface);">
    {#if hasEmbed}
      <div class="relative w-full" style="height: calc(100vh - 320px); min-height: 600px;">
        <iframe
          src={data.embedUrl}
          title="PostHog · Tablero KPI DLAB"
          class="absolute inset-0 w-full h-full border-0"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          allow="clipboard-write; fullscreen"
        ></iframe>
      </div>
    {:else}
      <div class="p-10 text-center">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3" style="background: var(--bg-secondary); color: var(--text-muted);">
          <BarChart3 size={20} />
        </div>
        <h2 class="text-base font-semibold text-[--text-primary]">El tablero embebido no está configurado</h2>
        <p class="text-sm text-[--text-muted] mt-2 max-w-md mx-auto">
          Configura <code class="text-xs px-1.5 py-0.5 rounded" style="background: var(--bg-secondary);">POSTHOG_ADMIN_DASHBOARD_EMBED_URL</code>
          en el entorno del servidor SvelteKit para incrustar el dashboard de PostHog en esta vista.
        </p>
        {#if data.publicUrl}
          <a
            href={data.publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 mt-5 text-sm font-medium px-4 py-2 rounded-lg border transition-colors"
            style="border-color: var(--border); color: var(--text-secondary); background: var(--bg-surface);"
          >
            <ExternalLink size={14} /> Abrir en PostHog
          </a>
        {/if}
      </div>
    {/if}
  </section>
</div>
