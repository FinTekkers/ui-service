<!-- /contactus (US-356): Contact us in the public-site look, matching
     /free/request (US-352): the PublicShell nav and footer, and the shared
     form styles (src/lib/styles/ft-form.css). The form posts to ?/message
     (./+page.server.ts), which emails the message; it works without JS, and
     use:enhance swaps in the confirmation without a reload. -->
<script lang="ts">
  import { enhance } from "$app/forms";
  import PublicShell from "../../components/free/PublicShell.svelte";
  import type { ContactField, ContactFormState } from "$lib/contact";
  import "$lib/styles/ft-form.css";

  export let form: ContactFormState | null = null;

  let submitting = false;

  $: values = form?.values;
  $: errors = form?.errors ?? {};

  $: errorId = (field: ContactField): string | undefined =>
    errors[field] ? `${field}-error` : undefined;
</script>

<svelte:head>
  <title>Contact us · Fintekkers</title>
</svelte:head>

<PublicShell current="contact">
  <div class="contact ft-form">
    {#if form?.success}
      <section class="card confirmation" aria-labelledby="contact-sent-title">
        <svg
          class="sent-icon"
          width="40"
          height="40"
          viewBox="0 0 40 40"
          aria-hidden="true"
        >
          <circle cx="20" cy="20" r="20" fill="currentColor" />
          <path
            d="M12 20.5l5.5 5.5L28 15.5"
            stroke="#ffffff"
            stroke-width="3"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <p class="eyebrow">Message sent</p>
        <h2 id="contact-sent-title" class="section-title">
          Thanks, your message is sent
        </h2>
        <p>We'll reply to the email you gave us.</p>
        <div class="actions">
          <a class="button primary" href="/contactus">Send another message</a>
        </div>
      </section>
    {:else}
      <section class="card form-card" aria-labelledby="contact-title">
        <p class="eyebrow">Contact</p>
        <h2 id="contact-title" class="section-title">Contact us</h2>
        <p class="lede">
          Questions about Fintekkers, the free data explorer or the API? Send us
          a message and we'll reply by email.
        </p>

        {#if form?.formError}
          <p class="form-error" role="alert">{form.formError}</p>
        {/if}

        <form
          method="POST"
          action="?/message"
          novalidate
          use:enhance={() => {
            submitting = true;
            return async ({ update }) => {
              await update();
              submitting = false;
            };
          }}
        >
          <div class="names">
            <div class="field">
              <label for="firstname">First name</label>
              <input
                id="firstname"
                name="firstname"
                type="text"
                required
                autocomplete="given-name"
                value={values?.firstname ?? ""}
                aria-invalid={errors.firstname ? "true" : undefined}
                aria-describedby={errorId("firstname")}
              />
              {#if errors.firstname}
                <p id="firstname-error" class="error">{errors.firstname}</p>
              {/if}
            </div>

            <div class="field">
              <label for="lastname">Last name</label>
              <input
                id="lastname"
                name="lastname"
                type="text"
                required
                autocomplete="family-name"
                value={values?.lastname ?? ""}
                aria-invalid={errors.lastname ? "true" : undefined}
                aria-describedby={errorId("lastname")}
              />
              {#if errors.lastname}
                <p id="lastname-error" class="error">{errors.lastname}</p>
              {/if}
            </div>
          </div>

          <div class="field">
            <label for="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autocomplete="email"
              value={values?.email ?? ""}
              aria-invalid={errors.email ? "true" : undefined}
              aria-describedby={errorId("email")}
            />
            {#if errors.email}
              <p id="email-error" class="error">{errors.email}</p>
            {/if}
          </div>

          <div class="field">
            <label for="message">Message</label>
            <textarea
              id="message"
              name="message"
              rows="6"
              required
              value={values?.message ?? ""}
              aria-invalid={errors.message ? "true" : undefined}
              aria-describedby={errorId("message")}
            />
            {#if errors.message}
              <p id="message-error" class="error">{errors.message}</p>
            {/if}
          </div>

          <button class="button primary" type="submit" disabled={submitting}>
            {submitting ? "Sending…" : "Send message"}
          </button>
        </form>
      </section>
    {/if}
  </div>
</PublicShell>

<style>
  /* No FreeHeader here, so the card takes its 48px gap below the nav. */
  .contact {
    max-width: 760px;
    padding-top: 48px;
  }
  .names {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;
  }
  @media (max-width: 560px) {
    .names {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .sent-icon {
    color: var(--accent);
  }
</style>
