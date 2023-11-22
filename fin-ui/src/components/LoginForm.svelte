<script lang="ts">
  import Icon from "@iconify/svelte";
  import {isSignInOrSignUp} from '../store/store';
  

  let isPasswordVisible = false;

  const togglePasswordVisibility = ()=>{
    isPasswordVisible = !isPasswordVisible ;
  }

  export let data;
  export let form:Login.formError;



 </script>   



<div class="form w-full p-3 grid flex justify-center">
            <div class="form_container">
              {#if $isSignInOrSignUp}
              <h1 class="form_headline">Sign Up</h1>
              {:else}
               <h1 class="form_headline">Sign In</h1>
              {/if}

              {#if $isSignInOrSignUp}

              <div class="sign_up_fields">
               <label for="name">
                 <input class="rounded-md sign_up_name" type="text" name="name" id="name" placeholder="Enter name">
              </label>
              <label for="surname">
                <input class="rounded-md sign_up_surname" type="text" name="surname" id="surname" placeholder="Enter surname">
              </label>
              <label for="email">
                <input class="rounded-md sign_up_email" type="email" name="email" id="email" placeholder="Enter email">
              </label>
              <label for="password">
                <input class="rounded-md sign_up_password" 
                type={isPasswordVisible ? "text" : "password"}
                name="password" id="password" placeholder="Enter password">

                 {#if isPasswordVisible}
                 <span class="togglePasswordDisplayIcon_signUp" on:click={()=>togglePasswordVisibility()}>
                   <Icon
                      icon="solar:eye-linear"
                      style="width: 25px; height: 25px;"
                      
                    />
                 </span>
                  {:else}
                  <span class="togglePasswordDisplayIcon_signUp" on:click={()=>togglePasswordVisibility()}>
                    <Icon
                       icon="clarity:eye-hide-line"
                       style="width: 25px; height: 25px;"
                       
                     />
                  </span>
                 {/if}
              </label>
              <label for="confirmpassword">
                <input class="rounded-md sign_up_confirm_password" 
                type={isPasswordVisible ? "text" : "password"}
                name="confirmpassword" id="confirmpassword" placeholder="Confirm password">

         
              </label>

              <label for="">
              <button type="submit"  class="form_btn text-white font-bold py-2 px-4 rounded"
               >Sign Up →
             </button>
            </label>
              </div>

              {:else}

              <div class="sign_in_fields">
                <label for="Email">
                  <span>Email address:</span>
                  <input
                    class="rounded-md { "border-red-900"} text-slate-400 block bg-white w-full py-2 focus:outline-none focus:border-cyan-900 focus:ring-cyan-900 focus:ring-1 sm:text-sm"
                    type="text"
                    name="Email"
                    placeholder="Enter your email"
                  />
                
                </label>
                <label for="Password" class="passwordField">
                  <span>Password:</span>
                  <input
                    class="rounded-md {"border-red-900"} text-slate-400 block bg-white w-full py-2 focus:outline-none focus:border-cyan-900 focus:ring-cyan-900 focus:ring-1 sm:text-sm"
                     type={isPasswordVisible ? "text" : "password"}
                    name="Password"
                    placeholder="Enter your password"
                  />

                 {#if isPasswordVisible}
                 <span class="togglePasswordDisplayIcon" on:click={()=>togglePasswordVisibility()}>
                   <Icon
                      icon="solar:eye-linear"
                      style="width: 25px; height: 25px;"
                      
                    />
                 </span>
                  {:else}
                  <span class="togglePasswordDisplayIcon" on:click={()=>togglePasswordVisibility()}>
                    <Icon
                       icon="clarity:eye-hide-line"
                       style="width: 25px; height: 25px;"
                       
                     />
                  </span>
                 {/if}
              
                
                </label>

                <div class="error_message">
                  {#if form?.formError}
                      {#each form.formError as error}
                        <p>{error}</p>
                      {/each}
                  {/if}
                </div>
              
                {#if $isSignInOrSignUp}
                <button type="submit" class="form_btn text-white font-bold py-2 px-4 rounded"
                  >Sign Up →
                </button>
                {:else}
                 <button type="submit" class="form_btn text-white font-bold py-2 px-4 rounded"
                  >Sign In →
                </button>
                {/if}
                
              </div>

              {/if}
  
              <div class="divider">
                <div class="one border-t border-gray-500" />
                <div class="two border-t border-gray-500" />
                OR
              </div>
  
              <div class="google_OAuth">
                <button
                  type="submit"
                  class="font-bold py-2 px-4 rounded focus:outline-none focus:border-green-500 hover:border-green-500 focus:ring-green-500 focus:ring-1"
                >
                  <Icon
                    icon="flat-color-icons:google"
                    style="width: 25px; height: 25px;"
                  />
                  <span> Continue with Google </span>
                </button>
              </div>
            </div>
          </div>