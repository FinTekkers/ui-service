
<script lang='ts'>
import type { formError } from '$lib/types';
import { writable} from "svelte/store";

export let data;


/** @type {import('./$types').ActionData} */
export let form: formError;
let showSuccess = form?.success;

let focusedElement: string | null = null;
let inputValue: { [key: string]: string } = {};
let isTypingField = writable<string>('');

// functions handling micro interaction of form
const handleFocus = (field:string)=>{
  focusedElement = field;
}

const handleChange = (fieldName: string, value: string) => {
  inputValue[fieldName] = value;
  isTypingField.update((store)=>{
      store = fieldName;
      return store
  }) 
};


// displaying errors from form 
const displayError = (fieldName: string) => {
        isTypingField.update((store)=>{
                store = fieldName;
                return store
         }) 
        if (form?.formError) {
            const errors = Array.from(form.formError);
            return errors.includes(fieldName) && fieldName === $isTypingField;
        }
        return false;
};

// clear form
const handleClear = ()=>{
    form = {}
}

</script>

<svelte:head>
  <title>{'Contact us'}</title>
</svelte:head>

{#if showSuccess}
    <div class="form_success">
        <p>✅ Your message was sent successfully. Thank you!</p>
    </div>
{/if}


        <div class="contact-us">
            <div class="contact-us-text">
            <h1>Contact Us</h1>
            <p>Need to get in touch with us? Either fill out the form with your inquiry or find the email you'd like to contact below</p>
            </div>
            <div class="contact-us-form">
            

                <form method="POST" action="?/message"   >
                    <label for="fistname">
                        <span class={`${focusedElement === 'firstname' || inputValue['firstname']  ? 'labelFloat' : ''}`}>
                            First name
                        </span>
                    <input on:focus={() => handleFocus('firstname')}  on:change={(event) => handleChange('firstname', event?.target.value)} on:blur={()=>handleBlur('firstname')} id="firstname" name="firstname" type="text"  value={form?.firstname ?? ''}>
                     {#if displayError('firstname')}
                        <div class="error_message">
                            <p class='form_error'>⚠️ Enter firstname</p>
                        </div>
                    {/if}
                    
                    </label>
                  
                    <label for="lastname">
                        <span class={`${focusedElement === 'lastname' || inputValue['lastname'] ? 'labelFloat' : ''}`}>
                            Last name
                        </span>
                        <input on:focus={() => handleFocus('lastname')} on:change={(event) => handleChange('lastname', event?.target.value)} on:blur={()=>handleBlur('lastname')} id="lastname" name="lastname" type="text"  value={form?.lastname ?? ''}>
                        {#if displayError('lastname')}
                                <div class="error_message">
                                    <p class='form_error'>⚠️ Enter lastname</p>
                                </div>
                        {/if}
                    </label>
                    <label for="email">
                        <span class={`${focusedElement === 'email' || inputValue['email'] ? 'labelFloat' : ''}`}>
                            Email
                        </span>
                        <input on:focus={() => handleFocus('email')} on:change={(event) => handleChange('email', event?.target.value)} on:blur={()=>handleBlur('email')}   id="email" type="email" name="email"  value={form?.email ?? ''}>
                         {#if displayError('email')}
                                <div class="error_message">
                                    <p class='form_error'>⚠️ Enter email</p>
                                </div>
                        {/if}
                    </label>
                    <label for="message">
                        <span class={`${focusedElement === 'message' || inputValue['message'] ? 'labelFloat' : ''}`}>
                            Enter your message
                        </span>
                        <textarea on:focus={() => handleFocus('message')} on:change={(event) => handleChange('message', event?.target.value)} on:blur={()=>handleBlur('message')}  id="message" name="message" rows="3" value={form?.message ?? ''}  />
                        {#if displayError('message')}
                                <div class="error_message">
                                    <p class='form_error'>⚠️ Enter message</p>
                                </div>
                        {/if}    
                    </label>
                    <label for="">
                        <button class="clear_form" on:click={handleClear}>Clear</button>
                    </label>
                    <label for="">
                        <input class="submit_btn" type="submit" /> 
                    </label>
                    
                
                </form>
            </div>
   
        </div>


<style lang="scss">
@import "../../style.scss";
.form_success {
  grid-column: 1 / -1;
  color: $success; // or any green tone
  background: rgba(0, 128, 0, 0.1);
  padding: 1em;
  border-radius: $bd-radius;
  margin-bottom: 1em;
  font-weight: bold;
}

.contact-us{
    padding: 1em;
    display: grid;
    grid-template-columns: repeat(2,1fr);
    grid-template-rows:1fr;
    height: 100vh;
    background: $bgc-color;

    .contact-us-text{
        padding: 1em;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        grid-template-rows: repeat(8, 50px);


            h1{
                font-size: 2rem;
                color: $white;
                grid-area: 5/2/5/3;
            }

           :is(p){
                color:$white;
                grid-area: 6/2/6/4;

            }

    }

    .contact-us-form{
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        grid-template-rows: repeat(6, 100px);

        .error_message{
            grid-column: 1/3;
            color:$error;    
            display: grid;
            left: 0;
            
        }

        form{
            grid-column: 2/6;
            grid-row: 2/7;
            display: grid;
            grid-template-columns: repeat(2,1fr);
            grid-template-rows: repeat(8,minmax(90px, 100px));
            gap: 1em;

        

            :is(label){
                @include flex(column, center, flex-start, .5em);
                color: $grey;
                height: max-content;
                position: relative;
                grid-column: 1/-1;
                display: grid;
                grid-template-columns: 1fr;
                grid-template-rows: 1fr;

               

                &:nth-child(n){
                    position: relative;

                     span{
                        width: max-content;
                        position: absolute;
                        transition: all .5s ease-in-out;
                        left: 3%;
                        top: -25%;
                        pointer-events: none;
                        background-color: $bgc-color;
                        border-radius: $bd-radius;
                        padding: 0 .5rem;
                    }


                    .labelFloat{
                       
                        background-color: $primary-button;
                        border-radius: $bd-radius;
                        color: $white;
                    }
                }

                &:nth-child(1){
                    grid-area: 1/1/2/-1;
                   
                }
                &:nth-child(2){
                    grid-area: 2/1/3/-1;
                }
                &:nth-child(3){
                    grid-area: 3/1/4/-1;
                }
                &:nth-child(4){
                    grid-area: 4/1/5/-1;
                    span{
                        top:-10%
                    }
                }
                 &:nth-child(5){
                    grid-area: 5/1/5/2;

                }

                 &:nth-child(6){
                    grid-area: 5/2/6/3;
               
                }
                    
                input, textarea{
                    color: $grey;
                    padding-left: 1em;
                    border-radius: $bd-radius;
                    min-height: 6vh;
                    background-color: transparent;
                    border: solid 1px $white;
                }

                textarea{
                    padding: 1em;
                }

            }
            .submit_btn{
                    margin-top: 2em;
                    grid-column:1/1;
                    grid-row: 5/5;
                    height: 8vh;
                    border-radius: $bd-radius;
                    background-color: $primary-color;
                    font-weight: bold;
                    cursor: pointer;
                    color: $white;
                    transition: background-color .5s  ease;
                    border: none;

                    &:hover{
                        background-color: $primary-button;
                    }
            }

             .clear_form{
                @extend .button;
                margin-top: 2em;
                grid-column:1/1;
                grid-row: 5/5;
                height: 8vh;
                background-color: $grey;
                color:$white;
                transition: background-color .5s  ease;

                   &:hover{
                        background-color: $ltgrey;
                    }
             }
        }
    }

}

    @media screen and (max-width: $breakingpoint_medium) {

            .contact-us{
              grid-template-columns: 1fr;
              grid-template-rows: repeat(3, 1fr);

              .contact-us-text{
                grid-area: 1/1/1/-1;
                grid-template-rows: repeat(1, 50px);


                        h1{
                            font-size: 1.5rem;
                            color: $white;
                            grid-area: 1/2/1/4;
                        }

                       :is(p){
                            color:$white;
                            grid-area: 2/2/2/4;
                            display: none;

                        }

              }



            .contact-us-form{
             grid-template-columns: repeat(8, 1fr);

             
                
                form{
                grid-column: 3/7;
                grid-row: 1/7;
                display: grid;
                grid-template-columns: repeat(auto-fit,1fr);
                grid-template-rows: repeat(8,100px);
                gap: 1em;
            
            }

            }
        

            }

    }


    @media screen and (max-width: $breakingpoint_mobile){


    .contact-us-text{
        padding: 1em;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        grid-template-rows: repeat(8, 50px);


            h1{
                font-size: 2rem;
                color: $white;
                width: 80vw;
                padding-top: 0.2em;
           
            }

           :is(p){
                color:$white;
                grid-area: 6/2/6/4;

            }

     

    }

           .contact-us-form{
             grid-template-columns: repeat(8, 1fr);

             
                
            form{
                grid-column: 1/-1;
                grid-row: 2/7;
                display: grid;
                grid-template-columns: repeat(auto-fit,1fr);
                grid-template-rows: repeat(8,100px);
                gap: 1em;
                width: 80vw;
                margin-top: 2em;


                .submit_btn{
                    padding: 0;
                    margin: 0;
                }


                :is(label){

                    &:nth-child(4){
                      grid-column: 1/-1;
                        
                    }


                }

            
            }

            }
          
    
    }

</style>