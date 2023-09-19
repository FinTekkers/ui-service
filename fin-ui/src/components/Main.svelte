<script lang="ts">
  import { currentMenu, goto, Authentication } from "../store/store";
  import { menuList } from "../util/Util";

  const Authenticate = () => {
    Authentication.set(false);
  };
</script>

<!-- conditional render components -->
<div class="p-5 h-full w-screen mainmenu_container">
  {#if $currentMenu == menuList.Home}
    <div class="menu">Home</div>
  {:else if $currentMenu == menuList.Dashboard}
    <div class="menu">Dashboard</div>
  {:else if $currentMenu == menuList.Portfolio}
    <div class="menu">Portfolio</div>
  {:else if $currentMenu == menuList.Account}
    <div class="menu">Account</div>
  {:else if $currentMenu == menuList.Logout}
    <div class="menu">Goodbye</div>
  {/if}
</div>

<style lang="scss">
  @import "../style.scss";
  .mainmenu_container {
    background-color: $white;
    @include flex(column, center, center, 0);

    .menu {
      width: 98%;
      height: 98%;
      padding: 1em;
      border-radius: 5px;
      background-color: $white;
      color: $primary-color;
    }
  }
</style>
