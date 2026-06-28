<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import PageHero from '$lib/components/layout/PageHero.svelte';
  import { resolveIcon } from '$lib/utils/icons';
  import type { ValueProposition, ParticipationStep } from '$lib/types/cms';

  interface Props {
    data: {
      content?: { why_join_hero_subtitle?: string };
      valuePropositions: ValueProposition[];
      participationSteps: ParticipationStep[];
    };
  }

  let { data }: Props = $props();
</script>

<svelte:head>
  <title>¿Por qué unirse? — DLAB</title>
</svelte:head>

<PageHero
  title="¿Por qué unirte a DLAB?"
  subtitle={data.content?.why_join_hero_subtitle || 'Conecta con oportunidades de aprendizaje aplicado y trabajo interdisciplinario.'}
  eyebrow="Quiénes somos"
/>
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

<!-- How to participate -->
<section class="bg-[--bg-secondary] py-16 md:py-24">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-12">
      <span class="text-lg uppercase tracking-widest block mb-4" style="color: var(--accent); font-family: var(--font-subheading);">¿Cómo participar?</span>
      <div class="w-12 h-0.5 mx-auto mb-6" style="background: var(--accent); opacity: 0.3;"></div>
    </div>

    <div class="space-y-8">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {#each data.participationSteps as step, index (step.id)}
          <article class="relative rounded-xl border border-[--border] bg-surface p-5">
            <div class="h-1 w-full rounded-full bg-[--color-red-light] mb-4" class:bg-[--accent]={index === 0}></div>
            <div class="flex items-center gap-3 mb-3">
              <div class="w-16 h-16 rounded-full flex items-center justify-center text-md font-semibold bg-[--accent] text-[--text-primary] mt-4 mb-4" style="font-family: var(--font-mono)">
                {step.step_number}
              </div>
              <h4 class="font-semibold text-[--text-heading] text-xl" style="font-family: var(--font-subheading);">{step.title}</h4>
            </div>
            <div class="w-full h-0.5 mx-auto mb-6" style="background: var(--accent); opacity: 0.3;"></div>
            <p class="text-md text-justify text-[--text-secondary] leading-relaxed" style="font-family: var(--font-sans);">{@html step.description}</p>
          </article>
        {/each}
      </div>

    </div>
  </div>
</section>

<!-- CTA -->
<section class="bg-[--bg] py-16 md:py-20" style="background-color: var(--bg-surface);">
  <div class="max-w-2xl mx-auto px-4 text-center">
    <h2 class="text-3xl font-bold text-[color-primary]" style="color: var(--color-primary);">Únete ahora</h2>
    <p class="text-[--color-text-muted-on-dark] mt-3">Registra tu interés y comienza tu trayectoria.</p>
    <Button variant="primary" href="/signup" label="Quiero unirme →" size="lg" classes="mt-6" />
  </div>
</section>