<script lang="ts">
  export let rows: Array<{
    transactionId: string;
    transactionTradeDate: string;
    transactionQuantity: string;
    transactionSettlementDate: string;
    // transactionTradeName: string;
    transactionIssuerName: string;
  }>;
</script>

<div class="portfolio_container mx-auto shadow px-10 py-7">
  <h2 class="text-3xl font-extrabold my-3">Transactions</h2>
  <table class="min-w-full text-left table-fixed">
    <thead class="border-b border-slate-400">
      <tr>
        <th class="text-semibold text-lg px-4 py-2 w-1/4"> ID </th>
        <th class="text-semibold text-lg px-4 py-2 w-1/4"
          >Issuer Name</th
        >
   
        <th class="text-semibold text-lg px-4 py-2 w-1/4"
          >Quantity</th
        >
        <th class="text-semibold text-lg px-4 py-2 w-1/4"
          >Trade Date</th
        >
        <th class="text-semibold text-lg px-4 py-2 w-1/4"
          >Settlement Date</th
        >
      </tr>
    </thead>
    <tbody>
      {#each rows as row}
        <tr class="table-row border-b border-slate-400">
          <td class="table-cell px-4 py-2">{row.transactionId}</td>
          <td class="table-cell px-4 py-2">{row.transactionIssuerName}</td>
          <td class="table-cell px-4 py-2">{row.transactionQuantity}</td>
          <td class="table-cell px-4 py-2">{row.transactionTradeDate}</td>
          <td class="table-cell px-4 py-2">{row.transactionSettlementDate}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style lang="scss">
  @import "../../style.scss";
  .portfolio_container {
    height: 100%;
    width: 100%;
    background-color: $primary-color; /* assuming $primary-color is a dark color */
    overflow: auto;
    padding: 28px 40px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); /* added shadow */
  }

  table {
    border-collapse: collapse;
    width: 100%;
  }

  th,
  td {
    border: 1px solid #ddd;
    padding: 10px;
    text-align: left;
  }

  th {
    font-weight: bold;
    /* background-color: #f2f2f2; */
  }

  tr:hover {
    background-color: $bgc-color; /* assuming $bgc-color is a light color */
    cursor: pointer;
  }

  .text-3xl {
    font-size: 36px;
  }

  .font-extrabold {
    font-weight: 800;
  }

  .my-3 {
    margin-bottom: 24px;
  }

  .text-semibold {
    font-weight: 600;
  }

  .text-lg {
    font-size: 18px;
  }

  .px-4 {
    padding-left: 16px;
    padding-right: 16px;
  }

  .py-2 {
    padding-top: 8px;
    padding-bottom: 8px;
  }

  .table-width {
    width: 25%;
  }

  .capitalize {
    text-transform: capitalize;
  }

  .table-row {
    border-bottom: 1px solid #ddd;
  }

  .table-cell {
    padding: 10px;
  }
</style>
