<script lang="ts">
  import { onMount, afterUpdate } from "svelte";
  import { createEventDispatcher } from "svelte";
  // US-250: AAPL daily closes, oldest first (src/lib/server/homepage-chart.ts).
  export let data: { date: string; close: number }[];
  let graphVisible = false;
  const dispatch = createEventDispatcher<{
    visibilityToggled: { visible: boolean };
  }>();

  onMount(async () => {
    await plotGraph();
  });

  afterUpdate(() => {
    if (graphVisible) {
      plotGraph();
    }
  });

  async function plotGraph() {
    const Plotly = await import("plotly.js-dist");
    const trace = {
      x: data.map((d) => d.date),
      y: data.map((d) => d.close),
      type: "scatter",
      mode: "lines",
      line: {
        color: "rgba(255,255,255,0.9)",
      },
    };

    const layout = {
      title: {
        text: "AAPL daily close",
        font: {
          color: "#fff",
        },
      },
      xaxis: {
        type: "date",
        title: {
          text: "Date",
          font: {
            color: "#fff",
          },
        },
        tickfont: {
          color: "#fff",
        },
      },
      yaxis: {
        title: {
          text: "Close (USD)",
          font: {
            color: "#fff",
          },
        },
        tickfont: {
          color: "#fff",
        },
      },
      // Setting the dark theme
      plot_bgcolor: "rgba(0,0,0,0)",
      paper_bgcolor: "#258ea8",
    };

    Plotly.newPlot("plot", [trace], layout);
  }

  function toggleGraphVisibility() {
    graphVisible = !graphVisible;
    dispatch("visibilityToggled", { visible: graphVisible });
  }
</script>

<div class="graph">
  <h2 class="intro-chart">
    Quickly create rich, informative graphs based on thousands of data points.
    The example below uses live data from our backend with thousands of data
    points rendered in real-time
  </h2>
  <div id="plot" style="" />
</div>

<style lang="scss">
  @import "../styles/_shared.scss";
  .graph {
    padding: 20px;
    background-color: $bgc-color;
    border-top: solid 1px $bordercoltransp;
  }
  .intro-chart {
    text-align: center;
    padding: 30px 0;
    width: 80%;
    margin: 0 auto;
    font-weight: 400;
  }

  #plot {
    width: 100%;
    height: 500px;
  }

  @media screen and (min-width: 768px) {
    #plot {
      height: 600px;
    }
  }

  @media screen and (min-width: 1024px) {
    #plot {
      height: 500px;
      width: 90%;
      margin: 0 auto;
    }
  }
</style>
