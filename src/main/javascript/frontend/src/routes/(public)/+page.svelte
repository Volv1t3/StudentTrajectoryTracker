<script lang="ts">
  import { Zap, Eye, Target, FolderOpen, UserPlus, HandshakeIcon, TrendingUp } from 'lucide-svelte';
  import { capture } from '$lib/utils/posthog';
  import Button from '$lib/components/ui/Button.svelte';
  import PageHero from '$lib/components/layout/PageHero.svelte';

  interface Content {
    hero_eyebrow?: string;
    hero_title?: string;
    hero_subtitle?: string;
    hero_primary_cta_label?: string;
    hero_secondary_cta_label?: string;
    what_is_dlab_text?: string;
    mission_title?: string;
    vision_text?: string;
    vision_title?: string;
    mission_text?: string;
  }

  interface Props {
    data: { 
      content: Content; 
      missionImage?: string; 
      visionImage?: string;
    };
  }

  let { data }: Props = $props();

  function trackCta(ctaType: 'primary' | 'secondary', destination: string, label: string) {
    capture('landing_cta_clicked', {
      cta_type: ctaType,
      destination,
      cta_label: label,
      route: '/',
      route_group: 'public',
      source: 'frontend'
    });
  }
</script>

<svelte:head>
  <title>DLAB — Development Lab | USFQ</title>
</svelte:head>

<!-- ═══════════════ HERO ═══════════════ -->
<PageHero
  variant="landing"
  title={data.content.hero_title || ''}
  subtitle={data.content.hero_subtitle || 'Construye el futuro desde la universidad.'}
  eyebrow={data.content.hero_eyebrow || 'D.Lab · USFQ'}
>
  <div class="flex flex-col sm:flex-row gap-4 justify-center">
    <Button
      variant="primary"
      size="lg"
      href="/signup"
      label={data.content.hero_primary_cta_label || 'Únete a D.Lab'}
      onclick={() => trackCta('primary', '/signup', data.content.hero_primary_cta_label || 'Únete a D.Lab')}
    />
    <Button
      variant="primary"
      size="lg"
      href="/projects"
      label={data.content.hero_secondary_cta_label || 'Explora proyectos'}
      onclick={() => trackCta('secondary', '/projects', data.content.hero_secondary_cta_label || 'Explora proyectos')}
    />
  </div>
</PageHero>

<!-- ═══════════════ WHAT IS DLAB ═══════════════ -->
<section class="py-20 md:py-28" style="background: var(--bg-primary);">
  <div class="max-w-3xl mx-auto px-4 sm:px-12 lg:px-14 text-center">
    <span class="text-lg uppercase tracking-widest block mb-4" style="color: var(--accent); font-family: var(--font-subheading);">¿Qué es D.Lab?</span>
    <div class="w-12 h-0.5 mx-auto mb-6" style="background: var(--accent); opacity: 0.3;"></div>
    <p class="text-xl md:text-2xl leading-relaxed font-medium" style="color: var(--text-primary);">
      {data.content.what_is_dlab_text || 'D.Lab es el Laboratorio de Investigación aplicada de la USFQ.'}
    </p>
  </div>
</section>

