<script lang="ts">
  import { formatAmount } from "$lib/formatUtils";

  export let rows: Array<{
    cusip: string;
    issueDate: string;
    maturityDate: string;
    outstandingAmount: string;
    issuerName: string;
    assetClass: string;
    productType: string;
    productClass?: string;
    tenor?: string;
    couponRate?: string;
    couponType?: string;
    couponFrequency?: string;
    faceValue?: string;
    datedDate?: string;
    asOf: string;
  }>;
</script>

<div class="portfolio_container mx-auto shadow px-10 py-7">
  <h2 class="text-3xl font-extrabold my-3">Security</h2>
  <div class="table-wrapper">
    <table class="text-left">
      <thead class="border-b border-slate-400">
        <tr>
          <th class="text-semibold text-lg px-4 py-2">CUSIP ID</th>
          <th class="text-semibold text-lg px-4 py-2">Issuer Name</th>
          <th class="text-semibold text-lg px-4 py-2">Asset Class</th>
          <th class="text-semibold text-lg px-4 py-2">Product Type</th>
          <th class="text-semibold text-lg px-4 py-2">Product Class</th>
          <th class="text-semibold text-lg px-4 py-2">Issue Date</th>
          <th class="text-semibold text-lg px-4 py-2">Maturity Date</th>
          <th class="text-semibold text-lg px-4 py-2">Dated Date</th>
          <th class="text-semibold text-lg px-4 py-2">Tenor</th>
          <th class="text-semibold text-lg px-4 py-2">Coupon Rate</th>
          <th class="text-semibold text-lg px-4 py-2">Coupon Type</th>
          <th class="text-semibold text-lg px-4 py-2">Coupon Frequency</th>
          <th class="text-semibold text-lg px-4 py-2">Face Value</th>
          <th class="text-semibold text-lg px-4 py-2">Outstanding Amount</th>
          <th class="text-semibold text-lg px-4 py-2">As Of</th>
        </tr>
      </thead>
      <tbody>
        {#each rows as row}
          <tr class="table-row border-b border-slate-400">
            <td class="table-cell px-4 py-2">{row.cusip}</td>
            <td class="table-cell px-4 py-2">{row.issuerName}</td>
            <td class="table-cell px-4 py-2">{row.assetClass}</td>
            <td class="table-cell px-4 py-2">{row.productType}</td>
            <td class="table-cell px-4 py-2">{row.productClass ?? '-'}</td>
            <td class="table-cell px-4 py-2">{row.issueDate}</td>
            <td class="table-cell px-4 py-2">{row.maturityDate}</td>
            <td class="table-cell px-4 py-2">{row.datedDate ?? '-'}</td>
            <td class="table-cell px-4 py-2">{row.tenor ?? '-'}</td>
            <td class="table-cell px-4 py-2">{row.couponRate ?? '-'}</td>
            <td class="table-cell px-4 py-2">{row.couponType ?? '-'}</td>
            <td class="table-cell px-4 py-2">{row.couponFrequency ?? '-'}</td>
            <td class="table-cell px-4 py-2">{row.faceValue ? formatAmount(row.faceValue) : '-'}</td>
            <td class="table-cell px-4 py-2">{formatAmount(row.outstandingAmount)}</td>
            <td class="table-cell px-4 py-2">{row.asOf}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<style lang="scss">
  @import "../../styles/grid-table";

  .table-wrapper {
    overflow-x: auto;
    width: 100%;
  }

  table {
    width: max-content;
    min-width: 100%;
  }

  th,
  td {
    white-space: nowrap;
    min-width: 120px;
  }
</style>
