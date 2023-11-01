<script lang="ts">
  import { AppBar } from "@skeletonlabs/skeleton";
</script>



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
