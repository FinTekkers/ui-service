<script lang="ts">
  import DashboardSideBar from '../../../../components/DashboardSideBar.svelte';
  import measuresData from '$lib/data/measures.json';
  import fieldsData from '$lib/data/fields.json';

  export let data: import('./$types').PageData;

  let activeTab: 'measures' | 'fields' = 'measures';
  let searchQuery = '';
  let selectedCategory = '';

  $: measureCategories = [...new Set(
    measuresData.measures.filter(m => m.category !== 'sentinel').map(m => m.category)
  )].sort();
  $: fieldCategories = [...new Set(
    fieldsData.fields.filter(f => f.category !== 'sentinel').map(f => f.category)
  )].sort();
  $: categories = activeTab === 'measures' ? measureCategories : fieldCategories;

  function switchTab(tab: 'measures' | 'fields') {
    activeTab = tab;
    selectedCategory = '';
    searchQuery = '';
  }

  $: filteredMeasures = measuresData.measures
    .filter(m => m.category !== 'sentinel')
    .filter(m => !selectedCategory || m.category === selectedCategory)
    .filter(m => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return m.display_name.toLowerCase().includes(q)
        || m.description.toLowerCase().includes(q)
        || m.name.toLowerCase().includes(q)
        || (m.formula && m.formula.toLowerCase().includes(q));
    });

  $: filteredFields = fieldsData.fields
    .filter(f => f.category !== 'sentinel')
    .filter(f => !selectedCategory || f.category === selectedCategory)
    .filter(f => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return f.display_name.toLowerCase().includes(q)
        || f.description.toLowerCase().includes(q)
        || f.name.toLowerCase().includes(q);
    });

  $: groupedMeasures = groupBy(filteredMeasures, m => m.category);
  $: groupedFields = groupBy(filteredFields, f => f.category);

  function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
    const groups: Record<string, T[]> = {};
    for (const item of items) {
      const key = keyFn(item);
      (groups[key] ??= []).push(item);
    }
    return groups;
  }

  function formatCategory(cat: string): string {
    return cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  function formatAppliesTo(items: string[]): string {
    return items.map(s => s.replace(/_SECURITY/g, '').replace(/_/g, ' ')).join(', ');
  }

  let expandedMeasure: string | null = null;
  let expandedField: string | null = null;

  function toggleMeasure(name: string) {
    expandedMeasure = expandedMeasure === name ? null : name;
  }
  function toggleField(name: string) {
    expandedField = expandedField === name ? null : name;
  }
</script>

<div class="w-screen h-full flex">
  <DashboardSideBar {data} />

  <div class="h-full w-full dashboard-container">
    <div class="portfolio_container px-10 py-7">
      <h2 class="text-3xl font-extrabold my-3">Data Catalog</h2>

      <!-- Tab bar — same pattern as calculators page -->
      <div class="tab-bar">
        <button class="tab-btn" class:active={activeTab === 'measures'} on:click={() => switchTab('measures')}>
          Measures ({measuresData.measures.length - 1})
        </button>
        <button class="tab-btn" class:active={activeTab === 'fields'} on:click={() => switchTab('fields')}>
          Fields ({fieldsData.fields.length - 1})
        </button>
      </div>

      <!-- Filters row -->
      <div class="filter-row">
        <input
          type="text"
          class="filter-input"
          placeholder="Search {activeTab}..."
          bind:value={searchQuery}
        />
        <select class="filter-input filter-select" bind:value={selectedCategory}>
          <option value="">All Categories</option>
          {#each categories as cat}
            <option value={cat}>{formatCategory(cat)}</option>
          {/each}
        </select>
      </div>

      <!-- Measures view -->
      {#if activeTab === 'measures'}
        {#each Object.entries(groupedMeasures) as [category, measures]}
          <h3 class="group-label">{formatCategory(category)}</h3>
          <div class="table-wrapper">
            <table class="text-left">
              <thead class="border-b border-slate-400">
                <tr>
                  <th class="text-semibold px-4 py-2">Measure</th>
                  <th class="text-semibold px-4 py-2">Applies To</th>
                  <th class="text-semibold px-4 py-2">Units</th>
                  <th class="text-semibold px-4 py-2">Description</th>
                </tr>
              </thead>
              <tbody>
                {#each measures as m}
                  <tr class="table-row border-b border-slate-400 clickable-row" on:click={() => toggleMeasure(m.name)}>
                    <td class="table-cell px-4 py-2 name-cell">
                      <strong>{m.display_name}</strong>
                      {#if !m.implemented}<span class="badge-planned">Planned</span>{/if}
                      <br/><span class="mono-sub">{m.name}</span>
                    </td>
                    <td class="table-cell px-4 py-2">{formatAppliesTo(m.applies_to)}</td>
                    <td class="table-cell px-4 py-2 units-cell">{m.units ?? '—'}</td>
                    <td class="table-cell px-4 py-2">{m.description}</td>
                  </tr>
                  {#if expandedMeasure === m.name}
                    <tr class="detail-row">
                      <td class="table-cell px-4 py-2" colspan="4">
                        {#if m.formula}
                          <div class="detail-block">
                            <span class="detail-label">Formula:</span>
                            <code class="detail-code">{m.formula}</code>
                          </div>
                        {/if}
                        {#if m.model_assumptions && m.model_assumptions.length > 0}
                          <div class="detail-block">
                            <span class="detail-label">Model Assumptions:</span>
                            <ul class="detail-list">
                              {#each m.model_assumptions as assumption}
                                <li>{assumption}</li>
                              {/each}
                            </ul>
                          </div>
                        {/if}
                      </td>
                    </tr>
                  {/if}
                {/each}
              </tbody>
            </table>
          </div>
        {/each}

        {#if filteredMeasures.length === 0}
          <p class="empty-msg">No measures match your search.</p>
        {/if}
      {/if}

      <!-- Fields view -->
      {#if activeTab === 'fields'}
        {#each Object.entries(groupedFields) as [category, fields]}
          <h3 class="group-label">{formatCategory(category)}</h3>
          <div class="table-wrapper">
            <table class="text-left">
              <thead class="border-b border-slate-400">
                <tr>
                  <th class="text-semibold px-4 py-2">Field</th>
                  <th class="text-semibold px-4 py-2">Data Type</th>
                  <th class="text-semibold px-4 py-2">Applies To</th>
                  <th class="text-semibold px-4 py-2">Description</th>
                </tr>
              </thead>
              <tbody>
                {#each fields as f}
                  <tr class="table-row border-b border-slate-400">
                    <td class="table-cell px-4 py-2 name-cell">
                      <strong>{f.display_name}</strong>
                      <br/><span class="mono-sub">{f.name}</span>
                    </td>
                    <td class="table-cell px-4 py-2">{f.data_type ?? '—'}</td>
                    <td class="table-cell px-4 py-2">{f.applies_to.join(', ')}</td>
                    <td class="table-cell px-4 py-2">{f.description}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/each}

        {#if filteredFields.length === 0}
          <p class="empty-msg">No fields match your search.</p>
        {/if}
      {/if}
    </div>
  </div>
</div>

<style lang="scss">
  @import "../../../../styles/grid-table";

  .dashboard-container {
    background-color: $primary-color;
    overflow: auto;
  }

  /* Tab bar — matches calculators page exactly */
  .tab-bar {
    display: flex;
    gap: 0.25rem;
    border-bottom: 2px solid #164e63;
    margin-bottom: 16px;
  }

  .tab-btn {
    padding: 8px 20px;
    background: none;
    border: none;
    border-bottom: 3px solid transparent;
    margin-bottom: -2px;
    font-size: 0.9rem;
    font-weight: 500;
    color: #edfbfd;
    cursor: pointer;
    transition: all 0.15s;
    opacity: 0.7;

    &:hover { opacity: 1; }

    &.active {
      color: #7cd2ba;
      border-bottom-color: #7cd2ba;
      font-weight: 700;
      opacity: 1;
    }
  }

  /* Filter row */
  .filter-row {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
  }

  .filter-input {
    padding: 6px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.85rem;
    background-color: white;
    color: #05192a;
    height: 36px;
    box-sizing: border-box;

    &::placeholder { color: #86929c; }
  }

  .filter-select {
    width: 200px;
  }

  .filter-input:not(.filter-select) {
    flex: 1;
    max-width: 320px;
  }

  /* Category group heading */
  .group-label {
    font-size: 0.85rem;
    font-weight: 700;
    color: #7cd2ba;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 20px 0 4px 0;
  }

  /* Table wrapper — matches SecurityGrid */
  .table-wrapper {
    overflow-x: auto;
    width: 100%;
    margin-bottom: 8px;
  }

  /* Use grid-table's th/td styles as-is. Only add minor overrides: */
  td {
    vertical-align: top;
    white-space: normal;
  }

  .name-cell {
    min-width: 160px;
    white-space: nowrap;
  }

  .units-cell {
    font-size: 0.8rem;
    color: #a0adb7;
  }

  .mono-sub {
    font-size: 0.7rem;
    color: #a0adb7;
    font-family: monospace;
  }

  .badge-planned {
    display: inline-block;
    font-size: 0.65rem;
    padding: 1px 6px;
    border-radius: 3px;
    background-color: #c43d5a33;
    color: #e8788e;
    margin-left: 6px;
    vertical-align: middle;
  }

  .clickable-row {
    cursor: pointer;
  }

  /* Expanded detail row */
  .detail-row td {
    background-color: #0a2f3a;
    border-bottom: 1px solid #ddd;
  }

  .detail-block {
    margin-bottom: 8px;
    &:last-child { margin-bottom: 0; }
  }

  .detail-label {
    font-size: 0.75rem;
    font-weight: 700;
    color: #a0adb7;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .detail-code {
    display: block;
    font-size: 0.8rem;
    color: whitesmoke;
    background: #071f29;
    padding: 6px 10px;
    border-radius: 3px;
    margin-top: 4px;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .detail-list {
    margin: 4px 0 0 0;
    padding-left: 1.2em;
    list-style: disc;
    color: whitesmoke;

    li {
      font-size: 0.8rem;
      margin-bottom: 2px;
    }
  }

  .empty-msg {
    color: #a0adb7;
    font-size: 0.875rem;
    padding: 2rem 0;
    text-align: center;
  }
</style>
