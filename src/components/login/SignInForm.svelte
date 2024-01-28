<script lang="ts">
    // external imports
  import Icon from "@iconify/svelte";
   //  internal imports  
  import {booleanStore, customBooleanStoreUpdater} from '../../store/store';
  import { booleanKeys } from "$lib/Util";
  import type {formError} from '$lib/types';
  import Google_OAuth from '../custom_components/Google_OAuth.svelte';

  export let form:formError;
</script>


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
                          type={$booleanStore.IS_PASSWORD_VISIBLE ? "text" : "password"}
                          name="Password"
                          placeholder="Enter your password"
                        />

                      {#if $booleanStore.IS_PASSWORD_VISIBLE}
                                <span class="togglePasswordDisplayIcon" on:keydown={()=>("x")} on:click={()=>customBooleanStoreUpdater(booleanKeys.IS_PASSWORD_VISIBLE)}>
                                    <Icon
                                        icon="solar:eye-linear"
                                        style="width: 25px; height: 25px;"
                                        
                                    />
                                </span>
                                {:else}
                                <span class="togglePasswordDisplayIcon" on:keydown={()=>("x")} on:click={()=>customBooleanStoreUpdater(booleanKeys.IS_PASSWORD_VISIBLE)}>
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
                    
                      {#if $booleanStore.IS_SIGN_IN_OR_SIGN_UP}
                            <button type="submit" class="form_btn text-white font-bold py-2 px-4 rounded"
                                >Sign Up →
                            </button>
                      {:else}
                            <button type="submit" class="form_btn text-white font-bold py-2 px-4 rounded"
                                >Sign In →
                            </button>
                      {/if}

                    <div class="divider">
                                    <div class="one border-t border-gray-500" />
                                    <span>OR</span>
                                    <div class="two border-t border-gray-500" />
                                   
                    </div>
        
                    <div class="google_OAuth">
                        <Google_OAuth />
                    </div>
                
</div>


<style lang="scss">
    @import "../../style.scss";

    .sign_in_fields{
            display: grid;
            grid-template-columns: 1fr ;
            grid-template-rows: auto ;
            grid-area: 2/1/6/-1;
            gap: 1em;

            label:nth-child(n){
            grid-column: 1/-1;
            color: $grey;

                    :is(button){
                        width: 100%;
                    }
            }


            .passwordField{
            position: relative;
            }

            :is(label){
                height: max-content;
                position: relative;
            
                :is(input){
                    width: 100%;
                    height: 3em;
                    color: $grey;
                    padding-left: 1em;
                    font-size: 1rem;
                }
            }
            
             .form_btn{
                background-color: $primary-color;
                height: 6vh;
            }

              .togglePasswordDisplayIcon{
                position: absolute;
                top: 50%;
                right: 5%;
                transition: all .5s ease-in-out;
                cursor: pointer;
                color: $grey;
            }


            .divider{
                grid-area:6/1/6/-1;
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                grid-template-rows: repeat(2, 20px);
                position: relative;
                justify-content: center;
                align-items: center;
                color: $grey;

                .one{
                    grid-column: 1/1;
                }

                .two{
                    grid-column: 3/3;

                }

                :is(span){
                    grid-column: 2/2;
                    position:absolute;
                    top: 0;
                    left: 50%;
                    transform: translateX(-50%);
                }


            }

            .google_OAuth{
                grid-area:7/1/7/-1;        
             
            }

    }


    .error_message{
        color: $error;
    }




</style>