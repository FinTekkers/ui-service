<script lang='ts'>
  import type { formError } from "$lib/types";

  export let fieldName: keyof formError;
  export let inputValue: formError;
  export let focusedElement: string | null;
  export let handleChange: (fieldName: string, value: string) => void;
  export let handleFocus: (field: string) => void;
  export let handleBlur: (field: string) => void;
  export let displayError: (fieldName: string) => boolean;

  // Check if form is not null before using it to initialize inputValue
  let form: formError | null = null;
  $: inputValue = form ? form : {};

  // Display function
  const display = (fieldName: string) => {
  if (form && form.formError) { // Check if form and formError are defined
    const errors = Array.from(form.formError); // Ensure form.formError is defined
    return errors.includes(fieldName);
  }
  return false;
};

</script>

<label for={fieldName}>
  <span class={`${focusedElement === fieldName || inputValue[fieldName] ? 'labelFloat' : ''}`}>
    <slot>Enter your {fieldName}</slot>
  </span>
  <textarea
    on:focus={() => handleFocus(fieldName)}
    on:change={(event) => handleChange(fieldName, event?.target.value)}
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
