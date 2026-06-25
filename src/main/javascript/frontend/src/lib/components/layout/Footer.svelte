<script lang="ts">

  interface Props {
    content?: {
      footer_tagline?: string;
      social_instagram?: string;
      social_usfq?: string;
      contact_email?: string;
      contact_location?: string;
    };
  }

  let { content = {} }: Props = $props();
</script>

<footer class="mt-auto" style="background: var(--bg-surface); color: var(--color-primary);">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
      <!-- Brand -->
      <div>
      <h3 class="text-xs font-semibold uppercase tracking-widest text-[--color-text-muted-on-dark] mb-4">Encuentranos en nuestras redes sociales</h3>
        <p class="text-xl font-black mb-2">D.Lab USFQ</p>
        <div class="flex gap-3 mt-4">
          {#if content.social_instagram}
            <a href={content.social_instagram} target="_blank" aria-label="Instagram" class="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:opacity-90" style="background: color-mix(in srgb, var(--color-text-on-dark) 12%, transparent);">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </a>
          {/if}
          {#if content.social_usfq}
            <a href={content.social_usfq} target="_blank" aria-label=" Sitio Oficial USFQ" class="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:opacity-90" style="background: color-mix(in srgb, var(--color-text-on-dark) 12%, transparent);">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            </a>
          {/if}
        </div>
      </div>

      <!-- Navigation -->
      <div>
        <h3 class="text-xs font-semibold uppercase tracking-widest text-[--color-text-muted-on-dark] mb-4">Navegación</h3>
        <ul class="space-y-2 text-sm text-[--color-text-muted-on-dark]">
          <li><a href="/about-us" class="transition-colors hover:text-[--accent]">Sobre nosotros</a></li>
          <li><a href="/why-join-us" class="transition-colors hover:text-[--accent]">¿Por qué unirse?</a></li>
          <li><a href="/projects" class="transition-colors hover:text-[--accent]">Proyectos</a></li>
          <li><a href="/events" class="transition-colors hover:text-[--accent]">Eventos</a></li>
          <li><a href="/contact" class="transition-colors hover:text-[--accent]">Contacto</a></li>
        </ul>
      </div>
    </div>

    <div class="mt-10 pt-6 border-t flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-[--color-text-muted-on-dark]" style="border-color: color-mix(in srgb, var(--color-text-on-dark) 14%, transparent);">
      <span>© {new Date().getFullYear()} DLAB — USFQ. Todos los derechos reservados.</span>
    </div>
  </div>
</footer>