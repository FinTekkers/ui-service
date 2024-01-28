<script lang="ts">
</script>

<div class="main_ui_menu grow">
  <slot />
</div>


<style lang="scss">
  @import "../../style.scss";

  .main_ui_menu{
    width: 100vw;
    height: 100vh;
    max-height: 100vh !important;
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
