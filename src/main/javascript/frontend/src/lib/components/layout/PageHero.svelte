<script lang="ts">
  import SpiralBackground from './SpiralBackground.svelte';
  import SafeRichText from '$lib/components/ui/SafeRichText.svelte';

  interface Props {
    title: string;
    subtitle?: string;
    eyebrow?: string;
    variant?: 'default' | 'landing';
    children?: import('svelte').Snippet;
  }

  let { title, subtitle = '', eyebrow = '', variant = 'default', children }: Props = $props();

  const subtitleClassName = $derived(
    [
      'mt-4 sm:mt-5 p-5 max-w-3xl leading-relaxed font-light text-[--color-text-muted-on-dark] break-words text-sm sm:text-base',
      variant === 'landing' ? 'md:text-lg lg:text-xl' : '',
    ].filter(Boolean).join(' ')
  );
</script>

<section
  class="relative flex flex-col justify-center overflow-hidden"
  class:min-h-[78vh]={variant === 'landing'}
  class:sm:min-h-[84vh]={variant === 'landing'}
  class:lg:min-h-[90vh]={variant === 'landing'}
  class:py-16={variant === 'default'}
  class:sm:py-20={variant === 'default'}
  class:lg:py-24={variant === 'default'}
  class:py-24={variant === 'landing'}
  class:sm:py-28={variant === 'landing'}
  class:lg:py-36={variant === 'landing'}
  style="background: var(--light);"
>
  <SpiralBackground />
  <div class="absolute inset-0 pointer-events-none" style="background: linear-gradient(to bottom, color-mix(in srgb, var(--deep) 45%, transparent), transparent, color-mix(in srgb, var(--deep) 65%, transparent));"></div>

  <div class="absolute top-6 left-6 w-5 h-5 sm:top-8 sm:left-8 sm:w-7 sm:h-7 lg:top-10 lg:left-10 lg:w-10 lg:h-10 border-t-2 border-l-2 opacity-40 z-20" style="border-color: var(--border);"></div>
  <div class="absolute top-6 right-6 w-5 h-5 sm:top-8 sm:right-8 sm:w-7 sm:h-7 lg:top-10 lg:right-10 lg:w-10 lg:h-10 border-t-2 border-r-2 opacity-40 z-20" style="border-color: var(--border);"></div>
  <div class="absolute bottom-6 left-6 w-5 h-5 sm:left-8 sm:w-7 sm:h-7 lg:left-10 lg:w-10 lg:h-10 border-b-2 border-l-2 opacity-40 z-20" style="border-color: var(--border);"></div>
  <div class="absolute bottom-6 right-6 w-5 h-5 sm:right-8 sm:w-7 sm:h-7 lg:right-10 lg:w-10 lg:h-10 border-b-2 border-r-2 opacity-40 z-20" style="border-color: var(--border);"></div>

  <div class="relative z-10 max-w-7xl mx-auto  sm:px-6 lg:px-8 flex flex-col items-center text-center">
    {#if eyebrow}
      <span class="inline-flex items-center gap-2 text-[--accent] text-[0.65rem] sm:text-xs font-mono uppercase tracking-[0.2em] mb-4 sm:mb-5 opacity-90">
        <span class="w-4 h-px" style="background: color-mix(in srgb, var(--accent) 60%, transparent);"></span>
        {eyebrow}
        <span class="w-4 h-px" style="background: color-mix(in srgb, var(--accent) 60%, transparent);"></span>
      </span>
    {/if}

    <h1
      class="text-[--color-text-on-dark] leading-tight tracking-tight font-black break-words w-full text-xl sm:text-2xl"
  
      class:md:text-4xl={variant === 'default'}
      class:md:text-2xl={variant === 'landing'}
      class:lg:text-3xl={variant === 'landing' || variant === 'default'}
      class:xl:text-5xl={variant === 'landing'}
    >
      {title}
    </h1>

    {#if subtitle}
      <SafeRichText
        html={subtitle}
        as="div"
        class={subtitleClassName}
      />
    {/if}

    {#if children}
      <div class="mt-7 sm:mt-8 w-full flex justify-center">
        {@render children()}
      </div>
    {/if}
  </div>

  {#if variant === 'landing'}
    <div class="absolute right-5 top-1/2 -translate-y-1/2 z-20 hidden lg:flex flex-col gap-[3px]">
      {#each Array(6) as _}
        <div class="w-[2px] h-[2px] rounded-full" style="background: var(--border);"></div>
      {/each}
    </div>
  {/if}
</section>
