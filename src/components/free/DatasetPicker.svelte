<!-- Dataset menu for the Free data explorer, from the DataExplorer.dc.html
     artboard. Lists FREE_DATASETS only (not the artboard's [Dataset 3..10]
     placeholders) and marks the current one with aria-current: the dataset
     whose id is selectedId when the page names one (/free shows SOMA),
     else the one at currentPath. -->
<script lang="ts">
  import { FREE_DATASETS, isCurrentDataset } from "$lib/free/datasets";
  import type { FreeDataset } from "$lib/free/datasets";

  export let currentPath: string;
  export let selectedId: FreeDataset["id"] | undefined = undefined;
  export let datasets: readonly FreeDataset[] = FREE_DATASETS;

  let open = false;
  let root: HTMLDivElement;
  let toggle: HTMLButtonElement;

  $: current = datasets.find((d) =>
    selectedId ? d.id === selectedId : isCurrentDataset(d, currentPath)
  );

  function close(): void {
    open = false;
  }

  function onKeydown(event: KeyboardEvent): void {
    if (open && event.key === "Escape") {
      close();
      toggle.focus();
    }
  }

  function onWindowClick(event: MouseEvent): void {
    if (open && !root.contains(event.target as Node)) close();
  }
</script>

<svelte:window on:click={onWindowClick} on:keydown={onKeydown} />

<div class="dataset-picker" bind:this={root}>
  <span id="ft-dataset-label" class="label">Public dataset</span>
  <button
    type="button"
    bind:this={toggle}
    aria-labelledby="ft-dataset-label ft-dataset-current"
    aria-expanded={open}
    aria-controls="ft-dataset-list"
    on:click={() => (open = !open)}
  >
    <span id="ft-dataset-current">{current?.label ?? "Choose a dataset"}</span>
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M4 6l4 4 4-4"
        stroke="#0D1B2A"
        stroke-width="1.8"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </button>
  <ul id="ft-dataset-list" class="menu" hidden={!open}>
    {#each datasets as dataset (dataset.id)}
      {@const isCurrent = dataset === current}
      <li>
        <a
          href={dataset.href}
          aria-current={!isCurrent
            ? undefined
            : currentPath === dataset.href
            ? "page"
            : "true"}
          on:click={close}
        >
          <span>{dataset.label}</span>
          {#if isCurrent}
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M3.5 8.5l3 3 6-7"
                stroke="#0D1B2A"
                stroke-width="1.8"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          {/if}
        </a>
      </li>
    {/each}
  </ul>
</div>

<style>
  .dataset-picker {
    display: flex;
    flex-direction: column;
    gap: 8px;
    position: relative;
    z-index: 5;
  }
  .label {
    font-family: var(--mono);
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
  }
  button {
    width: 100%;
    min-height: 48px;
    box-sizing: border-box;
    padding: 0 16px;
    border: 1px solid #c9cfd8;
    border-radius: 8px;
    background: #ffffff;
    font-family: inherit;
    font-size: 15px;
    font-weight: 600;
    color: var(--ink);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    text-align: left;
    cursor: pointer;
  }
  button span,
  .menu a span {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  button svg,
  .menu svg {
    flex: none;
  }
  button:focus-visible,
  .menu a:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .menu {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    margin: 0;
    padding: 6px;
    list-style: none;
    background: #ffffff;
    border: 1px solid #c9cfd8;
    border-radius: 10px;
    box-shadow: 0 16px 32px -12px rgba(13, 27, 42, 0.25);
    max-height: 320px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }
  .menu[hidden] {
    display: none;
  }
  .menu a {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 44px;
    padding: 0 12px;
    border-radius: 6px;
    color: var(--ink);
    text-decoration: none;
    font-size: 15px;
  }
  .menu a:hover {
    background: var(--bg);
  }
  .menu a[aria-current] {
    background: #eef2fb;
    font-weight: 600;
  }
</style>
