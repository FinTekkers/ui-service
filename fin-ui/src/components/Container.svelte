<script lang="ts">
  import { currentMenu } from "../store/store";
  import { menuList } from "../util/Util";
</script>

<!-- conditional render components -->
<div class="p-5 h-full w-screen mainmenu_container">
  {#if $currentMenu == menuList.Home}
    <div>Home</div>
  {:else if $currentMenu == menuList.Dashboard}
    <div>Dashboard</div>
  {:else if $currentMenu == menuList.Portfolio}
    <div>Portfolio</div>
  {:else if $currentMenu == menuList.Account}
    <div>Account</div>
  {:else if $currentMenu == menuList.Logout}
    <div>Goodbye</div>
  {/if}
</div>

<style>
  .mainmenu_container {
    background-color: rgb(59, 51, 95);
  }
</style>
