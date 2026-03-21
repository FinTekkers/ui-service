<script>
  import { page } from '$app/stores';
</script>

<div class="error-container">
  <div class="error-card">
    <h1>Something went wrong</h1>
    <p class="error-message">{$page.error?.message ?? 'An unexpected error occurred'}</p>
    <button class="retry-button" on:click={() => location.reload()}>
      Retry
    </button>
  </div>
</div>

<style lang="scss">
  @import "../../../../style";

  .error-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    background-color: $primary-color;
    padding: 1rem;
  }

  .error-card {
    text-align: center;
    max-width: 28rem;
  }

  h1 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #f1f5f9;
    margin-bottom: 0.75rem;
  }

  .error-message {
    color: #94a3b8;
    margin-bottom: 1.5rem;
    line-height: 1.5;
  }

  .retry-button {
    background-color: #3b82f6;
    color: #fff;
    border: none;
    padding: 0.6rem 1.5rem;
    border-radius: 0.375rem;
    font-size: 0.95rem;
    cursor: pointer;
    transition: background-color 0.15s;

    &:hover {
      background-color: #2563eb;
    }
  }
</style>
