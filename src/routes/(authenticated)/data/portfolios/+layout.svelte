<script lang="ts">
</script>

<svelte:head>
  <title>{'Dashboard Portfolio'}</title>
</svelte:head>

<div class="main_ui_menu grow">
  <slot />
</div>


<style lang="scss">
  @import "../../../../style";

  .main_ui_menu{
    width: 100vw;
    height: 100vh;
    max-height: 100vh;
    overflow: hidden;
  }

  .main_navbar {
    padding: 1em;
    background-color: $primary-color;

    .logo {
      margin-left: 1em;
    }
  }
</style>
