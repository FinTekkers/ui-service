<script lang="ts">
  import { Authentication } from "../store/store";
  import "../app.css";

  const Authenticate = () => {
    Authentication.set(true);
  };
  const goto = (url: string) => (window.location.href = url);
</script>

<div class=" w-screen h-screen flex justify-center items-center">
  <div class="login_container grid grid-cols-2 rounded relative">
    <div class="branding branding-image p-2 rounded-xl">
      <div
        class="branding-image-overlay backdrop-blur-lg bg-black/30 rounded-lg"
      >
        <h1>FINTEKKERS</h1>

        <p>
          Thousands of Lorem ipsum dolor sit amet consectetur adipisicing elit.
          Fugit, fugiat ullam?
        </p>

        <h3>→ Join us today</h3>
      </div>
    </div>
    <div class="branding branding-form border p-2 rounded-xl">
      <button
        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        on:click={() => {
          Authenticate();

          if ($Authentication) {
            goto("/portfolios");
          }
        }}>Google login</button
      >
    </div>
  </div>
  <!-- <button class="button">Sign Up</button>
  <button class="button">Sign In</button>
  <button
    class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    on:click={() => {
      Authenticate();

      if ($Authentication) {
        goto("/");
      }
    }}>Google login</button
  > -->
</div>
