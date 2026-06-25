<script lang="ts">
  import Navbar from '$lib/components/layout/Navbar.svelte';
  import Footer from '$lib/components/layout/Footer.svelte';

  interface Props {
    data: { user?: any; logo?: string | null };
    children: import('svelte').Snippet;
  }

  let { data, children }: Props = $props();
</script>

<div class="min-h-screen flex flex-col" style="background: var(--bg-secondary); color: var(--text-primary);">
  <Navbar user={null} logo={data.logo} />
  <main class="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 sm:py-12">
    {@render children()}
  </main>
  <Footer />
</div>
