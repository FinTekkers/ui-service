<script lang='ts'>
// external imports
import Icon from "@iconify/svelte";
// internal imports
import { customBooleanStoreUpdater, booleanStore} from '../../store/store';
import {booleanKeys} from '$lib/Util';
import type { formError } from "$lib/types";
import { toast } from 'svelte-sonner';
import { superForm } from 'sveltekit-superforms/client';


export let form:formError;
export let data: App.PageData;

$:isPasswordVisible = $booleanStore[booleanKeys.IS_PASSWORD_VISIBLE]

const displayError = (fieldName: string) => {
    
        if (form?.formError) {
            const errors = Array.from(form.formError);
            return errors.includes(fieldName);
        }
        return false;
};



</script>

  <div class="sign_up_fields">

                       <label for="name">
                         <span class="label_span_text">first name:</span>
                         <input class="rounded-md sign_up_name" type="text" name="firstname" id="firstname"  value={form?.firstname ?? ''} >
                          {#if displayError('firstname')}
                               <div class="error_message">
                                    <p class='form_error'>⚠️ Enter firstname</p>
                               </div>    
                           {/if} 
                       </label>

                       <label for="surname">
                         <span class="label_span_text">last name:</span>
                         <input class="rounded-md sign_up_surname" type="text" name="lastname" id="lastname"  value={form?.lastname ?? ''}>
                          {#if displayError('lastname')}
                               <div class="error_message">
                                    <p class='form_error'>⚠️ Enter lastname</p>
                               </div>    
                           {/if} 
                       </label>

                       <label for="email">
                         <span class="label_span_text">email:</span>
                         <input class="rounded-md sign_up_email" type="email" name="email" id="email" value={form?.email ?? ''} >
                           {#if displayError('email')}
                               <div class="error_message">
                                    <p class='form_error'>⚠️ Enter email</p>
                               </div>    
                           {/if} 
                       </label>

                       <label for="password">
                         <span class="label_span_text">password:</span>
                         <input class="rounded-md sign_up_password" 
                         type={isPasswordVisible ? "text" : "password"}
                         name="password" id="password" value={form?.password ?? ''}>

                         {#if isPasswordVisible}
                             <span class="togglePasswordDisplayIcon_signUp" on:keydown={()=>('x')} on:click={()=>customBooleanStoreUpdater(booleanKeys.IS_PASSWORD_VISIBLE)}>
                               <Icon
                                   icon="solar:eye-linear"
                                   style="width: 25px; height: 25px;"
                                   
                                 />
                             </span>
                        {:else}
                             <span class="togglePasswordDisplayIcon_signUp" on:keydown={()=>('x')} on:click={()=>customBooleanStoreUpdater(booleanKeys.IS_PASSWORD_VISIBLE)}>
                                 <Icon
                                   icon="clarity:eye-hide-line"
                                   style="width: 25px; height: 25px;"
                                   
                                 />
                             </span>
                         {/if}
                          {#if displayError('password')}
                               <div class="error_message">
                                    <p class='form_error'>⚠️ Enter password</p>
                               </div>    
                           {/if} 
                       </label>

                       <label for="confirmpassword">
                         <span class="label_span_text">confirm password:</span>
                             <input class="rounded-md sign_up_confirm_password" 
                             type={isPasswordVisible ? "text" : "password"}
                             name="confirmpassword" id="confirmpassword" value={form?.confirmpassword ?? ''} >
                              {#if displayError('confirmpassword')}
                               <div class="error_message">
                                    <p class='form_error'>⚠️ Password must match</p>
                               </div>    
                           {/if} 
                       </label>

                     <label for="submit">
                             <button type="submit" class="form_btn text-white font-bold py-2 px-4 rounded"
                             >Sign Up →
                            </button>
                     </label>

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

      

         .sign_up_fields{
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: auto ;
            grid-area: 2/1/6/-1;
            gap: 1em;

      

            :is(label){
                height: max-content;
                position: relative;
                margin-bottom: .5em;

                .label_span_text{
                  position: absolute;
                  left: 5%;
                  top: -25%;
                  background-color: $brightwhite;
                  padding: 0 .5em;
                  border-radius: $bd-radius;
                  color: $grey;
                  font-size: .8rem;

                }
            
                :is(input){
                    width: 100%;
                    height: 2.5em;
                    color: $grey;
                    padding-left: 1em;
                }

                .error_message{
                  color:$error;
                  position: absolute;
                  right: 0;
                  font-size: .8rem;
                }
            }

 
            label:nth-child(n){
            grid-column: 1/-1;

                    :is(button){
                        width: 100%;
                    }
            }

            label:nth-child(1){
            grid-column: 1/2;
            }
            label:nth-child(2){
            grid-column: 2/-1;
            }

            .form_btn{
                background-color: $primary-color;
                height: 6vh;
      
            }

            

            .togglePasswordDisplayIcon_signUp{
                position: absolute;
                top: 15%;
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