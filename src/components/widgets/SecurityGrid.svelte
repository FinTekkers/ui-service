<script lang="ts">
    export let rows: Array<{
      cusip: string;
      issueDate: string;
      outstandingAmount: string;
      maturityDate: string;
    }>;
  </script>
  
  <div class="portfolio_container container mx-auto shadow px-10 py-7">
    <h2 class="text-3xl font-extrabold my-3">Security Data</h2>
    <table class="min-w-full text-left table-fixed">
      <thead class="border-b border-slate-400">
        <tr>
          <th class="text-semibold text-lg px-4 py-2 w-1/4"> Cusip ID </th>
          <th class="text-semibold text-lg px-4 py-2 w-1/4">Issue Date</th>
          <th class="text-semibold text-lg px-4 py-2 w-1/4">Outstanding Amount</th
          >
          <th class="text-semibold text-lg px-4 py-2 w-1/4">Maturity Date</th>
        </tr>
      </thead>
      <tbody>
        {#each rows as row}
          <tr class="table-row border-b border-slate-400">
            <td class="table-cell px-4 py-2">{row.cusip}</td>
            <td class="table-cell px-4 py-2">{row.issueDate}</td>
            <td class="table-cell px-4 py-2">{row.outstandingAmount}</td>
            <td class="table-cell px-4 py-2">{row.maturityDate}</td>
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
      background-color: $primary-color;
      overflow: auto;
      /* padding: 1em; */
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