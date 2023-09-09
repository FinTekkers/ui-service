<script lang="ts">
  import SideMenu from "../components/SideMenu.svelte";
  import Container from "../components/Container.svelte";
  import Login from "../components/Login.svelte";
  import { Authentication } from "../store/store";
  import { get } from "svelte/store";
  import { onMount } from "svelte";

  let isLogin: boolean;
  const goto = (url: string) => (window.location.href = url);

  $: {
    isLogin = $Authentication;
  }

  onMount(() => {
    // goto("/Login");
    // if (isLogin) {
    //   goto("/Login");
    // }
  });
</script>

<div class="background_col h-full flex justify-between">
  <!-- {#if isLogin} -->
  <!-- <AppBar>
    <div>
      <h6>FINTEKKERS</h6>
    </div>
  </AppBar>
  <SideMenu />
  <Container /> -->
  <!-- {:else} -->
  <Login />
  <!-- {/if} -->
</div>
