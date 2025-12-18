import type { TreasuryTransaction } from './treasury_positions';
import {
  groupByDateAndCategory,
  resampleWeekly,
  resampleMonthly,
  pivotTable,
  sortDates,
  combineMaturationColumns,
  calculateTotal,
  cumulativeSum,
  filterByStartDate,
  convertToBillions,
  convertToTrillions,
  ensureCategories,
  reorderCategories,
  movingAverage,
  getUniqueCategories,
} from './treasury_graph_utils';

/**
 * Plotly color palettes
 */
const PLOTLY_COLORS = {
  T10: [
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
    '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
  ],
  Alphabet: [
    '#AA0DFE', '#3283FE', '#85660D', '#782AB6', '#565656',
    '#1C8356', '#16FF32', '#F7E1A0', '#E2E2E2', '#1CBE4F',
    '#C4451C', '#DEA0FD', '#FE00FA', '#325A9B', '#FEAF16',
    '#F8A19F', '#90AD1C', '#F6222E', '#1CFFCE', '#2ED9FF',
    '#B10DA1', '#C075A6', '#FC1CBF', '#B00068', '#FBE426',
    '#FA0087'
  ]
};

/**
 * Activity over time - Weekly bar chart showing purchases, sales, and maturations
 */
export function createActivityOverTimeGraph(transactions: TreasuryTransaction[]) {
  // Group by date and transaction type
  let grouped = groupByDateAndCategory(transactions, 'TRANSACTION_TYPE');
  
  // Resample to weekly
  grouped = resampleWeekly(grouped);
  
  // Convert to pivot table
  let pivot = pivotTable(grouped);
  
  // Combine MATURATION and MATURATION_OFFSET
  pivot = combineMaturationColumns(pivot);
  
  const dates = sortDates(Object.keys(pivot));
  
  // Prepare data for Plotly
  const traces: any[] = [];
  const categories = getUniqueCategories(pivot);
  
  // Add BUY trace
  if (categories.includes('BUY')) {
    traces.push({
      x: dates,
      y: dates.map(d => pivot[d]?.['BUY'] || 0),
      name: 'Purchases',
      type: 'bar',
      marker: { color: PLOTLY_COLORS.T10[0] }
    });
  }
  
  // Add SELL trace
  if (categories.includes('SELL')) {
    traces.push({
      x: dates,
      y: dates.map(d => pivot[d]?.['SELL'] || 0),
      name: 'Sales',
      type: 'bar',
      marker: { color: PLOTLY_COLORS.T10[1] }
    });
  }
  
  // Add MATURATION trace
  if (categories.includes('MATURATION')) {
    traces.push({
      x: dates,
      y: dates.map(d => pivot[d]?.['MATURATION'] || 0),
      name: 'Maturation',
      type: 'bar',
      marker: { color: PLOTLY_COLORS.T10[2] }
    });
  }
  
  const layout = {
    title: 'Bond purchases over time',
    template: 'plotly_dark',
    xaxis: {
      title: 'Monthly purchases vs. maturing bonds',
      tickangle: -45
    },
    yaxis: {
      title: 'Face value in $'
    },
    barmode: 'group'
  };
  
  return { data: traces, layout };
}

/**
 * Net activity over time - Monthly bar chart showing net purchases
 */
export function createNetActivityOverTimeGraph(transactions: TreasuryTransaction[]) {
  // Group by date and transaction type
  let grouped = groupByDateAndCategory(transactions, 'TRANSACTION_TYPE');
  
  // Resample to monthly
  grouped = resampleMonthly(grouped);
  
  // Convert to pivot table
  let pivot = pivotTable(grouped);
  
  // Combine MATURATION and MATURATION_OFFSET
  pivot = combineMaturationColumns(pivot);
  
  // Calculate total (net activity)
  const totals = calculateTotal(pivot, []);
  
  const dates = sortDates(Object.keys(pivot));
  
  const trace = {
    x: dates,
    y: dates.map(d => totals[d] || 0),
    name: 'Net purchases',
    type: 'bar',
    marker: { color: PLOTLY_COLORS.Alphabet[0] }
  };
  
  const layout = {
    title: 'Net Bond activity over time',
    template: 'plotly_dark',
    xaxis: {
      title: 'Monthly purchases vs. maturing bonds',
      tickangle: -45
    },
    yaxis: {
      title: 'Net face value (+ve = net bought, -ve net sold/matured)'
    }
  };
  
  return { data: [trace], layout };
}

/**
 * Cumulative position - Stacked bars by product type with cumulative sum
 */
export function createCumulativePositionGraph(transactions: TreasuryTransaction[]) {
  // Group by date and product type
  let grouped = groupByDateAndCategory(transactions, 'PRODUCT_TYPE');
  
  // Resample to monthly
  grouped = resampleMonthly(grouped);
  
  // Convert to pivot table
  let pivot = pivotTable(grouped);
  
  const dates = sortDates(Object.keys(pivot));
  
  // Calculate cumulative sum
  const cumulative = cumulativeSum(pivot, dates);
  
  // Convert to trillions
  const cumulativeTrillions = convertToTrillions(cumulative);
  
  // Calculate total for hover data
  const totals = calculateTotal(cumulativeTrillions, []);
  
  // Get product types (excluding TOTAL if it exists)
  const productTypes = getUniqueCategories(cumulativeTrillions);
  
  // Create traces for each product type
  const traces: any[] = productTypes.map((productType, index) => ({
    x: dates,
    y: dates.map(d => cumulativeTrillions[d]?.[productType] || 0),
    name: productType,
    type: 'bar',
    marker: { color: PLOTLY_COLORS.T10[index % PLOTLY_COLORS.T10.length] },
    customdata: dates.map(d => totals[d] || 0),
    hovertemplate: '<b>%{x|%b %Y}</b><br>%{y:.2f} from %{fullData.name}<br><b>Total: %{customdata:.2f}T</b><extra></extra>'
  }));
  
  const layout = {
    title: 'Cumulative Monthly Directed Quantity by Product Type',
    template: 'plotly_dark',
    xaxis: { title: 'Month' },
    yaxis: { title: 'Directed Quantity' },
    barmode: 'stack'
  };
  
  return { data: traces, layout };
}

