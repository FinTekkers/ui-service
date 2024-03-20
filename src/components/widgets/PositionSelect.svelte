<!-- components/widgets/PositionSelect.svelte -->
<script lang="ts">
  export let positions: any[];

  function formatDollar(number: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(number);
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US');
  }
</script>

<div class="position-select-container">
  <select class="text-black px-4">
    {#each positions as position}
    <option>{formatDate(position.fields["30"])}</option>
    {/each}
  </select>
  <select class="text-black w-36">
    {#each positions as position}
      <option>{formatDollar(position.measures["1"])}</option>
    {/each}
  </select>
</div>

<style>
  .position-select-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 300px;
    margin: 0 auto;
  }

  select {
    width: 100%;
    padding: 0.5rem;
    font-size: 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: #f9f9f9;
    transition: border-color 0.3s ease;
  }

  select:focus {
    outline: none;
    border-color: #007bff;
  }

  option {
    padding: 0.5rem;
  }
</style>
