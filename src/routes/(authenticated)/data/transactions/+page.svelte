<script lang="ts">
  import DashboardSideBar from "../../../../components/DashboardSideBar.svelte";
  import Transaction from "../../../../components/widgets/TransactionGrid.svelte";
  export let data: import("./$types").PageData;

  console.log(`data = ${data.isUserLoggedIn}`);
</script>

{@debug}

<div class="w-screen h-full flex">
  <DashboardSideBar {data} />

  <Transaction
    rows={Array.isArray(data.transactions)
      ? data.transactions
      : [data.transactions]}
  />
</div>
