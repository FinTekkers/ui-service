<!-- US-307: the Business date picker for /free/soma and /free. Choosing a
     date reloads the page for ?asOf=<date>; the server load snaps it to its
     H.4.1 week (a Wednesday) and every section names that week. -->
<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";

  /** The week shown (ISO), and the latest date the picker allows. */
  export let asOf: string;
  export let today: string;

  function onChange(event: Event): void {
    const value = (event.currentTarget as HTMLInputElement).value;
    if (!value) return;
    const url = new URL($page.url);
    url.searchParams.set("asOf", value);
    goto(`${url.pathname}${url.search}`, { keepFocus: true, noScroll: true });
  }
</script>

<div class="week-picker">
  <label>
    <span>Business date</span>
    <input type="date" value={asOf} max={today} on:change={onChange} />
  </label>
  <p>Holdings are weekly, as of each Wednesday's H.4.1 release.</p>
</div>

<style>
  .week-picker {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 16px;
  }
  label {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    font-weight: 600;
  }
  input {
    min-height: 40px;
    box-sizing: border-box;
    padding: 0 12px;
    border: 1px solid #c9cfd8;
    border-radius: 8px;
    font-family: var(--mono);
    font-size: 14px;
  }
  p {
    margin: 0;
    font-size: 13px;
    color: var(--muted);
  }
</style>
