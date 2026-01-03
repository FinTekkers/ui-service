<script lang="ts">
  import { onMount, afterUpdate } from "svelte";
  import { createEventDispatcher } from "svelte";
  interface Bond {
    cusip: string;
    issueDate: Date;
    maturityDate: Date;
    outstandingAmount: number;
  }

  export let data: Bond[];
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
    const cumulativeSumByYear: { [year: number]: number } = {};
    const cumulativeSumByMaturityYear: { [year: number]: number } = {};

    data.forEach((bond) => {
      const issueDate = new Date(bond.issueDate);
      const maturityDate = new Date(bond.maturityDate);
      const issueYear = issueDate.getFullYear();
      const maturityYear = maturityDate.getFullYear();
      const currentDate = new Date();

      if (currentDate <= maturityDate) {
        cumulativeSumByYear[issueYear] =
          (cumulativeSumByYear[issueYear] || 0) + bond.outstandingAmount;
      } else {
        if (
          cumulativeSumByYear[issueYear] &&
          cumulativeSumByYear[issueYear] >= bond.outstandingAmount
        ) {
          cumulativeSumByYear[issueYear] -= bond.outstandingAmount;
        }
      }
      if (
        cumulativeSumByMaturityYear[maturityYear] &&
        cumulativeSumByMaturityYear[maturityYear] >= bond.outstandingAmount
      ) {
        cumulativeSumByMaturityYear[maturityYear] -= bond.outstandingAmount;
      }
    });

    const years = Array.from(
      new Set([
        ...Object.keys(cumulativeSumByYear),
        ...Object.keys(cumulativeSumByMaturityYear),
      ])
    )
      .map(Number)
      .sort();
    let cumulativeSum = 0;
    const cumulativeSums = years.map((year) => {
      cumulativeSum =
        (cumulativeSumByYear[year] || 0) +
        (cumulativeSumByMaturityYear[year] || 0);
      return cumulativeSum;
    });

    const trace = {
      x: years,
      y: cumulativeSums,
      type: "scatter",
      line: {
        color: "rgba(255,255,255,0.9)",
      },
    };

    const layout = {
      title: {
        text: "Cumulative Sum of Outstanding Amounts by Year",
        font: {
          color: "#fff",
        },
      },
      xaxis: {
        title: {
          text: "Year",
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
          text: "Cumulative Sum of Outstanding Amount",
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
