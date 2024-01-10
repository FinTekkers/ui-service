

<script lang='ts'>
    	/** @type {import('./$types').PageData} */
	export let data:any;

	/** @type {import('./$types').ActionData} */
	export let form:Login.formError;
</script>

<div class="contact-us">
    <div class="contact-us-text">
       <h1>Contact Us</h1>
       <p>Need to get in touch with us? Either fill out the form with your inquiry or find the email you'd like to contact below</p>
    </div>
    <div class="contact-us-form">
        <form method="POST" action="contactus?/message">
            <label for="fistname"><span>Firstname</span><input id="firstname" name="firstname" type="text" placeholder="firstname"></label>
            <label for="lastname"><span>Lastname</span><input id="lastname" name="lastname" type="text" placeholder="lastname"></label>
            <label for="emaol"><span>Email</span><input id="email" type="email" name="email" placeholder="email"></label>
            <label for="message"><span>What Can we help you with ?</span><textarea id="message" name="message" rows="4" placeholder="" ></textarea></label>
            <input class="submit_btn" type="submit" /> 
        </form>
    </div>
</div>

<style lang="scss">
@import "../../style.scss";

.contact-us{
    padding: 1em;
    display: grid;
    grid-template-columns: repeat(2,1fr);
    grid-template-rows:1fr;
    height: 100vh;
    background: $background-color;

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

            p{
                color:$white;
                grid-area: 6/2/6/4;

            }

    }

    .contact-us-form{
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        grid-template-rows: repeat(6, 100px);

        form{
        grid-column: 2/6;
        grid-row: 2/7;
        display: grid;
        grid-template-columns: repeat(auto-fit,1fr);
        grid-template-rows: repeat(8,100px);
        gap: 1em;

        

            label{
                @include flex(column, center, flex-start, .5em);
                color: $grey;
                height: max-content;
                position: relative;
                grid-column: 1/-1;
                display: grid;
                grid-template-columns: 1fr;
                grid-template-rows: 1fr;

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
                }
               
            
                input, textarea{
                    color: $grey;
                    padding-left: 1em;
                    border-radius: $bd-radius;
                    min-height: 6vh;
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

                        p{
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


</style>
