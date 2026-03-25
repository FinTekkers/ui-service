<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { formatAmount } from '$lib/formatUtils';

  type SecurityData = {
    identifier: string;
    identifierType: string;
    settlementCurrency: string;
    cusip: string;
    uuidHex?: string;
    issueDate: string;
    maturityDate: string;
    outstandingAmount: string;
    issuerName: string;
    assetClass: string;
    securityType?: number;
    productType: string;
    productClass?: string;
    tenor?: string;
    couponRate?: string;
    couponType?: string;
    couponFrequency?: string;
    faceValue?: string;
    datedDate?: string;
    asOf: string;
  };

  export let security: SecurityData;

  const dispatch = createEventDispatcher();

  const SECURITY_TYPE_LABELS: Record<number, string> = {
    1: 'Cash',
    2: 'Equity',
    3: 'Bond',
    4: 'TIPS',
    5: 'FRN',
    6: 'Index',
    8: 'Equity Index',
  };

  const SECURITY_TYPE_CLASSES: Record<number, string> = {
    1: 'badge-cash',
    2: 'badge-equity',
    3: 'badge-bond',
    4: 'badge-tips',
    5: 'badge-frn',
    6: 'badge-index',
    8: 'badge-index',
  };

  $: securityTypeLabel = security.securityType != null
    ? (SECURITY_TYPE_LABELS[security.securityType] ?? String(security.securityType))
    : null;

  $: securityTypeBadgeClass = security.securityType != null
    ? (SECURITY_TYPE_CLASSES[security.securityType] ?? 'badge-bond')
    : 'badge-bond';

  $: couponDisplay = security.couponRate
    ? `${parseFloat(security.couponRate).toFixed(3)}%`
    : '—';

  $: faceValueDisplay = security.faceValue
    ? formatAmount(security.faceValue)
    : '—';

  $: outstandingDisplay = security.outstandingAmount
    ? formatAmount(security.outstandingAmount)
    : '—';

  function handleDelete() {
    dispatch('requestDelete', {
      cusip: security.identifier || security.cusip,
      uuidHex: security.uuidHex,
      issuerName: security.issuerName,
    });
  }
</script>

