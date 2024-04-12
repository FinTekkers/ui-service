<script lang="ts">
  import DashboardSideBar from "../../../components/DashboardSideBar.svelte";
  import Position from "../../../components/widgets/PositionGrid.svelte";
  import PositionSelect from "../../../components/widgets/PositionSelect.svelte";
  export let data: import("./$types").PageData;
</script>

{@debug}

<div class="w-screen h-full flex">
  <DashboardSideBar />
  <div class="h-full w-screen dashboard-container">
    <PositionSelect />
    <Position
      positions={Array.isArray(data.positions)
        ? data.positions
        : [data.positions]}
    />
  </div>
</div>

<style lang="scss">
  @import "../../../style.scss";

  .dashboard-container {
    background-color: white;
    // @include flex(column, center, center, 0);

    .dashboard-menu {
      width: 98%;
      height: 98%;
      padding: 2em;
      border-radius: 5px;
      background-color: $tealblack;
      color: $primary-color;
    }
  }
</style>
