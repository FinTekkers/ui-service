<script>
    import { onMount, afterUpdate } from 'svelte';
    import { createEventDispatcher } from 'svelte';

    /**
   * @type {any[]}
   */
     export let data;
    let results = [];
    let graphVisible = false;

    const dispatch = createEventDispatcher();

    // Process data and plot graph when component mounts
    onMount(async () => {
        await plotGraph();
    });

    // Replot graph when results change
    afterUpdate(() => {
        if (graphVisible) {
            plotGraph();
        }
    });

    async function plotGraph() {
        // @ts-ignore
        const Plotly = await import('plotly.js-dist');

        const amountByDate = {};

        data.forEach(bond => {
            const issueDate = bond.issueDate.toISOString().split('T')[0];
            const maturityDate = bond.maturityDate.toISOString().split('T')[0];
            // @ts-ignore
            amountByDate[issueDate] = (amountByDate[issueDate] || 0) + bond.outstandingAmount;
            // @ts-ignore
            amountByDate[maturityDate] = (amountByDate[maturityDate] || 0) + bond.outstandingAmount;
        });

        const dates = Object.keys(amountByDate).sort();
        // @ts-ignore
        const amounts = dates.map(date => amountByDate[date]);

        const trace = {
            x: dates,
            y: amounts,
            type: 'scatter'
        };

        const layout = {
            title: 'Sum of Outstanding Amounts Over Time',
            xaxis: {
                title: 'Date'
            },
            yaxis: {
                title: 'Sum of Outstanding Amount'
            }
        };

        Plotly.newPlot('plot', [trace], layout);
    }

    function toggleGraphVisibility() {
        graphVisible = !graphVisible;
        dispatch('visibilityToggled', { visible: graphVisible });
    }
</script>


<button on:click={toggleGraphVisibility} class="button">{graphVisible ? 'Hide Graph' : 'Show Graph'}</button>
<div id="plot" class:hidden={graphVisible ? '' : 'hidden'} style="width:100%;height:600px;"></div>


<style lang="scss">
    @import "../style.scss";

    .hidden {
        display: none;
    }

    .button {
        border-radius: $bd-radius;
          padding: 1em;
          border: solid 1px $primary-color;
          background: transparent;
          text-align: center;
          margin: 20px 30px;
    }

    .button:hover {
        background-color: $primary-button;
    }
</style>