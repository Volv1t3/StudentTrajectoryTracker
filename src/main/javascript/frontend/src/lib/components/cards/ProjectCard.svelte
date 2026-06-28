<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import StatusBadge from '$lib/components/ui/StatusBadge.svelte';
  import MetaChip from '$lib/components/ui/MetaChip.svelte';
  import SkillTag from '$lib/components/ui/SkillTag.svelte';
  import InfoRow from '$lib/components/ui/InfoRow.svelte';

  interface Project {
    id: number;
    nombre: string;
    slug: string;
    estado: string;
    categoria: string;
    categorias?: string[];
    descripcion_corta: string;
    duracion_semanal: string | null;
    modalidad: string;
    habilidades_requeridas: string[];
    required_skill_items?: { id: number; name: string; slug: string }[];
    current_collaborator_count: number;
    max_collaborators: number | null;
  }

  interface Props {
    project: Project;
  }

  let { project }: Props = $props();
</script>

<article class="rounded-xl border border-[--border] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden h-full" style="background: var(--bg-surface);">
  <div class="p-6 flex flex-col flex-1">
    <div class="flex items-center justify-between gap-2 mb-3">
      <StatusBadge status={project.estado} />
    </div>
    {#if (project.categorias ?? []).length > 0}
      <div class="flex flex-wrap gap-1.5 mb-3">
        {#each project.categorias ?? [] as categoria}
          <span class="text-md bg-white/20 px-2 py-0.5 rounded-full font-heading">{categoria}</span>
        {/each}
      </div>
    {/if}
    <h3 class="text-base font-bold text-[--text-primary] leading-snug">{project.nombre}</h3>
    <p class="text-sm text-[--text-secondary] mt-1.5 line-clamp-3 flex-1">{@html project.descripcion_corta}</p>
    <div class="flex flex-wrap gap-2 mt-4">
      {#if project.duracion_semanal}
        <MetaChip icon="Clock" value={project.duracion_semanal} />
      {/if}
      <MetaChip icon="MapPin" value={project.modalidad} />
    </div>
    <div class="mt-3">
      <InfoRow
        icon="Users"
        label="Registrados / Cupo total"
        value={project.max_collaborators !== null ? `${project.current_collaborator_count} / ${project.max_collaborators}` : `${project.current_collaborator_count} / Sin cupo definido`}
      />
    </div>
    {#if (project.habilidades_requeridas ?? []).length > 0}
      <div class="flex flex-wrap gap-1.5 mt-3">
        {#each (project.habilidades_requeridas ?? []).slice(0, 3) as skill}
          <SkillTag label={skill} />
        {/each}
        {#if (project.habilidades_requeridas ?? []).length > 3}
          <span class="text-xs text-[--text-muted]">+{(project.habilidades_requeridas ?? []).length - 3} más</span>
        {/if}
      </div>
    {/if}
    <footer class="mt-4 pt-4 border-t border-[--border]">
      <Button variant="outline" size="sm" href={`/projects/${project.slug}`} label="Ver proyecto" fullWidth />
    </footer>
  </div>
</article>
