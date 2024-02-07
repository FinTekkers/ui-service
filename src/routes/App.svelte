<script>
  import { routes } from '@sveltejs/kit/config';
</script>

<main>
  {#each routes as { id, component (loader) }}
    <div>
      {#await loader}
        Loading...
      {:then segment}
        {#if segment.default}
          <svelte:component this={segment.default} />
        {/if}
      {/await}
    </div>
  {/each}
</main>