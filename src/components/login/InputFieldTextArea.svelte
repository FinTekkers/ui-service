<script lang='ts'>
  import type { formError } from "$lib/types";

  // Same fix as InputFieldText: `keyof formError` is `string | number |
  // symbol` which can't satisfy the string-typed downstream consumers.
  // formError has `[x: string]: any`, so any string keys index in.
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
  <textarea
    on:focus={() => handleFocus(fieldName)}
    on:change={(event) => handleChange(fieldName, (event.target as HTMLTextAreaElement).value)}
    on:blur={() => handleBlur(fieldName)}
    id={fieldName}
    name={fieldName}
    rows="3"
    value={inputValue[fieldName]?.toString() ?? ''}
  />
  {#if displayError(fieldName)}
    <div class="error_message">
      <p class='form_error'>⚠️ Enter {fieldName}</p>
    </div>
  {/if}
</label>
