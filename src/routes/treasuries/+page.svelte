<script lang="ts">
  import DashboardSideBar from "../../components/DashboardSideBar.svelte";
  import Transaction from "../../components/widgets/TransactionGrid.svelte";

  export let data: import("./$types").PageData;
</script>

{@debug}

<div class="w-screen h-full flex">
  <!-- <DashboardSideBar {data} /> -->

  <Transaction
    rows={Array.isArray(data.transactions)
      ? data.transactions
      : [data.transactions]}
    titleOverride="Recent Fed Balance Sheet Activity"
  />
</div>