<div class="detail-container">

  <!-- Header -->
  <div class="detail-header">
    <div class="header-left">
      <div class="identifier-row">
        <span class="identifier-value">{security.identifier}</span>
        <span class="id-type-tag">{security.identifierType}</span>
        {#if securityTypeLabel}
          <span class="badge {securityTypeBadgeClass}">{securityTypeLabel}</span>
        {/if}
      </div>
      <div class="issuer-name">{security.issuerName}</div>
      <div class="sub-meta">
        {#if security.assetClass}<span>{security.assetClass}</span>{/if}
        {#if security.productType}<span class="sep">·</span><span>{security.productType}</span>{/if}
        {#if security.productClass}<span class="sep">·</span><span>{security.productClass}</span>{/if}
        {#if security.tenor}<span class="sep">·</span><span class="tenor">{security.tenor}</span>{/if}
      </div>
    </div>
    <div class="header-right">
      {#if security.uuidHex}
        <button class="btn-delete" on:click={handleDelete}>Delete</button>
      {/if}
    </div>
  </div>

  <!-- Key metrics -->
  <div class="section-grid">

    <div class="card">
      <div class="card-title">Dates</div>
      <div class="field-list">
        <div class="field-row">
          <span class="field-label">Issue Date</span>
          <span class="field-value">{security.issueDate || '—'}</span>
        </div>
        {#if security.datedDate && security.datedDate !== security.issueDate}
          <div class="field-row">
            <span class="field-label">Dated Date</span>
            <span class="field-value">{security.datedDate}</span>
          </div>
        {/if}
        <div class="field-row">
          <span class="field-label">Maturity Date</span>
          <span class="field-value highlight">{security.maturityDate || '—'}</span>
        </div>
        {#if security.tenor}
          <div class="field-row">
            <span class="field-label">Tenor</span>
            <span class="field-value">{security.tenor}</span>
          </div>
        {/if}
      </div>
    </div>

    <div class="card">
      <div class="card-title">Coupon</div>
      <div class="field-list">
        <div class="field-row">
          <span class="field-label">Rate</span>
          <span class="field-value highlight">{couponDisplay}</span>
        </div>
        {#if security.couponType}
          <div class="field-row">
            <span class="field-label">Type</span>
            <span class="field-value">{security.couponType}</span>
          </div>
        {/if}
        {#if security.couponFrequency}
          <div class="field-row">
            <span class="field-label">Frequency</span>
            <span class="field-value">{security.couponFrequency}</span>
          </div>
        {/if}
        <div class="field-row">
          <span class="field-label">Face Value</span>
          <span class="field-value">{faceValueDisplay}</span>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Issuance</div>
      <div class="field-list">
        <div class="field-row">
          <span class="field-label">Outstanding</span>
          <span class="field-value highlight">{outstandingDisplay}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Settlement CCY</span>
          <span class="field-value">{security.settlementCurrency || '—'}</span>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Reference</div>
      <div class="field-list">
        <div class="field-row">
          <span class="field-label">As Of</span>
          <span class="field-value">{security.asOf || '—'}</span>
        </div>
        {#if security.uuidHex}
          <div class="field-row uuid-row">
            <span class="field-label">UUID</span>
            <span class="field-value uuid-value" title={security.uuidHex}>{security.uuidHex.slice(0, 16)}…</span>
          </div>
        {/if}
      </div>
    </div>

  </div>
</div>

<style lang="scss">
  @import "../../styles/variables";

  .detail-container {
    margin: 24px 40px;
  }

  /* ── Header ── */
  .detail-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 20px 24px;
    background-color: $bgc-color;
    border-radius: $bd-radius $bd-radius 0 0;
    border: 1px solid $border-color;
    border-bottom: none;
  }

  .identifier-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 6px;
  }

  .identifier-value {
    font-size: 1.8rem;
    font-weight: 800;
    color: $tealwhite;
    letter-spacing: 0.02em;
  }

  .id-type-tag {
    font-size: 0.7rem;
    font-weight: 700;
    color: $grey;
    background-color: rgba(255,255,255,0.06);
    border: 1px solid $border-color;
    border-radius: 3px;
    padding: 2px 7px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    align-self: center;
  }

  .issuer-name {
    font-size: 1.05rem;
    font-weight: 600;
    color: $white;
    margin-bottom: 6px;
  }

  .sub-meta {
    font-size: 0.8rem;
    color: $grey;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
  }

  .sep { color: $border-color; }

  .tenor {
    color: $success;
    font-weight: 600;
  }

  /* ── Badges ── */
  .badge {
    font-size: 0.65rem;
    font-weight: 800;
    padding: 3px 9px;
    border-radius: 20px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    align-self: center;
  }

  .badge-bond  { background-color: #1e4d7b; color: #93c5fd; border: 1px solid #2563eb44; }
  .badge-tips  { background-color: #3b2f00; color: #fcd34d; border: 1px solid #d9770044; }
  .badge-frn   { background-color: #1e3a2f; color: #6ee7b7; border: 1px solid #05966444; }
  .badge-cash  { background-color: #1e3a1e; color: #86efac; border: 1px solid #16a34a44; }
  .badge-equity{ background-color: #3b1e3a; color: #e879f9; border: 1px solid #a21caf44; }
  .badge-index { background-color: #2a1e3a; color: #c4b5fd; border: 1px solid #7c3aed44; }

  /* ── Cards ── */
  .section-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    border: 1px solid $border-color;
    border-radius: 0 0 $bd-radius $bd-radius;
    overflow: hidden;
  }

  .card {
    background-color: $bgc-color;
    padding: 18px 20px;
    border-right: 1px solid $border-color;

    &:last-child { border-right: none; }
  }

  .card-title {
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: $grey;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid $border-color;
  }

  /* ── Fields ── */
  .field-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .field-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
  }

  .field-label {
    font-size: 0.75rem;
    color: $grey;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .field-value {
    font-size: 0.85rem;
    font-weight: 600;
    color: $white;
    text-align: right;

    &.highlight {
      color: $success;
    }
  }

  .uuid-row .field-value {
    font-family: monospace;
    font-size: 0.75rem;
    color: $grey;
  }

  /* ── Delete button ── */
  .btn-delete {
    background-color: $error;
    border: none;
    color: white;
    font-size: 0.8rem;
    font-weight: 700;
    padding: 6px 14px;
    border-radius: $bd-radius;
    cursor: pointer;
    transition: background-color 0.15s;

    &:hover { background-color: #a33049; }
  }
</style>
