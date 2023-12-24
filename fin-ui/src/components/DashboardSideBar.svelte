<script lang="ts">
  // external exports
  import Icon from "@iconify/svelte";
  import {selectedDashboardMenu} from "../store/store";

  // internal exports
  import { dashboardMenuList } from "$lib/Util";
  import {goto} from "$lib/helper";

  const toggleMenu = (item: string) => {
    selectedDashboardMenu.set(item);
  };
</script>

<div class="w-1/4 p-5 flex flex-col gap-20 relative dashboard-sidebar">
  <div
    class="p-2 user-menu cursor-pointer"
    on:click={() => toggleMenu(dashboardMenuList.Home)}
  >
    <Icon
      icon="material-symbols:home"
      class="user-menu-icon"
      style="width: 25px; height: 25px;"
    />
    <span>Home</span>
  </div>
  <div
    class=" p-2 user-menu cursor-pointer"
    on:click={() => toggleMenu(dashboardMenuList.Dashboard)}
  >
    <Icon
      icon="ic:baseline-dashboard"
      class="user-menu-icon"
      style="width: 25px; height: 25px;"
    />
    <span>Dashboard</span>
  </div>
  <div
    class=" p-2 user-menu gap-4 cursor-pointer"
    on:click={() => toggleMenu(dashboardMenuList.Portfolio)}
  >
    <Icon
      icon="solar:graph-new-bold"
      class="align-bottom text-lg"
      style="width: 25px; height: 25px;"
    />
    <span>Portfolio</span>
  </div>
  <div
    class=" p-2 user-menu cursor-pointer"
    on:click={() => toggleMenu(dashboardMenuList.Account)}
  >
    <Icon
      icon="ant-design:setting-filled"
      class="user-menu-icon"
      style="width: 25px; height: 25px;"
    />
    <span>Account</span>
  </div>
  <div
    class="absolute user-menu-logout bottom-20 mx-w-1xl p-2 flex gap-4 cursor-pointer"
    on:click={() => {
        goto("/");
      
      toggleMenu(dashboardMenuList.Logout);
    }}
  >
    <Icon
      icon="solar:logout-3-bold"
      class="user-menu-icon"
      style="width: 25px; height: 25px;"
    />
    <span>Logout</span>
  </div>
</div>

<style lang="scss">
  @import "../style.scss";

.dashboard-sidebar {
    padding: 2em 0 0 2em;
    background-color: $tealwhite;
    box-shadow: 2px 2px 10px rgba(206, 206, 206, 0.034);
    width: 20vw;

          .user-menu {
            display: flex;
            position: relative;
            gap: 10px;
            color: $primary-color;
          }

          .user-menu-logout {
            color: $primary-color;
          }

          .user-menu-icon {
            vertical-align: baseline;
            font-size: 25px;
            position: absolute;
          }
  }

 

@media screen and (max-width: $breakingpoint_mobile){

  .dashboard-sidebar{
    padding-left: 1em;
    div{
      span{
        display: none;
      }
    }
  }
  
}
</style>
