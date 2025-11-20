<script lang="ts">
  import type { TransactionData } from "$lib/transactions";
  import { formatAmount } from "$lib/formatUtils";

  export let rows: TransactionData[];
  export let titleOverride: string | undefined = undefined;
</script>

<div class="portfolio_container mx-auto shadow px-10 py-7">
  <h2 class="text-3xl font-extrabold my-3">
    {titleOverride ?? "Transactions"}
  </h2>
  <table class="min-w-full text-left table-fixed">
    <thead class="border-b border-slate-400">
      <tr>
        <th class="text-semibold text-lg px-4 py-2 w-1/4"> ID </th>
        <th class="text-semibold text-lg px-4 py-2 w-1/4">Issuer Name</th>
        <th class="text-semibold text-lg px-4 py-2 w-1/4">Maturity Date</th>
        <th class="text-semibold text-lg px-4 py-2 w-1/4">Tenor</th>
        <th class="text-semibold text-lg px-4 py-2 w-1/4">Coupon Frequency</th>
        <th class="text-semibold text-lg px-4 py-2 w-1/4">Coupon Type</th>
        <th class="text-semibold text-lg px-4 py-2 w-1/4">Coupon Rate</th>
        <th class="text-semibold text-lg px-4 py-2 w-1/4">Product Type</th>
        <th class="text-semibold text-lg px-4 py-2 w-1/4">Side</th>
        <th class="text-semibold text-lg px-4 py-2 w-1/4">Quantity</th>
        <th class="text-semibold text-lg px-4 py-2 w-1/4">Trade Date</th>
        <th class="text-semibold text-lg px-4 py-2 w-1/4">Settlement Date</th>
      </tr>
    </thead>
    <tbody>
      {#each rows as row}
        <tr class="table-row border-b border-slate-400">
          <td class="table-cell px-4 py-2">{row.transactionId}</td>
          <td class="table-cell px-4 py-2">{row.transactionIssuerName}</td>
          <td class="table-cell px-4 py-2">{row.transactionMaturityDate}</td>
          <td class="table-cell px-4 py-2">{row.transactionTenor}</td>
          <td class="table-cell px-4 py-2">{row.transactionCouponFrequency}</td>
          <td class="table-cell px-4 py-2">{row.transactionCouponType}</td>
          <td class="table-cell px-4 py-2">{row.transactionCouponRate}</td>
          <td class="table-cell px-4 py-2">{row.transactionProductType}</td>
          <td class="table-cell px-4 py-2">{row.transactionSide}</td>
          <td class="table-cell px-4 py-2"
            >{formatAmount(row.transactionQuantity)}</td
          >
          <td class="table-cell px-4 py-2">{row.transactionTradeDate}</td>
          <td class="table-cell px-4 py-2">{row.transactionSettlementDate}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style lang="scss">
  @import "../../styles/grid-table";
</style>
