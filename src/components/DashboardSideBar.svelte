<script lang="ts">
  // external exports
  import Icon from "@iconify/svelte";
  // internal exports
  import { selectedDashboardMenuUpdater } from "../store/store";
  import type { dashboardMenuList } from "$lib/Util";
  import { goto } from "$lib/helper";
  import { dashboardMenuData } from "$lib/uidata";
  import { page } from "$app/stores";

  export let data;
  let userInfo: string;

  //  this function is to ensure accessibility
  const handleKeyDown: (key: keyof typeof dashboardMenuList) => void = (
    dashboardMenuKey: keyof typeof dashboardMenuList
  ) => {
    selectedDashboardMenuUpdater(dashboardMenuKey);
  };

  let showSidebar = true;

  const toggleSidebar = () => {
    console.log("clicked");
    showSidebar = !showSidebar;
  };

  // if (data){
  //     const {userData:{user:{name}}} = data;
  //     userInfo = name;
  // }
</script>

<div class="relative">
<div
  class={`${
    showSidebar ? "show" : "hide"
  } w-1/4 p-5 flex flex-col gap-20 relative dashboard-sidebar`}
>
  <div class="person-logged-info">
    <Icon
      icon="octicon:feed-person-16"
      class="user-menu-icon"
      style="width:25px; height:25px; color:red"
    />
    <!-- <span style='color:red'>Hello {userInfo}</span> -->
  </div>

  {#each Object.entries(dashboardMenuData) as [_menukey, menuValue]}
    <div
      class="p-2 user-menu cursor-pointer"
      on:keydown={() => handleKeyDown("PORTFOLIO")}
      on:click={() => selectedDashboardMenuUpdater(menuValue.location)}
    >
      <a href={menuValue.url} class="flex items-center justify-center gap-2">
        <Icon
          icon={menuValue.iconName}
          class="user-menu-icon"
          style={menuValue.style}
        />
        <span>{menuValue.menuName}</span>
      </a>
    </div>
  {/each}

  <form method="post" action="?/logout">
    <label class=" user-menu-logout user-menu cursor-pointer" for="logout">
      <Icon
        icon="solar:logout-3-bold"
        class="user-menu-icon"
        style="width: 20px; height: 20px;"
      />
      <button type="submit">Logout</button>
    </label>
  </form>
</div>
<button on:click={toggleSidebar} class="text-black absolute top-[5px] right-[-2em]">
  <Icon
    icon={showSidebar ? "mdi:hamburger-open" : "mdi:hamburger-close"}
    class="user-menu-icon"
    style="width:30px; height:30px; color:white; background: #0c3a46; borderRadius: 20px;"
  />
</button>
</div>



<style lang="scss">
  @import "../style.scss";
  .dashboard-sidebar.hide {
    // width: 0;
    display: none;
  }

  .dashboard-sidebar.show {
    // width: 20vw;
    width: 20vw;
  }
  .dashboard-sidebar {
    background-color: $tealwhite;
    box-shadow: 2px 2px 10px rgba(206, 206, 206, 0.034);
    width: 20vw;
    height: 100%;
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: repeat(5, 50px);
    justify-content: center;
    align-items: center;
    justify-items: start;
    padding-top: 2em;
    transition: width 0.5s;

    .person-logged-info {
      @include flex(row, center, center, 1em);
      margin: 0 auto;
    }

    .user-menu {
      color: $primary-color;
      @include flex(row, center, center, 1em);
      margin: 2em 1em 0 3em;
    }

    .user-menu-logout {
      color: $primary-color;
    }

    .user-menu-icon {
      vertical-align: baseline;
    }
  }

  @media screen and (max-width: $breakingpoint_medium) {
    .dashboard-sidebar {
      width: 35vw;
    }
  }

  @media screen and (max-width: $breakingpoint_mobile) {
    .dashboard-sidebar {
      display: flex;
      align-items: center;

      .user-menu-logout {
        padding: 0;
      }

      div {
        width: 100%;
        margin-right: 1em;

        :is(span) {
          display: none;
        }
      }
    }
  }
</style>
