<script lang="ts">
  import Icon from "@iconify/svelte";
  import {
    currentMenu,
    Authentication,
    goto,
    Authenticate,
  } from "../store/store";
  import { menuList } from "../util/Util";

  const changeMenu = (item: string) => {
    currentMenu.set(item);
    console.log($currentMenu);
  };
</script>

<div class="w-1/4 p-5 flex flex-col gap-20 relative sidemenu_container">
  <div
    class=" p-2 custom-menutitle cursor-pointer"
    on:click={() => changeMenu(menuList.Home)}
  >
    <Icon
      icon="material-symbols:home"
      class="menu_icon"
      style="width: 25px; height: 25px;"
    />
    <span>Home</span>
  </div>
  <div
    class=" p-2 custom-menutitle cursor-pointer"
    on:click={() => changeMenu(menuList.Dashboard)}
  >
    <Icon
      icon="ic:baseline-dashboard"
      class="menu_icon"
      style="width: 25px; height: 25px;"
    />
    <span>Dashboard</span>
  </div>
  <div
    class=" p-2 custom-menutitle gap-4 cursor-pointer"
    on:click={() => changeMenu(menuList.Portfolio)}
  >
    <Icon
      icon="solar:graph-new-bold"
      class="align-bottom text-lg"
      style="width: 25px; height: 25px;"
    />
    <span>Portfolio</span>
  </div>
  <div
    class=" p-2 custom-menutitle cursor-pointer"
    on:click={() => changeMenu(menuList.Account)}
  >
    <Icon
      icon="ant-design:setting-filled"
      class="menu_icon"
      style="width: 25px; height: 25px;"
    />
    <span>Account</span>
  </div>
  <div
    class="absolute custom-menutitle-logout bottom-20 mx-w-1xl p-2 flex gap-4 cursor-pointer"
    on:click={() => {
      Authenticate(false);

      if ($Authentication == false) {
        goto("/");
      }

      changeMenu(menuList.Logout);
    }}
  >
    <Icon
      icon="solar:logout-3-bold"
      class="menu_icon"
      style="width: 25px; height: 25px;"
    />
    <span>Logout</span>
  </div>
</div>

<style lang="scss">
  @import "../style.scss";

  .sidemenu_container {
    padding: 2em 0 0 2em;
    background-color: $white;
    box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.096);
    width: 20vw;
  }

  .custom-menutitle {
    display: flex;
    position: relative;
    gap: 10px;
    color: $primary-color;
  }

  .custom-menutitle-logout {
    color: $primary-color;
  }

  .menu_icon {
    vertical-align: baseline;
    font-size: 25px;
    position: absolute;
  }
</style>
