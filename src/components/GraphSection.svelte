<script>
    import { onMount, afterUpdate } from 'svelte';
    import { createEventDispatcher } from 'svelte';
    
    /**
     * @type {any[]}
     */
     export let data;
    let graphVisible = false;
    const dispatch = createEventDispatcher();
    
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
        let cumulativeSum = 0;
        
        data.forEach(bond => {
            const issueDate = bond.issueDate.toISOString().split('T')[0];
            const maturityDate = bond.maturityDate.toISOString().split('T')[0];
            
            // @ts-ignore
            amountByDate[issueDate] = (amountByDate[issueDate] || 0) + bond.outstandingAmount;
            // @ts-ignore
            amountByDate[maturityDate] = (amountByDate[maturityDate] || 0) + bond.outstandingAmount;
        });
        
        const dates = Object.keys(amountByDate).sort();
        const amounts = dates.map(date => {
            // @ts-ignore
            cumulativeSum += amountByDate[date];
            return cumulativeSum;
        });
        
        const trace = {
            x: dates,
            y: amounts,
            type: 'scatter',
            line: {
                color: 'rgba(255,255,255,0.9)'
            }
        };
        
        const layout = {
            title: {
                text: 'Cumulative Sum of Outstanding Amounts Over Time',
                font: {
                    color: '#fff'
                }
            },
            xaxis: {
                title: {
                    text: 'Date',
                    font: {
                        color: '#fff'
                    }
                },
                tickfont: {
                    color: '#fff'
                }
            },
            yaxis: {
                title: {
                    text: 'Cumulative Sum of Outstanding Amount',
                    font: {
                        color: '#fff'
                    }
                },
                tickfont: {
                    color: '#fff'
                }
            },
            // Setting the dark theme
            plot_bgcolor: 'rgba(0,0,0,0)',
            paper_bgcolor: '#258ea8'
        };
        
        Plotly.newPlot('plot', [trace], layout);
    }
    
    function toggleGraphVisibility() {
        graphVisible = !graphVisible;
        dispatch('visibilityToggled', { visible: graphVisible });
    }
</script>

<div class="graph">
    <h2 class="intro-chart">Quickly create rich, informative graphs based on thousands of data points. The example below uses live data from our backend with thousands of data points rendered in real-time</h2>
    <div id="plot" style=""></div>
</div>

<style lang="scss">
    @import "../style.scss";
    .graph{
        padding: 20px;
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