<script lang='ts'>
  import type { formError } from "$lib/types";

  // fieldName was previously typed `keyof formError`, which TS resolves
  // to `string | number | symbol`. The downstream consumers
  // (handleChange/handleFocus/handleBlur/displayError) and the DOM
  // attribute bindings (`for={fieldName}`, `id={fieldName}`,
  // `name={fieldName}`) all expect plain strings — `keyof formError`
  // can't narrow there. Loosened to `string`; formError already has
  // `[x: string]: any`, so any string fieldName indexes correctly into
  // the `inputValue[fieldName]` lookup below.
  export let fieldName: string;
  export let inputValue: formError;
  export let focusedElement: string | null;
  export let handleChange: (fieldName: string, value: string) => void;
  export let handleFocus: (field: string) => void;
  export let handleBlur: (field: string) => void;
  export let displayError: (fieldName: string) => boolean;

  // Check if form is not null before using it to initialize inputValue
  let form: formError | null = null;
  $: inputValue = form ? form : {};
</script>

<label for={fieldName}>
  <span class={`${focusedElement === fieldName || inputValue[fieldName] ? 'labelFloat' : ''}`}>
    <slot>Enter your {fieldName}</slot>
  </span>
  <input
    on:focus={() => handleFocus(fieldName)}
    on:change={(event) => handleChange(fieldName, (event.target as HTMLInputElement).value)}
    on:blur={() => handleBlur(fieldName)}
    id={fieldName}
    name={fieldName}
    value={inputValue[fieldName]?.toString() ?? ''}
  />
  {#if displayError(fieldName)}
    <div class="error_message">
      <p class='form_error'>⚠️ Enter {fieldName}</p>
    </div>
  {/if}
</label>
