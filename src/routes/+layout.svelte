<script lang="ts">
  import "@skeletonlabs/skeleton/styles/skeleton.css";
  import "@skeletonlabs/skeleton/themes/theme-skeleton.css";
  import "../app.postcss";
  import { getFlash } from "sveltekit-flash-message";
  import { page } from "$app/stores";
  // external imports
  import { AppShell } from "@skeletonlabs/skeleton";
  // internal imports
  import Navbar from "../components/Navbar.svelte";
  import SideBarNav from "../components/SideBarNav.svelte";

  // form data
  export let data;
  export let form;

  export let title = "Fintekkers: Fintech's Infrastructure";


  import { addCollection } from '@iconify/svelte';
  import mdiIcons from '@iconify-json/mdi/icons.json';
  import phIcons from "@iconify-json/ph/icons.json";
  addCollection(mdiIcons);
  addCollection(phIcons);
</script>

<svelte:head>
  <title>{title}</title>
</svelte:head>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<AppShell>
  <SideBarNav />
  <Navbar />

  <slot />
</AppShell>

<style lang="scss">
  @import "../style.scss";
</style>
