<script lang="ts">
  import { Zap, Eye, Target, HandshakeIcon, TrendingUp } from 'lucide-svelte';
  import PageHero from '$lib/components/layout/PageHero.svelte';
  import { resolveIcon } from '$lib/utils/icons';
  import type { ValueProposition } from '$lib/types/cms';

  interface Content {
    about_hero_subtitle?: string;
    identity_text?: string;
    mission_title?: string;
    vision_text?: string;
    vision_title?: string;
    mission_text?: string;
  }

  interface Props {
    data: {
      content: Content;
      valuePropositions: ValueProposition[];
      missionImage?: string;
      visionImage?: string;
    };
  }

  let { data }: Props = $props();
</script>

<svelte:head>
  <title>Sobre nosotros — DLAB</title>
</svelte:head>

<PageHero
  title="Sobre nosotros"
  subtitle={data.content.about_hero_subtitle || ''}
  eyebrow="Quiénes somos"
/>

<section class="py-20 md:py-28" style="background: var(--bg-primary);">
  <div class="max-w-3xl mx-auto px-4 sm:px-12 lg:px-14 text-center">
    <span class="text-lg uppercase tracking-widest block mb-4" style="color: var(--accent); font-family: var(--font-subheading);">¿Qué es D.Lab?</span>
    <div class="w-12 h-0.5 mx-auto mb-6" style="background: var(--accent); opacity: 0.3;"></div>
    <p class="text-xl md:text-2xl leading-relaxed font-medium" style="color: var(--text-primary);">
      {@html data.content.identity_text || 'D.Lab es el Laboratorio de Investigación aplicada de la USFQ.'}
    </p>
  </div>
</section>

<section class="py-16 md:py-24" style="background: var(--bg-surface);">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
      <div class="order-2 lg:order-1">
        <span class="text-lg uppercase tracking-widest" style="color: var(--accent); font-family: var(--font-subheading);">Nuestra Visión</span>
        <h2 class="text-3xl md:text-4xl font-bold mt-3 leading-tight" style="color: var(--text-primary);">
          {data.content.vision_title || 'Un ecosistema de innovación estudiantil'}
        </h2>
        <div class="w-10 h-0.5 mt-5 mb-5" style="background: var(--accent); opacity: 0.3;"></div>
        <p class="text-base md:text-lg leading-relaxed" style="color: var(--text-secondary);">
          {@html data.content.vision_text || 'Ser el espacio líder de innovación estudiantil en Ecuador, formando profesionales con experiencia práctica en proyectos de impacto real.'}
        </p>

      </div>
      <div class="order-1 lg:order-2 relative aspect-[4/3] rounded-2xl overflow-hidden" style="background: linear-gradient(135deg, color-mix(in srgb, var(--deep) 15%, transparent) 0%, var(--accent-light) 100%);">
        {#if data.visionImage}
          <img src={data.visionImage} alt="Visión del DLAB" class="absolute inset-0 w-full h-full object-cover" />
        {:else}
          <div class="absolute inset-0 hero-grid opacity-[0.12]"></div>
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-24 h-24 rounded-2xl flex items-center justify-center" style="background: var(--accent); color: var(--color-text-on-dark); transform: rotate(3deg);">
              <Eye size={44} />
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</section>

<section class="py-16 md:py-24" style="background: var(--bg-secondary);">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
      <div class="order-2">
        <span class="text-lg uppercase tracking-widest" style="color: var(--accent); font-family: var(--font-subheading);">Nuestra Misión</span>
        <h2 class="text-3xl md:text-4xl font-bold mt-3 leading-tight" style="color: var(--text-primary);">
          {data.content.mission_title || 'Formar líderes a través de proyectos reales'}
        </h2>
        <div class="w-10 h-0.5 mt-5 mb-5" style="background: var(--accent); opacity: 0.3;"></div>
        <p class="text-base md:text-lg leading-relaxed" style="color: var(--text-secondary);">
          {@html data.content.mission_text || 'Conectar a estudiantes con proyectos desafiantes que desarrollan habilidades técnicas, trabajo en equipo y pensamiento innovador.'}
        </p>
      </div>
      <div class="order-1 relative aspect-[4/3] rounded-2xl overflow-hidden" style="background: linear-gradient(135deg, var(--accent-light) 0%, color-mix(in srgb, var(--deep) 15%, transparent) 100%);">
        {#if data.missionImage}
          <img src={data.missionImage} alt="Misión del DLAB" class="absolute inset-0 w-full h-full object-cover" />
        {:else}
          <div class="absolute inset-0 hero-grid opacity-[0.12]"></div>
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-24 h-24 rounded-2xl flex items-center justify-center" style="background: var(--accent); color: var(--color-text-on-dark); transform: rotate(-3deg);">
              <Target size={44} />
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</section>

<section class="py-16 md:py-24" style="background: var(--bg-surface);">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-12">
      <span class="text-lg uppercase tracking-widest block mb-4" style="color: var(--accent); font-family: var(--font-subheading);">Beneficios al Unirte</span>
      <div class="w-12 h-0.5 mx-auto mb-6" style="background: var(--accent); opacity: 0.3;"></div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-5">
      {#each data.valuePropositions as vp, i (vp.id)}
        <article class={`btn-grid border-2 p-10 bg-[--text-primary] hover:bg-[--color-red-hover] text-md font-subheading rounded-lg transition-all duration-200 hover:-translate-y-0.5
        hover:shadow-md active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-red] focus-visible:ring-offset-2 ${i % 5 === 0 ? 'md:col-span-6 lg:col-span-7' : i % 5 === 1 ? 'md:col-span-3 lg:col-span-5' : i % 5 === 2 ? 'md:col-span-3 lg:col-span-4' : i % 5 === 3 ? 'md:col-span-6 lg:col-span-8' : 'md:col-span-6 lg:col-span-4'}`}>
          {#if resolveIcon(vp.icon_identifier)}
            <svelte:component this={resolveIcon(vp.icon_identifier)} size={32} class="text-black mb-3" />
          {/if}
          <h3 class="text-lg font-subheading" style="color: var(--color-primary); font-weight: bold;">{vp.title}</h3>
          <p class="text-sm mt-2 leading-relaxed" style="color: var(--color-primary); font-family: var(--font-sans);">{@html vp.description}</p>
        </article>
      {/each}
    </div>
  </div>
</section>
