<script lang="ts">
  import { AppBar } from "@skeletonlabs/skeleton";
</script>

<div class="main_navbar">
  <h6 class="logo">FTK</h6>
</div>

<slot />

<style lang="scss">
  @import "../../style.scss";

  .main_navbar {
    padding: 1em;
    background-color: $primary-color;

    .logo {
      margin-left: 1em;
    }
  }
</style>
