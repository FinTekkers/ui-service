<script lang="ts">
  // external exports
  import Icon from "@iconify/svelte";
  // internal exports
  import {selectedDashboardMenuUpdater} from "../store/store";
      import type { dashboardMenuList } from "$lib/Util";
  import {goto} from "$lib/helper";
  import {dashboardMenuData} from '$lib/uidata';
  import { page } from "$app/stores";


  //  this function is to ensure accessibility
  const handleKeyDown:(key:keyof typeof dashboardMenuList)=>void = (dashboardMenuKey: keyof typeof dashboardMenuList)=>{
      selectedDashboardMenuUpdater(dashboardMenuKey)
  }


</script>
<!-- <div class="w-1/4 p-5 flex flex-col gap-20 relative dashboard-sidebar"> -->

<!-- {#each Object.entries(dashboardMenuData) as [_menukey, menuValue] } -->
  
<div class="w-1/4 p-5 flex flex-col gap-20 relative dashboard-sidebar">
  {#each Object.entries(dashboardMenuData) as [_menukey, menuValue] }
    <a href="{menuValue.url}" class="p-2 user-menu cursor-pointer" on:keydown={()=>handleKeyDown('PORTFOLIO')}>
      <Icon
        icon={menuValue.iconName}
        class="user-menu-icon"
        style={menuValue.style}
      />
      <span>{menuValue.menuName}</span>
    </a>
  {/each}
</div>

<!-- {/each} -->

  <!-- <div
    class=" user-menu-logout user-menu cursor-pointer"
    on:keydown={()=>handleKeyDown("LOGOUT")}
    on:click={() => {
        goto("/");
      
      selectedDashboardMenuUpdater(dashboardMenuList.LOGOUT);
    }}
  >
    <Icon
      icon="solar:logout-3-bold"
      class="user-menu-icon"
      style="width: 20px; height: 20px;"
    />
    <span>Logout</span>
  </div> -->
<!-- </div> -->

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

      :is(span){
        display: none;
      }
    }
  }
  
}
</style>