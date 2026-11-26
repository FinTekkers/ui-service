<!-- /free/request (US-352): "Request a free analysis", from the owner's
     "Request Free Analysis" canvas, inside the Free data explorer shell
     (../+layout.svelte). The form posts to this page's action
     (./+page.server.ts), which emails the request; it works without JS, and
     use:enhance swaps in the confirmation without a reload. -->
<script lang="ts">
  import { enhance } from "$app/forms";
  import {
    DESCRIPTION_MAX,
    EMAIL_HELP,
    REQUEST_KINDS,
    TITLE_MAX,
    URL_MAX,
    USE_CASES,
    type FreeRequestField,
    type FreeRequestFormState,
  } from "$lib/free/request";

  export let form: FreeRequestFormState | null = null;

  let submitting = false;

  $: values = form?.values;
  $: errors = form?.errors ?? {};
  // Reset when the form changes: errors keep what was sent, a new visit
  // (Send another request) starts empty.
  let description = "";
  $: description = form?.values?.description ?? "";

  $: errorId = (field: FreeRequestField): string | undefined =>
    errors[field] ? `${field}-error` : undefined;
</script>

<svelte:head>
  <title>Request a free analysis · Free data explorer · Fintekkers</title>
</svelte:head>

<div class="request">
  {#if form?.success}
    <section class="card confirmation" aria-labelledby="request-sent-title">
      <p class="eyebrow">Request sent</p>
      <h2 id="request-sent-title" class="section-title">
        Thanks — we've got your request
      </h2>
      <p>
        We read every request. We'll email you if we need more detail, and again
        when your analysis is live in the free data explorer.
      </p>
      <div class="actions">
        <a class="button primary" href="/free/request">Send another request</a>
        <a class="button secondary" href="/free"
          >Back to the free data explorer</a
        >
      </div>
    </section>
  {:else}
    <section class="card form-card" aria-labelledby="request-title">
      <p class="eyebrow">Free analysis</p>
      <h2 id="request-title" class="section-title">Request a free analysis</h2>
      <p class="lede">
        Missing a chart or dataset? Tell us what you'd like to see and we'll
        consider building it into the free data explorer.
      </p>

      {#if form?.formError}
        <p class="form-error" role="alert">{form.formError}</p>
      {/if}

      <form
        method="POST"
        use:enhance={() => {
          submitting = true;
          return async ({ update }) => {
            await update();
            submitting = false;
          };
        }}
      >
        <fieldset class="kind">
          <legend>What are you asking for?</legend>
          <div class="toggle">
            {#each REQUEST_KINDS as kind (kind.value)}
              <label>
                <input
                  type="radio"
                  name="kind"
                  value={kind.value}
                  checked={(values?.kind ?? "chart") === kind.value}
                />
                <span>{kind.label}</span>
              </label>
            {/each}
          </div>
        </fieldset>

        <div class="field">
          <label for="request-title-input">Short title</label>
          <input
            id="request-title-input"
            name="title"
            type="text"
            required
            maxlength={TITLE_MAX}
            placeholder="e.g. 10-year breakeven inflation since 2003"
            value={values?.title ?? ""}
            aria-invalid={errors.title ? "true" : undefined}
            aria-describedby={errorId("title")}
          />
          {#if errors.title}
            <p id="title-error" class="error">{errors.title}</p>
          {/if}
        </div>

        <div class="field">
          <div class="label-row">
            <label for="request-description">Description</label>
            <span class="counter" aria-live="polite"
              >{description.length.toLocaleString("en-US")} / {DESCRIPTION_MAX.toLocaleString(
                "en-US"
              )}</span
            >
          </div>
          <textarea
            id="request-description"
            name="description"
            rows="6"
            required
            maxlength={DESCRIPTION_MAX}
            placeholder="What should it show, over what period, and what question would it answer?"
            bind:value={description}
            aria-invalid={errors.description ? "true" : undefined}
            aria-describedby={errorId("description")}
          />
          {#if errors.description}
            <p id="description-error" class="error">{errors.description}</p>
          {/if}
        </div>

        <div class="field">
          <label for="request-url"
            >Example or data-source URL <span class="optional">(optional)</span
            ></label
          >
          <input
            id="request-url"
            name="url"
            type="url"
            maxlength={URL_MAX}
            placeholder="https://"
            value={values?.url ?? ""}
            aria-invalid={errors.url ? "true" : undefined}
            aria-describedby={errorId("url")}
          />
          {#if errors.url}
            <p id="url-error" class="error">{errors.url}</p>
          {/if}
        </div>

        <div class="field">
          <label for="request-use-case"
            >How would you use it? <span class="optional">(optional)</span
            ></label
          >
          <select
            id="request-use-case"
            name="useCase"
            aria-invalid={errors.useCase ? "true" : undefined}
            aria-describedby={errorId("useCase")}
          >
            {#each USE_CASES as useCase (useCase.value)}
              <option
                value={useCase.value}
                selected={(values?.useCase ?? "") === useCase.value}
                >{useCase.label}</option
              >
            {/each}
          </select>
          {#if errors.useCase}
            <p id="useCase-error" class="error">{errors.useCase}</p>
          {/if}
        </div>

        <div class="field">
          <label for="request-email">Email</label>
          <input
            id="request-email"
            name="email"
            type="email"
            required
            autocomplete="email"
            value={values?.email ?? ""}
            aria-invalid={errors.email ? "true" : undefined}
            aria-describedby={errors.email
              ? "email-error email-help"
              : "email-help"}
          />
          <p id="email-help" class="help">{EMAIL_HELP}</p>
          {#if errors.email}
            <p id="email-error" class="error">{errors.email}</p>
          {/if}
        </div>

        <!-- Honeypot: people never see or fill this; bots that do are
             thanked and not sent. -->
        <div class="hp" aria-hidden="true">
          <label for="request-website">Website</label>
          <input
            id="request-website"
            name="website"
            type="text"
            tabindex="-1"
            autocomplete="off"
          />
        </div>

        <button class="button primary" type="submit" disabled={submitting}>
          {submitting ? "Sending…" : "Send request"}
        </button>
      </form>
    </section>
  {/if}

  <aside class="sidebar">
    <section class="card side" aria-labelledby="next-title">
      <h3 id="next-title" class="panel-title">What happens next</h3>
      <ol>
        <li>We read every request, usually within a couple of working days.</li>
        <li>If we need more detail, we reply to the email you gave us.</li>
        <li>
          When your analysis is live in the free data explorer, we email you the
          link.
        </li>
      </ol>
    </section>
    <section class="card side" aria-labelledby="specific-title">
      <h3 id="specific-title" class="panel-title">
        Good requests are specific
      </h3>
      <ul>
        <li>Name the series, tickers or securities.</li>
        <li>Say the time range and frequency you need.</li>
        <li>Link an example chart or the data source, if you have one.</li>
        <li>Tell us the question you're trying to answer.</li>
      </ul>
    </section>
  </aside>
</div>

<style>
  .request {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
    gap: 24px;
    align-items: start;
  }
  @media (max-width: 860px) {
    .request {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .card {
    background: #ffffff;
    border: 1px solid var(--line);
    border-radius: 12px;
  }
  .form-card,
  .confirmation {
    padding: clamp(24px, 4vw, 40px);
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
  }
  .eyebrow {
    margin: 0;
    font-family: var(--mono);
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--accent);
  }
  .section-title {
    margin: 0;
    font-weight: 700;
    font-size: clamp(24px, 2.6vw, 30px);
    line-height: 1.15;
    letter-spacing: -0.02em;
  }
  .panel-title {
    margin: 0;
    font-weight: 700;
    font-size: 18px;
  }
  .lede,
  .confirmation p:not(.eyebrow) {
    margin: 0;
    max-width: 60ch;
    font-size: 17px;
    line-height: 1.6;
    color: #33404f;
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-top: 8px;
  }
  fieldset {
    margin: 0;
    padding: 0;
    border: 0;
    min-width: 0;
  }
  legend,
  .field label {
    padding: 0;
    margin-bottom: 8px;
    font-size: 15px;
    font-weight: 600;
    color: var(--ink);
  }
  .optional {
    font-weight: 400;
    color: var(--muted);
  }
  .toggle {
    display: inline-flex;
    flex-wrap: wrap;
    border: 1px solid #c9cfd8;
    border-radius: 8px;
    overflow: hidden;
  }
  .toggle label {
    position: relative;
    display: flex;
  }
  .toggle input {
    position: absolute;
    opacity: 0;
    width: 1px;
    height: 1px;
  }
  .toggle span {
    min-height: 44px;
    padding: 0 18px;
    display: flex;
    align-items: center;
    font-size: 15px;
    color: var(--ink);
    background: #ffffff;
    cursor: pointer;
  }
  .toggle label + label span {
    border-left: 1px solid #c9cfd8;
  }
  .toggle input:checked + span {
    background: var(--ink);
    color: #ffffff;
    font-weight: 600;
  }
  .toggle input:focus-visible + span {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }
  .field {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .label-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
  }
  .counter {
    font-family: var(--mono);
    font-size: 13px;
    color: var(--muted);
  }
  input[type="text"],
  input[type="url"],
  input[type="email"],
  textarea,
  select {
    box-sizing: border-box;
    width: 100%;
    min-height: 44px;
    padding: 10px 12px;
    border: 1px solid #c9cfd8;
    border-radius: 8px;
    background: #ffffff;
    font-family: inherit;
    font-size: 15px;
    color: var(--ink);
  }
  textarea {
    resize: vertical;
    line-height: 1.5;
  }
  input:focus-visible,
  textarea:focus-visible,
  select:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
  [aria-invalid="true"] {
    border-color: #b42318;
  }
  .help {
    margin: 8px 0 0;
    font-size: 14px;
    line-height: 1.5;
    color: var(--muted);
  }
  .error,
  .form-error {
    margin: 6px 0 0;
    font-size: 14px;
    color: #b42318;
  }
  .form-error {
    margin: 0;
    padding: 12px 14px;
    border-radius: 8px;
    background: #fef3f2;
  }
  .hp {
    position: absolute;
    left: -10000px;
    width: 1px;
    height: 1px;
    overflow: hidden;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 8px;
  }
  .button {
    min-height: 44px;
    padding: 0 20px;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family: inherit;
    font-size: 15px;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
  }
  .primary {
    align-self: flex-start;
    border: 1px solid var(--accent);
    background: var(--accent);
    color: #ffffff;
  }
  .primary:hover {
    background: var(--accent-hover);
    border-color: var(--accent-hover);
  }
  .primary:disabled {
    opacity: 0.6;
    cursor: default;
  }
  .secondary {
    border: 1px solid #c9cfd8;
    background: #ffffff;
    color: var(--ink);
  }
  .secondary:hover {
    border-color: var(--ink);
  }
  .sidebar {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }
  .side {
    padding: 22px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .side ol,
  .side ul {
    margin: 0;
    padding-left: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 15px;
    line-height: 1.55;
    color: #33404f;
  }
  .side ol {
    list-style: decimal;
  }
  .side ul {
    list-style: disc;
  }
</style>
