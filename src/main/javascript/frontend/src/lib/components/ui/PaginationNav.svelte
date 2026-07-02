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

  const currentPage = $derived(Math.max(1, Number(meta?.page) || 1));
  const pageSize = $derived(Math.max(1, Number(meta?.limit) || 1));
  const totalItems = $derived(Math.max(0, Number(meta?.total) || 0));
  const totalPages = $derived(Math.max(1, Math.ceil(totalItems / pageSize)));
  const hasPrevious = $derived(currentPage > 1);
  const hasNext = $derived(currentPage < totalPages);
  const startItem = $derived(totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1);
  const endItem = $derived(Math.min(currentPage * pageSize, totalItems));

  const visiblePages = $derived.by(() => {
    const pages = new Set<number>([1, totalPages]);

    for (let page = currentPage - 1; page <= currentPage + 1; page += 1) {
      if (page >= 1 && page <= totalPages) pages.add(page);
    }

    return [...pages].sort((left, right) => left - right);
  });

  function shouldShowGap(current: number, previous?: number) {
    return previous !== undefined && current - previous > 1;
  }
</script>

{#if totalItems > pageSize}
  <nav class="mt-8 flex flex-col gap-4 rounded-xl border border-[--border] bg-surface px-4 py-4 sm:flex-row sm:items-center sm:justify-between" aria-label={`Paginación de ${label.toLowerCase()}`}>
    <p class="text-sm text-[--text-muted]">
      {label}: {startItem}-{endItem} de {totalItems}
    </p>

    <div class="flex flex-wrap items-center gap-2">
      {#if hasPrevious}
        <a
          href={buildHref(currentPage - 1)}
          class="inline-flex items-center rounded-lg border border-[--border] px-3 py-2 text-sm text-[--text-secondary] transition-colors hover:bg-[--bg-secondary]"
          aria-label={`Página anterior de ${label.toLowerCase()}`}
        >
          Anterior
        </a>
      {/if}

      {#each visiblePages as pageNumber, index}
        {#if shouldShowGap(pageNumber, visiblePages[index - 1])}
          <span class="px-1 text-sm text-[--text-muted]" aria-hidden="true">…</span>
        {/if}

        {#if pageNumber === currentPage}
          <span
            class="inline-flex min-w-10 items-center justify-center rounded-lg border border-[--accent] bg-[--accent] px-3 py-2 text-sm font-semibold text-white"
            aria-current="page"
          >
            {pageNumber}
          </span>
        {:else}
          <a
            href={buildHref(pageNumber)}
            class="inline-flex min-w-10 items-center justify-center rounded-lg border border-[--border] px-3 py-2 text-sm text-[--text-secondary] transition-colors hover:bg-[--bg-secondary]"
            aria-label={`Ir a la página ${pageNumber} de ${label.toLowerCase()}`}
          >
            {pageNumber}
          </a>
        {/if}
      {/each}

      {#if hasNext}
        <a
          href={buildHref(currentPage + 1)}
          class="inline-flex items-center rounded-lg border border-[--border] px-3 py-2 text-sm text-[--text-secondary] transition-colors hover:bg-[--bg-secondary]"
          aria-label={`Página siguiente de ${label.toLowerCase()}`}
        >
          Siguiente
        </a>
      {/if}
    </div>
  </nav>
{/if}
