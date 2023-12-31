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
  <!-- svelte-ignore a11y-click-events-have-key-events -->
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
    class=" user-menu-logout user-menu cursor-pointer"
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
    background-color: $tealwhite;
    box-shadow: 2px 2px 10px rgba(206, 206, 206, 0.034);
    width: 20vw;
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: repeat(5,50px);
    justify-content: center;
    align-items: center;
    justify-items: start;
    padding-top: 2em;
    

          .user-menu {
            color: $primary-color;
            @include flex(row,center, center, 1em);
            margin: 2em 1em 0 3em;
          }

          .user-menu-logout {
            color: $primary-color;
          }

          .user-menu-icon {
            vertical-align: baseline;
          }
  }

@media screen and (max-width: $breakingpoint_medium){
  .dashboard-sidebar{
    width: 35vw;
  }
}

@media screen and (max-width: $breakingpoint_mobile){

  .dashboard-sidebar{
    display: flex;
    align-items: center;

   .user-menu-logout{
    padding: 0;
   }

    div{
      width: 100%;
      margin-right: 1em;

      span{
        display: none;
      }
    }
  }
  
}
</style>