<!-- ═══════════════ MISSION ═══════════════ -->
<section class="py-16 md:py-24" style="background: var(--bg-surface);">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
      <div class="order-2 lg:order-1">
        <span class="text-lg uppercase tracking-widest" style="color: var(--accent); font-family: var(--font-subheading);">Nuestra Misión</span>
        <h2 class="text-3xl md:text-4xl font-bold mt-3 leading-tight" style="color: var(--text-primary);">
          {data.content.mission_title || 'Formar líderes a través de proyectos reales'}
        </h2>
        <div class="w-10 h-0.5 mt-5 mb-5" style="background: var(--accent); opacity: 0.3;"></div>
        <p class="text-base md:text-lg leading-relaxed" style="color: var(--text-secondary);">
          {data.content.mission_text || 'Conectar a estudiantes con proyectos desafiantes que desarrollan habilidades técnicas, trabajo en equipo y pensamiento innovador.'}
        </p>
        <div class="mt-6 mb-6 flex items-center gap-3 text-sm" style="color: var(--text-muted);">
          <HandshakeIcon size={24} style="color: var(--accent);" />
          <span>Proyectos con <b>impacto real</b> en la comunidad</span>
          <TrendingUp size={24} style="color: var(--accent);" />
          <span>Proyectos con <b>posibilidad de crecimiento</b> y <b> viabilidad empresarial</b></span>
        
        </div>
      </div>
      <div class="order-1 lg:order-2 relative aspect-[4/3] rounded-2xl overflow-hidden" style="background: linear-gradient(135deg, var(--accent-light) 0%, color-mix(in srgb, var(--deep) 15%, transparent) 100%);">
        {#if data.missionImage}
          <img src={data.missionImage} alt="Misión del DLAB" class="absolute inset-0 w-2full h-full object-cover" />
        {:else}
          <div class="absolute inset-0 hero-grid opacity-[0.12]"></div>
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-24 h-24 rounded-2xl flex items-center justify-center" style="background: var(--accent); color: white; transform: rotate(-3deg);">
              <Target size={44} />
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</section>

<!-- ═══════════════ VISION ═══════════════ -->
<section class="py-16 md:py-24" style="background: var(--bg-secondary);">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
      <div class="relative aspect-[4/3] rounded-2xl overflow-hidden" style="background: linear-gradient(135deg, color-mix(in srgb, var(--deep) 15%, transparent) 0%, var(--accent-light) 100%);">
        {#if data.visionImage}
          <img src={data.visionImage} alt="Visión del DLAB" class="absolute inset-0 w-full h-full object-cover" />
        {:else}
          <div class="absolute inset-0 hero-grid opacity-[0.12]"></div>
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-24 h-24 rounded-2xl flex items-center justify-center" style="background: var(--accent); color: white; transform: rotate(3deg);">
              <Eye size={44} />
            </div>
          </div>
        {/if}
      </div>
      <div>
        <span class="text-lg uppercase tracking-widest" style="color: var(--accent); font-family: var(--font-subheading);">Nuestra Visión</span>
        <h2 class="text-3xl md:text-4xl font-bold mt-3 leading-tight" style="color: var(--text-primary);">
          {data.content.vision_title || 'Un ecosistema de innovación estudiantil'}
        </h2>
        <div class="w-10 h-0.5 mt-5 mb-5" style="background: var(--accent); opacity: 0.3;"></div>
        <p class="text-base md:text-lg leading-relaxed" style="color: var(--text-secondary);">
          {data.content.vision_text || 'Ser el espacio líder de innovación estudiantil en Ecuador, formando profesionales con experiencia práctica en proyectos de impacto real.'}
        </p>
        <div class="mt-6 flex items-center gap-3 text-sm" style="color: var(--text-muted);">
          <Zap size={16} style="color: var(--accent);" />
          <span>Liderazgo estudiantil con impacto nacional</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ═══════════════ DUAL CTA ═══════════════ -->
<section class="py-16 md:py-24" style="background: var(--bg-surface);">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
    <div class="text-center mb-12">
      <h2 class="text-3xl md:text-4xl font-bold" style="color: var(--color-primary); font-family: var(--font-subheading);">¿Listo para el siguiente paso?</h2>
      <p style="color: var(--color-primary); font-family: var(--font-sans);" class="mt-2">Explora lo que hacemos o forma parte del equipo</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
      <div class="group border-2 rounded-lg p-10 flex flex-col gap-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 cursor-pointer bg-[--text-primary] hover:bg-[--color-red-hover]">
        <div class="w-18 h-14 rounded-xl flex items-center justify-center transition-colors duration-200" style="background: color-mix(in srgb, var(--accent) 20%, transparent); color: var(--accent);">
          <FolderOpen size={26} />
        </div>
        <div>
        <h3 class="text-lg font-subheading text-[--color-text-on-dark]">Explora nuestro registro de proyectos</h3>
          <p class="font-sans text-[--color-text-muted-on-dark] mt-2 leading-relaxed">Descubre en qué estamos trabajando — y en qué hemos trabajado —. Encuentra el proyecto que se alinea con tus habilidades y aplica para participar.</p>
        </div>
        <Button
          variant="primary"
          href='/projects'
          fullWidth
          label="Ver Proyectos"
          onclick={() => trackCta('secondary', '/projects', 'Ver Proyectos')}
        />
      </div>
      <div class="group border-2 rounded-lg p-10 flex flex-col gap-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 cursor-pointer bg-[--text-primary] hover:bg-[--color-red-hover]">
        <div class="w-18 h-14 bg-white/20 text-white rounded-xl flex items-center justify-center" style="background: color-mix(in srgb, var(--accent) 20%, transparent); color: var(--accent);">
          <UserPlus size={26} />
        </div>
        <div>
          <h3 class="text-lg font-subheading text-[--color-text-on-dark]" style="color: var(--color-primary); font-family: var(--font-heading);">Únete a DLAB</h3>
          <p class="font-sans text-[--color-text-muted-on-dark] mt-2 leading-relaxed">Regístrate, expresa tu interés y comienza tu trayectoria como colaborador en nuestros proyectos.</p>
        </div>
        <Button
          variant='primary'
          href='/signup'
          fullWidth
          label='Registrarme'
          classes='mt-6'
          onclick={() => trackCta('primary', '/signup', 'Registrarme')}
        />
      </div>
    </div>
  </div>
</section>
