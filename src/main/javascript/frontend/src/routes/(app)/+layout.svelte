<script lang="ts">
  import Navbar from '$lib/components/layout/Navbar.svelte';
  import Footer from '$lib/components/layout/Footer.svelte';

  interface Props {
    data: { user?: any; logo?: string | null; siteContent?: any };
    children: import('svelte').Snippet;
  }

  let { data, children }: Props = $props();
</script>

<div class="min-h-screen flex flex-col" style="background: var(--bg-primary); color: var(--text-primary);">
  <Navbar user={data.user} logo={data.logo} />
  <main class="flex-1 min-h-0" style="background: var(--bg-secondary);">{@render children()}</main>
  <Footer />
</div>
