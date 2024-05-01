<script lang="ts">
  export let positions: any[] = [];
  export let requestData: any;
  export let metadata;

  let fields = metadata.fields;
  let measures = metadata.measures;

  // Function to format date
  function formatDate(dateString: Date) {
    const date = new Date(dateString);
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}/${String(date.getDate()).padStart(2, "0")}`;
  }
  function formatAmount(amount: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }
</script>

<div class="portfolio_container container mx-auto shadow px-10 py-7 my-4">
  <h2 class="text-3xl font-extrabold my-3">Positions</h2>
  <table class="min-w-full text-left table-fixed">
    <thead class="border-b border-slate-400">
      <tr>
        {#each fields as field}
          <th class="text-semibold text-lg px-4 py-2 w-1/4">{field}</th>
        {/each}
        {#each measures as measure}
          <th class="text-semibold text-lg px-4 py-2 w-1/4">{measure}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each positions as position}
        <tr class="table-row border-b border-slate-400">
          {#each requestData.fields as field}
            <td class="table-cell px-4 py-2">
              {formatDate(position[field])}
            </td>
          {/each}
          {#each requestData.measures as measure}
            <td class="table-cell px-4 py-2">
              {formatAmount(position[measure])}
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style lang="scss">
  @import "../../style.scss";
  .portfolio_container {
    height: 100%;
    width: 82vw;
    background-color: $primary-color;
    overflow: auto;
  }

  th,
  td {
    border: 1px solid #ddd;
  }

  th {
    /* background-color: #f2f2f2; */
  }

  tr:hover {
    background-color: $bgc-color;
    cursor: pointer;
  }
</style>
