<script lang='ts'>
  import Icon from "@iconify/svelte";
  import { togglePasswordVisibility, isPasswordVisible} from '../../store/store';
  export let data:any;
  export let form:Login.formError;

</script>

 <!-- svelte-ignore a11y-click-events-have-key-events -->

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

                      <label for="submit">
                              <button type="submit"  class="form_btn text-white font-bold py-2 px-4 rounded"
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

        // sign up form
         .sign_up_fields{
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: auto ;
            grid-area: 2/1/6/-1;
            gap: 1em;
       

            label{
                height: max-content;
                position: relative;
            
                input{
                    width: 100%;
                    height: 2.5em;
                    color: $grey;
                    padding-left: 1em;
                }
            }

 
            label:nth-child(n){
            grid-column: 1/-1;

                    button{
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


 

    </style>