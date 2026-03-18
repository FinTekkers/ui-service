<script lang="ts">
  import { onMount } from "svelte";

  let cusipInput: string = "";
  let issueDateInput: string = "";
  let issueDateOperator: "greater_than" | "lesser_than" | "" = "";

  function fetchSecurities() {
    let url = `/data/securities`;
    const params = new URLSearchParams();

    if (cusipInput && cusipInput.trim() !== "") {
      params.set("cusip", cusipInput.trim());
    }

    if (issueDateInput && issueDateInput.trim() !== "" && issueDateOperator) {
      params.set("issueDate", issueDateInput.trim());
      params.set("issueDateOperator", issueDateOperator);
    }

    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    window.location.href = url;
  }

  onMount(() => {
    const urlParams = new URLSearchParams(window.location.search);

    const cusipFromUrl = urlParams.get("cusip");
    if (cusipFromUrl) cusipInput = cusipFromUrl;

    const issueDateFromUrl = urlParams.get("issueDate");
    if (issueDateFromUrl) issueDateInput = issueDateFromUrl;

    const issueDateOperatorFromUrl = urlParams.get("issueDateOperator");
    if (
      issueDateOperatorFromUrl === "greater_than" ||
      issueDateOperatorFromUrl === "lesser_than"
    ) {
      issueDateOperator = issueDateOperatorFromUrl;
    }
  });
</script>

<div class="mt-14 mx-10 w-full gap-2">
  <div class="security-select-container flex flex-col sm:flex-row gap-2">
    <div class="text-white">
      <h4>CUSIP:</h4>
      <input
        type="text"
        id="cusip-input"
        placeholder="Enter CUSIP..."
        bind:value={cusipInput}
        class="filter-input text-black"
      />
    </div>
    <div class="text-white">
      <h4>Issue Date Filter:</h4>
      <input
        type="date"
        id="issue-date-input"
        bind:value={issueDateInput}
        class="filter-input text-black"
      />
    </div>
    <div class="text-white">
      <h4>Operator:</h4>
      <select
        id="issue-date-operator"
        bind:value={issueDateOperator}
        class="filter-select text-black"
        disabled={!issueDateInput}
      >
        <option value="">Select operator...</option>
        <option value="greater_than">Greater Than</option>
        <option value="lesser_than">Lesser Than</option>
      </select>
    </div>
    <div class="text-white flex items-end">
      <button class="security-button" on:click={fetchSecurities}>
        Fetch Securities
      </button>
    </div>
  </div>
</div>

<style lang="scss">
  @import "../../styles/_shared.scss";

  h4 {
    margin: 4px 0;
    font-size: 0.875rem;
  }

  .security-button {
    background-color: $success;
    color: $bgc-color;
    font-weight: bold;
    padding: 8px 24px;
    border: none;
    border-radius: 4px;
    font-size: 0.875rem;
    white-space: nowrap;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    &:hover {
      background-color: lighten($success, 5%);
      transform: translateY(-1px);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
    }

    &:active {
      transform: translateY(0);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }
  }

  .filter-input,
  .filter-select {
    padding: 4px 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    width: 100%;
    font-size: 0.875rem;
    height: 38px;
    box-sizing: border-box;
    background-color: white;
    color: $black;
  }

  .filter-select:disabled {
    background-color: #f0f0f0;
    color: $grey;
    cursor: not-allowed;
  }
</style>
