<script lang="ts">
  interface Props {
    status: string;
  }

  let { status }: Props = $props();

  const statusMap: Record<string, { bg: string; text: string; label: string }> = {
    nuevo: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Nuevo' },
    Nuevo: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Nuevo' },
    en_revision: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'En revisión' },
    'En_Revisión': { bg: 'bg-yellow-100', text: 'text-blue-700', label: 'En revisión' },
    aprobado: { bg: 'bg-green-100', text: 'text-green-700', label: 'Aprobado' },
    Contactado: { bg: 'bg-green-100', text: 'text-green-700', label: 'Contactado' },
    contactado: { bg: 'bg-green-100', text: 'text-green-700', label: 'Contactado' },
    activo: { bg: 'bg-green-100', text: 'text-blue-700', label: 'Activo' },
    vinculado: { bg: 'bg-purple-100', text: 'text-cyan-700', label: 'Vinculado' },
    Vinculado: { bg: 'bg-purple-100', text: 'text-cyan-700', label: 'Vinculado' },
    inactivo: { bg: 'bg-[--bg-secondary]', text: 'text-[--text-muted]', label: 'Inactivo' },
    Inactivo: { bg: 'bg-[--bg-secondary]', text: 'text-[--text-muted]', label: 'Inactivo' },
    pendiente: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pendiente' },
    Pendiente: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pendiente' },
    Retirada: { bg: 'bg-[--bg-secondary]', text: 'text-[--text-muted]', label: 'Retirada' },
    retirada: { bg: 'bg-[--bg-secondary]', text: 'text-[--text-muted]', label: 'Retirada' },
    aprobada: { bg: 'bg-green-100', text: 'text-green-700', label: 'Aprobada' },
    Aprobada: { bg: 'bg-green-100', text: 'text-green-700', label: 'Aprobada' },
    rechazada: { bg: 'bg-red-100', text: 'text-red-600', label: 'Rechazada' },
    Rechazada: { bg: 'bg-red-100', text: 'text-red-600', label: 'Rechazada' },
    'En revisión': { bg: 'bg-yellow-100', text: 'text-blue-700', label: 'En revisión' },
    activo_proj: { bg: 'bg-green-100', text: 'text-blue-700', label: 'Activo' },
    pausado: { bg: 'bg-yellow-100', text: 'text-gray-700', label: 'Pausado' },
    Pausado: { bg: 'bg-yellow-100', text: 'text-gray-700', label: 'Pausado' },
    Finalizado: { bg: 'bg-[--bg-secondary]', text: 'text-[--text-secondary]', label: 'Finalizado' },
    finalizado: { bg: 'bg-[--bg-secondary]', text: 'text-[--text-secondary]', label: 'Finalizado' },
    Removido: { bg: 'bg-red-100', text: 'text-red-600', label: 'Removido' },
    removido: { bg: 'bg-red-100', text: 'text-red-600', label: 'Removido' },
    cerrado: { bg: 'bg-[--bg-secondary]', text: 'text-[--text-muted]', label: 'Cerrado' },
    borrador: { bg: 'bg-[--bg-secondary]', text: 'text-[--text-secondary]', label: 'Borrador' },
    en_revision_app: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'En revisión' },
    'Activo': { bg: 'bg-green-100', text: 'text-blue-700', label: 'Activo' },
    archivado: { bg: 'bg-[--bg-secondary]', text: 'text-[--text-muted]', label: 'Archivado' },
    completada: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completada' },
    suspendida: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Suspendida' }
  };

  let config = $derived(statusMap[status] || { bg: 'bg-[--bg-secondary]', text: 'text-[--text-muted]', label: status });
</script>

<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold  {config.text}" style="background-color: var(--bg-primary);">
  {config.label}
</span>
