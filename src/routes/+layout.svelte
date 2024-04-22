<script lang="ts">
  import "@skeletonlabs/skeleton/styles/skeleton.css";
  import "@skeletonlabs/skeleton/themes/theme-skeleton.css";
  import "../app.postcss";
  import { getFlash } from 'sveltekit-flash-message';
  import { page } from '$app/stores';
// external imports
  import { AppShell } from "@skeletonlabs/skeleton";
  // internal imports
  import Navbar from "../components/Navbar.svelte";
  import SideBarNav from "../components/SideBarNav.svelte";
  import { Bar } from '@bobbymannino/svelte-progress';


  // form data
  export let data;
  export let form;


  const flash = getFlash(page);

  $: if ($flash) {
		toast.info($flash.message);
	}

</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<AppShell>
  <SideBarNav />
  <Navbar />
  
  {#if $flash}
  <Bar color="#6D28D9" size="big" speed="fast" />
  {@const bg = $flash.type == 'success' ? '#3D9970' : '#FF4136'}
  <div style:background-color={bg} class="flash">{$flash.message}</div>
  {/if}
  <slot />
</AppShell>

<style lang="scss">
  @import "../style.scss";

</style>
