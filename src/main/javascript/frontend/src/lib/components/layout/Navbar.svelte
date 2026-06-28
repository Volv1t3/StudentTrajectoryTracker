<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { reset as resetAnalytics } from '$lib/utils/posthog';
  import Button from '$lib/components/ui/Button.svelte';
  import ThemeToggle from '$lib/components/ui/ThemeToggle.svelte';
  import { Menu, X, ChevronDown } from 'lucide-svelte';

  interface ColabUser {
    id: number;
    nombres?: string;
    trajectory_status?: string;
  }

  interface NavItem {
    href: string;
    label: string;
    icon?: any;
    exact?: boolean;
  }

  interface ActionButton {
    label: string;
    href?: string;
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
    classes?: string;
  }

  interface DropdownItem {
    href: string;
    label: string;
  }

  interface IdentityConfig {
    label: string;
    avatarText?: string;
    dropdownItems?: DropdownItem[];
    logoutAction: string;
    logoutLabel?: string;
  }

  interface Props {
    user?: ColabUser | null;
    logo?: string | null;
    brandHref?: string;
    brandLabel?: string;
    navItems?: NavItem[];
    anonymousActions?: ActionButton[];
    identity?: IdentityConfig | null;
    containerClass?: string;
    desktopLogoClass?: string;
    mobileLogoClass?: string;
    drawerLogoClass?: string;
    onLogout?: () => void;
  }

  const defaultPublicNavItems: NavItem[] = [
    { href: '/', label: 'Inicio', exact: true },
    { href: '/about-us', label: 'Sobre nosotros' },
    { href: '/why-join-us', label: '¿Por qué unirse?' },
    { href: '/projects', label: 'Proyectos' },
    { href: '/events', label: 'Eventos' },
    { href: '/contact', label: 'Contacto' }
  ];

  const defaultAnonymousActions: ActionButton[] = [
    { label: 'Iniciar sesión', href: '/login', variant: 'ghost' },
    { label: 'Únete al D.Lab', href: '/signup', variant: 'primary' }
  ];

  let {
    user = null,
    logo = null,
    brandHref = '/',
    brandLabel = 'D.Lab',
    navItems = defaultPublicNavItems,
    anonymousActions = defaultAnonymousActions,
    identity = null,
    containerClass = 'max-w-7xl',
    desktopLogoClass = 'h-16 w-auto',
    mobileLogoClass = 'h-14 w-auto max-w-full object-contain',
    drawerLogoClass = 'h-14 w-auto max-w-full object-contain',
    onLogout
  }: Props = $props();

  let menuOpen = $state(false);
  let scrolled = $state(false);
  let userDropOpen = $state(false);
  let collapseNav = $state(false);

  let containerEl: HTMLDivElement | null = null;
  let brandMeasureEl: HTMLDivElement | null = null;
  let navMeasureEl: HTMLDivElement | null = null;
  let actionsMeasureEl: HTMLDivElement | null = null;

  const resolvedIdentity = $derived(
    identity ??
      (user
        ? {
            label: user.nombres || 'Usuario',
            avatarText: (user.nombres || 'U').split(' ')[0].charAt(0),
            dropdownItems: [
              { href: '/profile', label: 'Mi perfil' },
              { href: '/my-applications', label: 'Mis solicitudes' },
              { href: '/my-assignments', label: 'Mis vinculaciones' }
            ],
            logoutAction: '/api/auth/logout',
            logoutLabel: 'Cerrar sesión'
          }
        : null)
  );

  function isActive(item: NavItem): boolean {
    if (item.exact || item.href === '/') return $page.url.pathname === item.href;
    return $page.url.pathname.startsWith(item.href);
  }

  function handleLogout() {
    resetAnalytics();
    onLogout?.();
  }

  function recalculateLayout() {
    if (!containerEl || !brandMeasureEl || !navMeasureEl || !actionsMeasureEl) return;

    const availableWidth = containerEl.clientWidth;
    const requiredWidth =
      brandMeasureEl.offsetWidth +
      navMeasureEl.offsetWidth +
      actionsMeasureEl.offsetWidth +
      64;

    collapseNav = requiredWidth > availableWidth;
  }

  function scheduleLayoutRecalculation() {
    if (typeof window === 'undefined') return;
    requestAnimationFrame(recalculateLayout);
  }

  $effect(() => {
    const handler = () => {
      scrolled = window.scrollY > 8;
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  });

  $effect(() => {
    const handler = () => {
      if (menuOpen) menuOpen = false;
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  });

  $effect(() => {
    $page.url;
    menuOpen = false;
    userDropOpen = false;
    scheduleLayoutRecalculation();
  });

  $effect(() => {
    brandHref;
    brandLabel;
    logo;
    desktopLogoClass;
    mobileLogoClass;
    drawerLogoClass;
    navItems;
    anonymousActions;
    resolvedIdentity?.label;
    resolvedIdentity?.avatarText;
    resolvedIdentity?.dropdownItems?.length;
    scheduleLayoutRecalculation();
  });

  onMount(() => {
    const handleResize = () => scheduleLayoutRecalculation();
    const resizeObserver = new ResizeObserver(handleResize);

    if (containerEl) resizeObserver.observe(containerEl);

    window.addEventListener('resize', handleResize, { passive: true });
    scheduleLayoutRecalculation();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  });
</script>

<nav
  class="sticky top-0 z-40 transition-all duration-300"
  style="background: var(--bg-surface);"
  class:border-b={scrolled}
  class:shadow-sm={scrolled}
  style:border-color={scrolled ? 'var(--border)' : 'transparent'}
>
  <div class={`${containerClass} mx-auto px-4 sm:px-8 lg:px-8`} bind:this={containerEl}>
    <div class="flex items-center justify-between h-16 lg:h-18">
      {#if !collapseNav}
        <div class="flex items-center justify-between w-full gap-6">
          <a href={brandHref} aria-label={brandLabel} class="transition-opacity duration-150 hover:opacity-80 shrink-0">
            {#if logo}
              <img src={logo} alt={`${brandLabel} Logo`} class={desktopLogoClass} />
            {:else}
              <span class="text-xl font-black" style="color: var(--text-primary);">{brandLabel}</span>
            {/if}
          </a>

          <div class="flex items-center gap-6 min-w-0">
            {#each navItems as item}
              {@const NavIcon = item.icon}
              <a
                href={item.href}
                class="nav-link text-md font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap"
                class:text-[--accent]={isActive(item)}
                class:text-[--text-secondary]={!isActive(item)}
              >
                {#if NavIcon}<NavIcon size={14} />{/if}
                {item.label}
              </a>
            {/each}
          </div>

          <div class="flex items-center gap-3 shrink-0">
            <ThemeToggle />
            {#if !resolvedIdentity}
              {#each anonymousActions as action}
                <Button
                  variant={action.variant ?? 'ghost'}
                  size="sm"
                  label={action.label}
                  href={action.href}
                  classes={action.classes ?? ''}
                />
              {/each}
            {:else if resolvedIdentity.dropdownItems?.length}
              <div class="relative">
                <button
                  onclick={() => userDropOpen = !userDropOpen}
                  class="flex items-center gap-2 text-sm font-medium cursor-pointer rounded-lg px-3 py-2 transition-colors"
                  style="color: var(--text-secondary); font-family: var(--font-subheading);"
                >
                  <div class="w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center" style="background: var(--accent); color: var(--color-text-on-dark);">
                    {(resolvedIdentity.avatarText || resolvedIdentity.label || 'U').charAt(0)}
                  </div>
                  {resolvedIdentity.label}
                  <ChevronDown size={14} style="color: var(--text-muted);" />
                </button>
                {#if userDropOpen}
                  <button type="button" class="fixed inset-0 z-40" onclick={() => userDropOpen = false} aria-label="Cerrar menú"></button>
                  <div class="absolute right-0 top-full mt-1 w-44 rounded-xl border shadow-lg z-50 overflow-hidden" style="background: var(--bg-surface); border-color: var(--border);">
                    {#each resolvedIdentity.dropdownItems as item}
                      <a href={item.href} class="flex items-center gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-[--bg-secondary]" style="color: var(--text-secondary);">
                        {item.label}
                      </a>
                    {/each}
                    <div class="border-t" style="border-color: var(--border);"></div>
                    <form method="POST" action={resolvedIdentity.logoutAction} onsubmit={handleLogout}>
                      <button type="submit" class="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-[--bg-secondary]" style="color: var(--color-red);">
                        {resolvedIdentity.logoutLabel || 'Cerrar sesión'}
                      </button>
                    </form>
                  </div>
                {/if}
              </div>
            {:else}
              <span class="text-sm font-medium px-3 py-2 whitespace-nowrap" style="color: var(--text-secondary); font-family: var(--font-subheading);">
                {resolvedIdentity.label}
              </span>
              <form method="POST" action={resolvedIdentity.logoutAction} class="inline" onsubmit={handleLogout}>
                <button type="submit" class="text-sm font-medium px-3 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap" style="color: var(--color-red);">
                  {resolvedIdentity.logoutLabel || 'Cerrar sesión'}
                </button>
              </form>
            {/if}
          </div>
        </div>
      {:else}
        <div class="flex items-center justify-between w-full gap-3">
          <a href={brandHref} aria-label={brandLabel} class="transition-opacity duration-150 hover:opacity-80 flex items-center min-w-0">
            {#if logo}
              <img src={logo} alt={`${brandLabel} Logo`} class={mobileLogoClass} />
            {:else}
              <span class="text-lg font-black truncate" style="color: var(--text-primary);">{brandLabel}</span>
            {/if}
          </a>

          <div class="flex items-center gap-2 shrink-0">
            <ThemeToggle iconSize={16} buttonClass="p-1.5 rounded-lg transition-colors cursor-pointer" />
            <button
              onclick={() => menuOpen = !menuOpen}
              aria-label="Menú"
              aria-expanded={menuOpen}
              class="flex items-center p-2 rounded-lg transition-colors"
              style="color: var(--text-secondary);"
            >
              {#if menuOpen}
                <X size={20} />
              {:else}
                <Menu size={20} />
              {/if}
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <div class="absolute -left-[9999px] top-0 invisible pointer-events-none whitespace-nowrap">
    <div bind:this={brandMeasureEl} class="inline-flex items-center">
      {#if logo}
        <img src={logo} alt={`${brandLabel} Logo`} class={desktopLogoClass} />
      {:else}
        <span class="text-xl font-black">{brandLabel}</span>
      {/if}
    </div>

    <div bind:this={navMeasureEl} class="inline-flex items-center gap-6 ml-6">
      {#each navItems as item}
        <span class="text-md font-medium inline-flex items-center gap-1.5 whitespace-nowrap">
          {#if item.icon}
            {@const HiddenIcon = item.icon}
            <HiddenIcon size={14} />
          {/if}
          {item.label}
        </span>
      {/each}
    </div>

    <div bind:this={actionsMeasureEl} class="inline-flex items-center gap-3 ml-6">
      <div class="w-10 h-10"></div>
      {#if !resolvedIdentity}
        {#each anonymousActions as action}
          <span class="text-sm font-medium whitespace-nowrap px-3 py-2">{action.label}</span>
        {/each}
      {:else if resolvedIdentity.dropdownItems?.length}
        <span class="text-sm font-medium inline-flex items-center gap-2 whitespace-nowrap px-3 py-2">
          <span class="w-7 h-7 rounded-full"></span>
          {resolvedIdentity.label}
        </span>
      {:else}
        <span class="text-sm font-medium whitespace-nowrap px-3 py-2">{resolvedIdentity.label}</span>
        <span class="text-sm font-medium whitespace-nowrap px-3 py-2">{resolvedIdentity.logoutLabel || 'Cerrar sesión'}</span>
      {/if}
    </div>
  </div>

  {#if collapseNav && menuOpen}
    <button type="button" class="fixed inset-0 z-40" style="background: color-mix(in srgb, var(--bg-primary) 45%, transparent);" onclick={() => menuOpen = false} aria-label="Cerrar menú"></button>
    <div class="fixed top-0 right-0 h-dvh w-[85vw] max-w-80 z-50 flex flex-col shadow-2xl transition-transform duration-300 overflow-y-auto" class:translate-x-0={menuOpen} class:translate-x-full={!menuOpen} style="background: var(--bg-surface);">
      <div class="flex items-center justify-between p-5 border-b" style="border-color: var(--border);">
        {#if logo}
          <img src={logo} alt={`${brandLabel} Logo`} class={drawerLogoClass} />
        {:else}
          <span class="text-lg font-black" style="color: var(--text-primary);">{brandLabel}</span>
        {/if}
        <div class="flex items-center gap-2">
          <ThemeToggle iconSize={16} buttonClass="p-1.5 rounded-lg transition-colors cursor-pointer" />
          <button onclick={() => menuOpen = false} class="p-1.5 rounded-lg" style="color: var(--text-secondary);">
            <X size={18} />
          </button>
        </div>
      </div>

      <nav class="flex-1 overflow-y-auto p-4 space-y-1">
        {#each navItems as item}
          {@const NavIcon = item.icon}
          <a
            href={item.href}
            class="drawer-link flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors"
            style="color: var(--text-secondary); font-family: var(--font-subheading);"
            class:text-[--accent]={isActive(item)}
          >
            {#if NavIcon}<NavIcon size={16} />{/if}
            {item.label}
          </a>
        {/each}
      </nav>

      <div class="p-4 border-t space-y-2" style="border-color: var(--border); font-family: var(--font-subheading);">
        {#if !resolvedIdentity}
          {#each anonymousActions as action}
            <Button
              variant={action.variant ?? 'outline'}
              href={action.href}
              fullWidth
              label={action.label}
              classes={action.classes ?? 'font-subheading'}
            />
          {/each}
        {:else if resolvedIdentity.dropdownItems?.length}
          {#each resolvedIdentity.dropdownItems as item}
            <Button variant="primary" href={item.href} fullWidth label={item.label} />
          {/each}
          <form method="POST" action={resolvedIdentity.logoutAction} onsubmit={handleLogout}>
            <Button variant="primary" fullWidth label={resolvedIdentity.logoutLabel || 'Cerrar sesión'} type="submit" />
          </form>
        {:else}
          <div class="px-4 py-2 text-sm font-medium" style="color: var(--text-secondary);">
            {resolvedIdentity.label}
          </div>
          <form method="POST" action={resolvedIdentity.logoutAction} onsubmit={handleLogout}>
            <Button variant="primary" fullWidth label={resolvedIdentity.logoutLabel || 'Cerrar sesión'} type="submit" />
          </form>
        {/if}
      </div>
    </div>
  {/if}
</nav>
