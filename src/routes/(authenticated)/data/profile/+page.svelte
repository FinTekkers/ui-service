<script lang="ts">
  import DashboardSideBar from '../../../../components/DashboardSideBar.svelte';
  import { enhance } from '$app/forms';

  export let data: import('./$types').PageData;
  export let form: import('./$types').ActionData;

  $: profile = data.profile ?? { email: '', firstname: '', lastname: '' };
  $: apiKey = form?.newKey ?? data.apiKey ?? '';

  let showApiKey = false;
  let copied = false;
  let regenerateConfirm = false;

  $: maskedKey = apiKey ? apiKey.slice(0, 8) + '•'.repeat(Math.max(0, apiKey.length - 12)) + apiKey.slice(-4) : 'No API key';

  function copyToClipboard() {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      copied = true;
      setTimeout(() => { copied = false; }, 2000);
    }
  }
</script>

<div class="w-screen h-full flex">
  <DashboardSideBar {data} />

  <div class="h-full w-full dashboard-container">
    <div class="portfolio_container px-10 py-7">
      <h2 class="text-3xl font-extrabold my-3">Profile</h2>

      {#if form?.success}
        <div class="success-banner">API key regenerated successfully.</div>
      {/if}
      {#if form?.error}
        <div class="error-banner">{form.error}</div>
      {/if}

      <!-- User Info -->
      <div class="profile-card">
        <h3 class="section-title">Account Information</h3>
        <div class="info-row">
          <span class="info-label">Email</span>
          <span class="info-value">{profile.email || '—'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">First Name</span>
          <span class="info-value">{profile.firstname || '—'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Last Name</span>
          <span class="info-value">{profile.lastname || '—'}</span>
        </div>
      </div>

      <!-- Logout -->
      <div class="profile-card">
        <form method="POST" action="?/logout">
          <button type="submit" class="btn-danger-outline">Sign Out</button>
        </form>
      </div>

      <!-- API Key -->
      <div class="profile-card">
        <h3 class="section-title">API Key</h3>
        <p class="api-description">Use this key to authenticate API requests. Keep it secret.</p>

        {#if apiKey}
          <div class="api-key-row">
            <code class="api-key-display">
              {showApiKey ? apiKey : maskedKey}
            </code>
            <button class="btn-secondary" on:click={() => showApiKey = !showApiKey}>
              {showApiKey ? 'Hide' : 'Show'}
            </button>
            <button class="btn-secondary" on:click={copyToClipboard}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <div class="regenerate-section">
            {#if !regenerateConfirm}
              <button class="btn-danger-outline" on:click={() => regenerateConfirm = true}>
                Regenerate API Key
              </button>
            {:else}
              <div class="confirm-row">
                <span class="confirm-text">This will invalidate your current key. Enter your credentials to confirm.</span>
              </div>
              <form method="POST" action="?/regenerateKey" use:enhance={() => {
                return async ({ update }) => {
                  regenerateConfirm = false;
                  await update();
                };
              }}>
                <div class="regen-form">
                  <input type="email" name="email" placeholder="Email" required class="regen-input" />
                  <input type="password" name="password" placeholder="Password" required class="regen-input" />
                  <div class="confirm-row">
                    <button type="submit" class="btn-danger">Yes, Regenerate</button>
                    <button type="button" class="btn-secondary" on:click={() => regenerateConfirm = false}>Cancel</button>
                  </div>
                </div>
              </form>
            {/if}
          </div>
        {:else}
          <div class="no-key-notice">
            <p>No API key available. Register with an email and password at <a href="/register">/register</a> to get an API key for API access.</p>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style lang="scss">
  @import "../../../../styles/grid-table";

  .dashboard-container {
    background-color: $primary-color;
    overflow: auto;
  }

  .success-banner {
    background-color: #065f46;
    color: #d1fae5;
    padding: 10px 16px;
    border-radius: 4px;
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 16px;
  }

  .error-banner {
    background-color: #7f1d1d;
    color: #fecaca;
    padding: 10px 16px;
    border-radius: 4px;
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 16px;
  }

  .profile-card {
    background-color: $bgc-color;
    border-radius: 6px;
    padding: 20px;
    margin-bottom: 20px;
  }

  .section-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: $white;
    margin-bottom: 16px;
  }

  .info-row {
    display: flex;
    gap: 16px;
    padding: 10px 0;
    border-bottom: 1px solid #164e63;

    &:last-child { border-bottom: none; }
  }

  .info-label {
    font-size: 0.85rem;
    color: $ltgrey;
    width: 120px;
    flex-shrink: 0;
  }

  .info-value {
    font-size: 0.85rem;
    color: $white;
    font-weight: 600;
  }

  .api-description {
    font-size: 0.8rem;
    color: $ltgrey;
    margin-bottom: 12px;
  }

  .api-key-row {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 16px;
  }

  .api-key-display {
    flex: 1;
    background: #071f29;
    padding: 10px 14px;
    border-radius: 4px;
    font-size: 0.85rem;
    color: $success;
    font-family: monospace;
    word-break: break-all;
  }

  .btn-secondary {
    padding: 8px 14px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: transparent;
    color: $white;
    font-size: 0.8rem;
    cursor: pointer;
    white-space: nowrap;

    &:hover { background-color: rgba(255, 255, 255, 0.1); }
  }

  .btn-danger-outline {
    padding: 8px 16px;
    border: 1px solid $error;
    border-radius: 4px;
    background: transparent;
    color: $error;
    font-size: 0.8rem;
    cursor: pointer;

    &:hover { background-color: rgba(196, 61, 90, 0.15); }
  }

  .btn-danger {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    background-color: $error;
    color: white;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;

    &:hover { background-color: #a33049; }
  }

  .regenerate-section {
    margin-top: 8px;
  }

  .confirm-row {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }

  .confirm-text {
    font-size: 0.8rem;
    color: #fbbf24;
  }

  .regen-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 10px;
    max-width: 320px;
  }

  .regen-input {
    padding: 8px 12px;
    border: 1px solid #164e63;
    border-radius: 4px;
    background: #071f29;
    color: $white;
    font-size: 0.85rem;

    &::placeholder { color: $ltgrey; }
  }

  .no-key-notice {
    background: #071f29;
    border: 1px solid #164e63;
    border-radius: 4px;
    padding: 16px;
    font-size: 0.85rem;
    color: $ltgrey;

    a {
      color: $success;
      text-decoration: underline;
    }
  }
</style>
