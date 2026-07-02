<script lang="ts">
  interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
  }

  interface Props {
    meta: PaginationMeta;
    buildHref: (page: number) => string;
    label?: string;
  }

  let { meta, buildHref, label = 'Resultados' }: Props = $props();

  const currentPage = $derived(Math.max(1, Number(meta?.page || 1)));
  const totalPages = $derived(Math.max(1, Math.ceil(Number(meta?.total || 0) / Math.max(1, Number(meta?.limit || 1)))));
  const startItem = $derived(meta.total === 0 ? 0 : (currentPage - 1) * meta.limit + 1);
  const endItem = $derived(meta.total === 0 ? 0 : Math.min(meta.total, currentPage * meta.limit));

  function getVisiblePages(page: number, pages: number): Array<number | 'ellipsis'> {
    if (pages <= 7) return Array.from({ length: pages }, (_, index) => index + 1);

    if (page <= 4) return [1, 2, 3, 4, 5, 'ellipsis', pages];
    if (page >= pages - 3) return [1, 'ellipsis', pages - 4, pages - 3, pages - 2, pages - 1, pages];
    return [1, 'ellipsis', page - 1, page, page + 1, 'ellipsis', pages];
  }

  const visiblePages = $derived(getVisiblePages(currentPage, totalPages));
</script>

{#if meta.total > 0 && totalPages > 1}
  <nav class="mt-10 flex flex-col gap-4 border-t border-[--border] pt-6 sm:flex-row sm:items-center sm:justify-between" aria-label={`Paginación de ${label.toLowerCase()}`}>
    <p class="text-sm text-[--text-muted]">
      {label} {startItem}-{endItem} de {meta.total}
    </p>

    <div class="flex flex-wrap items-center gap-2">
      <a
        href={currentPage > 1 ? buildHref(currentPage - 1) : undefined}
        aria-disabled={currentPage <= 1}
        class={`rounded-lg border px-3 py-2 text-sm transition-colors ${
          currentPage <= 1
            ? 'pointer-events-none border-[--border] text-[--text-muted] opacity-50'
            : 'border-[--border] bg-surface text-[--text-primary] hover:border-[--color-red] hover:text-[--color-red]'
        }`}
      >
        Anterior
      </a>

      {#each visiblePages as pageItem}
        {#if pageItem === 'ellipsis'}
          <span class="px-2 text-sm text-[--text-muted]">…</span>
        {:else}
          <a
            href={buildHref(pageItem)}
            aria-current={pageItem === currentPage ? 'page' : undefined}
            class={`min-w-10 rounded-lg border px-3 py-2 text-center text-sm transition-colors ${
              pageItem === currentPage
                ? 'border-[--color-red] bg-[--color-red] text-white'
                : 'border-[--border] bg-surface text-[--text-primary] hover:border-[--color-red] hover:text-[--color-red]'
            }`}
          >
            {pageItem}
          </a>
        {/if}
      {/each}

      <a
        href={currentPage < totalPages ? buildHref(currentPage + 1) : undefined}
        aria-disabled={currentPage >= totalPages}
        class={`rounded-lg border px-3 py-2 text-sm transition-colors ${
          currentPage >= totalPages
            ? 'pointer-events-none border-[--border] text-[--text-muted] opacity-50'
            : 'border-[--border] bg-surface text-[--text-primary] hover:border-[--color-red] hover:text-[--color-red]'
        }`}
      >
        Siguiente
      </a>
    </div>
  </nav>
{/if}
