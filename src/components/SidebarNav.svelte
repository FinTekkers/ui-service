<script>
    import { onMount } from 'svelte';
    import {sideBarURLText} from '../lib/uidata'
    import IconLink from "./custom_components/IconLink.svelte";

    let menuOpen = false;

    const toggleMenu = () => {
        menuOpen = !menuOpen;
    };

    const closeMenu = () => {
        menuOpen = false;
    };

    // Optional: Close menu if screen is resized above breakpoint
    onMount(() => {
        const handleResize = () => {
            if (window.innerWidth > 768) {
                closeMenu();
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    });
</script>

<!-- Mobile-only wrapper -->
<div class="mobile-nav">
    <!-- Overlay -->
    {#if menuOpen}
        <div class="fixed inset-0 bg-black/40 z-40" on:click={closeMenu}></div>
    {/if}

    <!-- Slide-in Menu -->
    <div class={`fixed top-0 left-0 h-full w-64 body-cover shadow-lg z-50 transform transition-transform duration-300 ${
      menuOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
        <br/>
        <nav class="p-6 space-y-4">
            <IconLink iconName="mdi:finance" href="/">
                Fintekkers
            </IconLink>
            {#each sideBarURLText as urlText}
                <IconLink iconName={urlText.icon} href="{urlText.url}">{urlText.text}</IconLink>
<!--                    <a href={urlText.url}>{urlText.text}</a>-->

            {/each}
            <IconLink iconName='mdi:alternate-email'  href="/contactus">
                Contact Us
            </IconLink>

<!--            <a href="/" on:click={closeMenu} class="block text-lg">Home</a>-->
<!--            <a href="/data/portfolios" on:click={closeMenu} class="block text-lg">See Data</a>-->
<!--            <a href="/contactus" on:click={closeMenu} class="block text-lg">Contact</a>-->
        </nav>
    </div>

    <!-- Floating Menu Button -->
    <button
            class="menu-button"
            on:click={toggleMenu}
            aria-label="Toggle menu"
    >
        <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
        >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    </button>
</div>

<style lang="scss">
  @import "../style.scss"; // Adjust to your path

  .mobile-nav {
    display: block;

    @media screen and (min-width: $breakingpoint_medium) {
      display: none;
    }
  }

  .menu-button {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    z-index: 50;
    background: black;
    color: white;
    padding: 0.75rem;
    border-radius: 9999px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    cursor: pointer;
  }
</style>
