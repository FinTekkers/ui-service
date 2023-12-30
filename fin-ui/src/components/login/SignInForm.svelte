<script lang="ts">
  import Icon from "@iconify/svelte";
  import {isSignInOrSignUp, togglePasswordVisibility, isPasswordVisible} from '../../store/store';

  export let data:any;
  export let form:Login.formError;
</script>

                                <!-- svelte-ignore a11y-click-events-have-key-events -->

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
                          type={$isPasswordVisible ? "text" : "password"}
                          name="Password"
                          placeholder="Enter your password"
                        />

                      {#if $isPasswordVisible}
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

                    <div class="divider">
                                    <div class="one border-t border-gray-500" />
                                    <span>OR</span>
                                    <div class="two border-t border-gray-500" />
                                   
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

                    button{
                        width: 100%;
                    }
            }


            .passwordField{
            position: relative;
            }

            label{
                height: max-content;
                position: relative;
            
                input{
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

                span{
                    grid-column: 2/2;
                    position:absolute;
                    top: 0;
                    left: 50%;
                    transform: translateX(-50%);
                }


            }

            .google_OAuth{
                grid-area:7/1/7/-1;
                button{
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


    .error_message{
        color: $error;
    }




</style>