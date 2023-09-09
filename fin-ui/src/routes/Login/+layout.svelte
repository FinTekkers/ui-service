<script lang="ts">
  import { Authentication } from "../../store/store";

  const Authenticate = () => {
    Authentication.set(true);
  };
  const goto = (url: string) => (window.location.href = url);
</script>

<div class="border p2 w-screen h-screen">
  <button
    class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    on:click={() => {
      Authenticate();

      if ($Authentication) {
        goto("/");
      }
    }}>Google login</button
  >
</div>
<slot />
