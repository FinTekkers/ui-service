<script lang="ts">
  import { onMount } from "svelte";
  import type { TreasuryTransaction } from "$lib/treasury_positions";
  import {
    createActivityOverTimeGraph,
    createNetActivityOverTimeGraph,
    createCumulativePositionGraph,
    createTermActivityGraph,
    createRecentActivityGraph,
  } from "$lib/treasury_graphs";

  export let data: import("./$types").PageData;

  let plotlyLoaded = false;
  let Plotly: any;

  // Graph container IDs
  const graphIds = {
    activity: "activity-over-time",
    netActivity: "net-activity-over-time",
    cumulative: "cumulative-position",
    term: "term-activity",
    recent: "recent-activity",
  };

  onMount(async () => {
    // Load Plotly dynamically
    Plotly = await import("plotly.js-dist");
    plotlyLoaded = true;

    // Render all graphs
    await renderAllGraphs();
  });

  async function renderAllGraphs() {
    if (!plotlyLoaded || !data.transactions || data.transactions.length === 0) {
      return;
    }

    const transactions = data.transactions as TreasuryTransaction[];

    // Render Activity Over Time
    try {
      const activityGraph = createActivityOverTimeGraph(transactions);
      Plotly.newPlot(
        graphIds.activity,
        activityGraph.data,
        activityGraph.layout,
        { responsive: true }
      );
    } catch (error) {
      console.error("Error rendering activity over time graph:", error);
    }

    // Render Net Activity Over Time
    try {
      const netActivityGraph = createNetActivityOverTimeGraph(transactions);
      Plotly.newPlot(
        graphIds.netActivity,
        netActivityGraph.data,
        netActivityGraph.layout,
        { responsive: true }
      );
    } catch (error) {
      console.error("Error rendering net activity over time graph:", error);
    }

    // Render Cumulative Position
    try {
      const cumulativeGraph = createCumulativePositionGraph(transactions);
      Plotly.newPlot(
        graphIds.cumulative,
        cumulativeGraph.data,
        cumulativeGraph.layout,
        { responsive: true }
      );
    } catch (error) {
      console.error("Error rendering cumulative position graph:", error);
    }

    // Render Term Activity
    try {
      const termGraph = createTermActivityGraph(transactions);
      Plotly.newPlot(graphIds.term, termGraph.data, termGraph.layout, {
        responsive: true,
      });
    } catch (error) {
      console.error("Error rendering term activity graph:", error);
    }

    // Render Recent Activity (without Treasury yield for now)
    try {
      const recentGraph = createRecentActivityGraph(transactions);
      Plotly.newPlot(graphIds.recent, recentGraph.data, recentGraph.layout, {
        responsive: true,
      });
    } catch (error) {
      console.error("Error rendering recent activity graph:", error);
    }
  }

  // Re-render graphs when data changes
  $: if (plotlyLoaded && data.transactions) {
    renderAllGraphs();
  }
</script>

<div class="treasuries-graphs-container">
  <h1 class="page-title">Treasury Position Analytics</h1>

  {#if !data.transactions || data.transactions.length === 0}
    <div class="no-data">
      <p>No treasury transaction data available.</p>
    </div>
  {:else}
    <div class="graphs-grid-wrapper">
      <div class="graphs-grid">
        <!-- Activity Over Time -->
        <div class="graph-card">
          <h2>Activity Over Time</h2>
          <div id={graphIds.activity} class="plot-container" />
        </div>

        <!-- Net Activity Over Time -->
        <div class="graph-card">
          <h2>Net Activity Over Time</h2>
          <div id={graphIds.netActivity} class="plot-container" />
        </div>

        <!-- Cumulative Position -->
        <div class="graph-card">
          <h2>Cumulative Position by Product Type</h2>
          <div id={graphIds.cumulative} class="plot-container" />
        </div>

        <!-- Term Activity -->
        <div class="graph-card">
          <h2>Activity by Term Category</h2>
          <div id={graphIds.term} class="plot-container" />
        </div>

        <!-- Recent Activity -->
        <div class="graph-card full-width">
          <h2>Recent Activity with Moving Average</h2>
          <div id={graphIds.recent} class="plot-container" />
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  :global(.main_ui_menu) {
    overflow: auto !important;
    max-height: none !important;
    height: auto !important;
  }

  .treasuries-graphs-container {
    padding: 2rem;
    min-height: 100vh;
    background-color: #1a1a1a;
    color: #fff;
    overflow-x: auto;
    overflow-y: visible;
    width: 100%;
    box-sizing: border-box;
    height: auto;
  }

  .page-title {
    font-size: 2.5rem;
    margin-bottom: 2rem;
    text-align: center;
    color: #fff;
  }

  .no-data {
    text-align: center;
    padding: 4rem;
    font-size: 1.2rem;
    color: #888;
  }

  .graphs-grid-wrapper {
    width: 100%;
    overflow-x: auto;
    overflow-y: visible;
  }

  .graphs-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(4, auto);
    gap: 2rem;
    margin-top: 2rem;
    width: 100%;
    min-width: min-content;
  }

  .graph-card {
    background-color: #2a2a2a;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    min-width: 0; /* Allow grid items to shrink below content size */
    overflow: hidden;
  }

  .graph-card.full-width {
    grid-column: 1 / -1;
  }

  .graph-card h2 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: #fff;
    border-bottom: 2px solid #4a9eff;
    padding-bottom: 0.5rem;
  }

  .plot-container {
    width: 100%;
    min-height: 400px;
    overflow: auto;
  }

  /* Tablet and smaller screens - switch to single column */
  @media (max-width: 1024px) {
    .graphs-grid {
      grid-template-columns: 1fr;
      grid-template-rows: repeat(5, auto);
    }

    .graph-card.full-width {
      grid-column: 1;
    }
  }

  /* Mobile screens */
  @media (max-width: 768px) {
    .treasuries-graphs-container {
      padding: 1rem;
    }

    .page-title {
      font-size: 2rem;
    }

    .graphs-grid {
      gap: 1.5rem;
    }

    .graph-card {
      padding: 1rem;
    }

    .graph-card h2 {
      font-size: 1.25rem;
    }

    .plot-container {
      min-height: 300px;
    }
  }

  /* Very small screens */
  @media (max-width: 480px) {
    .treasuries-graphs-container {
      padding: 0.5rem;
    }

    .page-title {
      font-size: 1.5rem;
      margin-bottom: 1rem;
    }

    .graphs-grid {
      gap: 1rem;
    }

    .plot-container {
      min-height: 250px;
    }
  }

  /* Large screens - allow horizontal scrolling if needed */
  @media (min-width: 1400px) {
    .graphs-grid {
      grid-template-columns: repeat(2, minmax(600px, 1fr));
    }
  }

  /* Ensure horizontal scrolling works on all screen sizes */
  @media (min-width: 1025px) {
    .treasuries-graphs-container {
      overflow-x: auto;
    }

    .graphs-grid {
      min-width: min-content;
    }
  }
</style>