/**
 * Term activity - Stacked bars by term categories
 */
export function createTermActivityGraph(transactions: TreasuryTransaction[]) {
  const termCategories = [
    '0 - 3 months',
    '>3 months - 1 year',
    '>1 year - 3 years',
    '>3 years - 5 years',
    '>5 years - 10 years',
    '>10 years'
  ];
  
  // Group by date and adjusted term
  let grouped = groupByDateAndCategory(transactions, 'ADJUSTED_TERM');
  
  // Resample to monthly
  grouped = resampleMonthly(grouped);
  
  // Convert to pivot table
  let pivot = pivotTable(grouped);
  
  // Filter from September 2022
  pivot = filterByStartDate(pivot, '2022-09-01');
  
  // Ensure all term categories exist
  pivot = ensureCategories(pivot, termCategories);
  
  // Reorder categories
  pivot = reorderCategories(pivot, termCategories);
  
  // Convert to billions
  pivot = convertToBillions(pivot);
  
  const dates = sortDates(Object.keys(pivot));
  
  // Create traces for each term category
  const traces: any[] = termCategories.map((category, index) => ({
    x: dates,
    y: dates.map(d => pivot[d]?.[category] || 0),
    name: category,
    type: 'bar',
    marker: { color: PLOTLY_COLORS.T10[index % PLOTLY_COLORS.T10.length] }
  }));
  
  const layout = {
    title: 'Bond Activity by Term Category',
    template: 'plotly_dark',
    xaxis: {
      title: 'Date',
      tickangle: -45
    },
    yaxis: {
      title: 'Directed Quantity (Billions)',
      side: 'left'
    },
    barmode: 'stack',
    legend: {
      orientation: 'h',
      yanchor: 'bottom',
      y: 1.02,
      xanchor: 'left',
      x: 0.35
    }
  };
  
  return { data: traces, layout };
}

/**
 * Recent activity - Stacked bars by product type with moving average and Treasury yield
 * Note: Treasury yield requires external API call - will be handled in the component
 */
export function createRecentActivityGraph(
  transactions: TreasuryTransaction[],
  treasuryYieldData?: { dates: string[]; values: number[] }
) {
  // Group by date and product type
  let grouped = groupByDateAndCategory(transactions, 'PRODUCT_TYPE');
  
  // Resample to monthly
  grouped = resampleMonthly(grouped);
  
  // Convert to pivot table
  let pivot = pivotTable(grouped);
  
  // Filter from September 2022
  pivot = filterByStartDate(pivot, '2022-09-01');
  
  // Convert to billions
  pivot = convertToBillions(pivot);
  
  const dates = sortDates(Object.keys(pivot));
  
  // Calculate total
  const totals = calculateTotal(pivot, []);
  const totalValues = dates.map(d => totals[d] || 0);
  
  // Calculate 6-month moving average
  const movingAvg = movingAverage(totalValues, 6);
  
  // Get product types (excluding TOTAL if it exists)
  const productTypes = getUniqueCategories(pivot);
  
  // Create traces for each product type
  const traces: any[] = productTypes.map((productType, index) => ({
    x: dates,
    y: dates.map(d => pivot[d]?.[productType] || 0),
    name: productType,
    type: 'bar',
    marker: { color: PLOTLY_COLORS.T10[index % PLOTLY_COLORS.T10.length] },
    yaxis: 'y1'
  }));
  
  // Add moving average line
  traces.push({
    x: dates,
    y: movingAvg,
    name: '6-Month Moving Avg',
    type: 'scatter',
    mode: 'lines',
    line: { color: 'white', width: 2, dash: 'dot' },
    yaxis: 'y1'
  });
  
  // Add Treasury yield line if provided
  if (treasuryYieldData && treasuryYieldData.dates.length > 0) {
    traces.push({
      x: treasuryYieldData.dates,
      y: treasuryYieldData.values,
      name: '10-Year Treasury Yield',
      type: 'scatter',
      mode: 'lines',
      line: { color: 'yellow', width: 2 },
      yaxis: 'y2'
    });
  }
  
  const layout: any = {
    title: 'Net Bond Activity by Product Type with 10-Year Treasury Yield',
    template: 'plotly_dark',
    xaxis: { title: 'Date', tickangle: -45 },
    yaxis: {
      title: 'Directed Quantity (Billions)',
      side: 'left'
    },
    barmode: 'stack',
    legend: {
      orientation: 'h',
      yanchor: 'bottom',
      y: 1.02,
      xanchor: 'left',
      x: 0.35
    }
  };
  
  // Add second y-axis if Treasury yield data is provided
  if (treasuryYieldData && treasuryYieldData.values.length > 0) {
    const minYield = Math.min(...treasuryYieldData.values);
    const maxYield = Math.max(...treasuryYieldData.values);
    layout.yaxis2 = {
      title: '10-Year Treasury Yield (%)',
      side: 'right',
      overlaying: 'y',
      showgrid: false,
      range: [minYield * 0.9, maxYield * 1.1]
    };
  }
  
  return { data: traces, layout };
}

