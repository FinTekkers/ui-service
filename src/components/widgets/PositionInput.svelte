<!-- App.svelte -->
<script>
  // import { fetchPosition } from '../../lib/positions';
  let assetClass = "";
  let issuerName = "";
  /**
   * @type {string | any[]}
   */
  let positions = [];

  // function fetchPositions() {
  //   // Implement your fetch logic here
  //   console.log("Fetching positions...");
  // }

  // const fetchPositionsData = async () => {
  //   fetchPosition(); // Call fetchPositions function to fetch positions
  //   // @ts-ignore
  //   positions = fetchPositions(); // Update positions variable
  // };

  const handleSubmit = async () => {
    // await fetchPositionsData();
  };
</script>

<div>
  <form on:submit|preventDefault={handleSubmit}>
    <label for="assetClass">Asset Class:</label>
    <input
      type="text"
      bind:value={assetClass}
      placeholder="Enter Asset Class"
      id="assetClass"
    />

    <label for="issuerName">Issuer Name:</label>
    <input
      type="text"
      bind:value={issuerName}
      placeholder="Enter Issuer Name"
      id="issuerName"
    />

    <!-- <button on:click={fetchPositions}>Fetch Positions</button> -->
  </form>

  {#if positions && positions.length > 0}
    <ul>
      {#each positions as position}
        <li>{position}</li> <!-- Display positions -->
      {/each}
    </ul>
  {:else}
    <p>No positions found.</p>
  {/if}
</div>

<style lang="scss">
  @import "../../style.scss";
  /* Custom styling for the input fields */
  label {
    color: $bgc-color;
  }
  input {
    border: 2px solid #ddd;
    color: $bgc-color;
    border-radius: 5px;
    outline: none;
    padding: 10px;
    margin-bottom: 15px;
    font-size: 16px;
    width: 100%;
    box-sizing: border-box;
    transition: border-color 0.3s;
  }

  input:focus {
    outline: none;
    border-color: $bgc-color;
  }

  button {
    background-color: $bgc-color;
    color: white;
    border: none;
    border-radius: 5px;
    padding: 10px 20px;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.3s;
  }

  button:hover {
    background-color: $bgc-color;
  }
</style>
