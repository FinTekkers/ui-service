<script lang="ts">
  /**
   * Test harness that mirrors the "Back to Portfolios" conditional logic
   * from src/routes/(authenticated)/data/positions/+page.svelte.
   * Used for isolated unit testing without the heavy page dependencies.
   */
  export let portfolioId: string | null | undefined = null;
</script>

{#if portfolioId}
  <div class="px-4 pt-4">
    <a href="/(authenticated)/data/portfolios" class="back-link">
      &larr; Back to Portfolios
    </a>
  </div>
{/if}
