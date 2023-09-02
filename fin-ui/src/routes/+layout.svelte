<script lang="ts">
  // The ordering of these imports is critical to your app working properly
  import "@skeletonlabs/skeleton/themes/theme-skeleton.css";
  // If you have source.organizeImports set to true in VSCode, then it will auto change this ordering
  import "@skeletonlabs/skeleton/styles/skeleton.css";
  // Most of your app wide CSS should be put in this file
  import "../app.postcss";
  import { AppBar, AppShell } from "@skeletonlabs/skeleton";
  import SideMenu from "../components/SideMenu.svelte";
</script>

<AppShell>
  <svelte:fragment slot="header">
    <AppBar>
      <div>
        <h6>FINTEKKERS</h6>
      </div>
    </AppBar>
  </svelte:fragment>
  <slot />
</AppShell>
