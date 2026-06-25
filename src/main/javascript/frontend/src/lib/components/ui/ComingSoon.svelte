<script lang="ts">
  import { Construction } from 'lucide-svelte';
  import Button from './Button.svelte';

  interface Props {
    title: string;
    subtitle: string;
  }

  let { title, subtitle }: Props = $props();
</script>

<div class="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
  <div class="w-16 h-16 bg-[--color-red-light] text-[--color-red] rounded-2xl flex items-center justify-center mb-6">
    <Construction size={28} />
  </div>
  <h1 class="text-3xl font-bold text-[--text-primary]">{title}</h1>
  <p class="text-[--text-muted] mt-3 max-w-md">{subtitle}</p>
  <Button variant="ghost" href="/" label="← Volver al inicio" classes="mt-8" />
</div>