<script lang="ts">
  import Main from "../../components/Main.svelte";
  import SideMenu from "../../components/SideMenu.svelte";
  export let data: import("./$types").PageData;
</script>

{@debug}

<div class="w-screen h-full flex">
  <SideMenu />
  <Main data={data} />
</div>
