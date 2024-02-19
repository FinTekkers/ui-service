<script lang="ts">
    // external imports
  import Icon from "@iconify/svelte";
   //  internal imports  
  import {booleanStore, customBooleanStoreUpdater} from '../../store/store';
  import { booleanKeys } from "$lib/Util";
  import type {formError} from '$lib/types';
  import Google_OAuth from '../custom_components/Google_OAuth.svelte';
  export let data: App.PageData;
  export let form:formError;

    const displayError = (fieldName: string) => {

    if (form?.formError) {
        const errors = Array.from(form.formError);
        return errors.includes(fieldName);
    }
    return false;
};
</script>


<div class="sign_in_fields">
                      <label for="Email">
                        <span class="email_span_text">Email address:</span>
                        <input
                          class="rounded-md { "border-red-900"} text-slate-400 block bg-white w-full py-2 focus:outline-none focus:border-cyan-900 focus:ring-cyan-900 focus:ring-1 sm:text-sm"
                          type="text"
                          name="Email"
                          value={form?.email ?? ''}
                          
                        />
                            {#if displayError('email')}
                                <div class="error_message">
                                     <p class='form_error'>⚠️ Enter email</p>
                                </div>    
                            {/if}   
                      </label>

                      <label for="Password" class="passwordField">
                        <span class="password_span_text">Password:</span>
                        <input
                          class="rounded-md {"border-red-900"} text-slate-400 block bg-white w-full py-2 focus:outline-none focus:border-cyan-900 focus:ring-cyan-900 focus:ring-1 sm:text-sm"
                          type={$booleanStore.IS_PASSWORD_VISIBLE ? "text" : "password"}
                          name="Password"
                          value={form?.password ?? ''}
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
                       <div class="error_message">
                            {#if displayError('password')}
                                <div class="error_message">
                                     <p class='form_error'>⚠️ Enter password</p>
                                </div>    
                            {/if}   
                      </div>
                      </label>

                     
                    
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
                         <button
                            type="submit"
                            formaction="?/OAuth2"
                            class="font-bold py-2 px-4 rounded focus:outline-none focus:border-green-500 hover:border-green-500 focus:ring-green-500 focus:ring-1"
                            >
                                <Icon
                                    icon="flat-color-icons:google"
                                    style="width: 25px; height: 25px;"
                                />
                                <span>Continue with Google</span>
                        </button>
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


    .error_message{
        color: $error;
        font-size: .8rem;
        position: absolute;
        right: 0;
        width: 100%;
        @include flex(row, flex-end,null,0);
        
    }
            }


            .passwordField{
            position: relative;
            }

            :is(label){
                height: max-content;
                position: relative;
                margin-bottom: 1em;
                margin-top: 1em;
            
                :is(input){
                    width: 100%;
                    height: 3em;
                    color: $grey;
                    padding-left: 1em;
                    font-size: 1rem;
                    background-color: none;
                    border: solid 1px $grey;
                }

                .email_span_text,.password_span_text{
                    position: absolute;
                    left: 5%;
                    top: -25%;
                    background-color: white;
                    border-radius: $bd-radius;
                    padding: 0 .3em;
                    font-size: .8rem;
                }
            }
            
             .form_btn{
                background-color: $primary-color;
                height: 6vh;
            }

              .togglePasswordDisplayIcon{
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                right: 5%;
                transition: all .5s ease-in-out;
                cursor: pointer;
                color: $grey;
            }


            .divider{
                grid-area:6/1/6/-1;
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                grid-template-rows: repeat(2, 10px);
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
                    top: -50%;
                    left: 50%;
                    transform: translateX(-50%) translateY(0%);
                }


            }

            .google_OAuth{
                grid-area:7/1/7/-1; 
                
                :is(button){
                border: solid 2px $primary-color;
                background-color: $white;
                color: $primary-color;
                @include flex(row, center, center, 1em);
                height: 6vh;
                width: 100%;
                transition: all .5s ease;

                &:hover{
                    color: $white;
                    background-color: $primary-color;
                    border: solid 1px $white;
                }

            }
             
            }

    }






</style>