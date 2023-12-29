<script lang="ts">
    // external imports
    import { CodeBlock } from '@skeletonlabs/skeleton';
    import {reveal} from 'svelte-reveal';
    import Icon from "@iconify/svelte";

    // internal imports
    import {goto} from '../lib/helper';
    import CustomCodeBlock from './custom_components/CustomCodeBlock.svelte'

 </script>
<div class="get-started-container">
    <div class="get-started-text">
       
        <div use:reveal={{ transition: "fly", delay:3 }}>

           <p class="get-started-text-title">
                <Icon
           icon="healthicons:entry-outline"
           style="width: 25px; height: 25px;"           
        />  <strong>  Get started instantly! </strong>
           </p> <br/> 
           <p class="get-started-text-paragraph">
               Fintekkers platform provides
            you all the APIs you need to build your own fintech product, or
            solve your business opportunities at miminum cost.

           </p> 
        </div>
       <button class="get-started-cta-button" on:click={()=>{
          goto('/login')
       }}>
       
       
       Get Started</button>

       <div class="key-advantage-features">

        <div class="key-advantage-feature" use:reveal={{ transition: "slide" }}>
            <Icon
                      icon="formkit:group"
                      style="width: 25px; height: 25px;"
                      
                    /> 
            Consolidate all your trading tools 
        </div>
        <div class="key-advantage-feature" use:reveal={{ transition: "slide", delay:0.5 }}>
            <Icon
                      icon="carbon:time"
                      style="width: 25px; height: 25px;"
                      
                    /> 
            Access robust real-time data
        </div>
        <div class="key-advantage-feature" use:reveal={{ transition: "slide", delay:1.5 }}>
            <Icon
                      icon="icons8:support"
                      style="width: 25px; height: 25px;"
                      
                    /> 
            Lean on free dedicated US-based support
        </div>

       </div>
    </div>
    <div class="get-started-code">
                <div class="codeblock codeblock_one">
                <p>
                    <Icon
                            icon="line-md:cog-loop"
                            style="width: 25px; height: 25px;"
                            
                            /> 
                    Install Fintekkers client libraries:
                </p>
                            <CustomCodeBlock  />

                </div>
                <div class="codeblock codeblock_two">
        

                    <div class="get-started-code-text">
                                <p> <Icon
                            icon="material-symbols:electric-bolt-outline"
                            style="width: 25px; height: 25px;"
                            
                            />  Make your first API call:</p> 

                    </div>
                </div>
    </div> 
</div>

<style lang="scss">
    @import "../style.scss";
   
    .get-started-container {
        width: 100%;
        height: 120vh;
        @include flex(row, space-between, flex-start, 2em); 
        padding: 2em;
        background-color: $background-color;
        position: relative;
        padding-left: 5em;
        border-radius: $bd-radius;


        .key-advantage-features{
            max-width: 50vw;
            width: 50vw !important;
            @extend .centerAbsolute;
            left: 0%;
            top: 100%;
            transform: translate(0%,0%);
            font-size: 1rem;


            .key-advantage-feature{
             @include flex(column , center, center, 1em); 
             border: solid 1px $primary-color;
             height: 20vh;
             width: 12vw;
             text-align: center;
             border-radius: $bd-radius;
             position: absolute;

             &:nth-child(1){
                 left: 2%;
                 top: 5%;
             }

            &:nth-child(2){
                 left: 30.5%;
                 top: 25%;
             }
            &:nth-child(3){
                 left: 2%;
                 top: 55%;
             }
            }

        }


        div:nth-child(n) {
            padding: 1em;
            width: 50%;
            height: 50vh;

        }

      
 
    .get-started-text {
            @include flex(column, center, flex-start, 1em);
             padding: 0 !important;
             position: relative;

             .get-started-text-title{
                 width: 30vw;
                 @include flex(row, flex-start, center, .5em);
                 font-size: 1.5rem;

             }

             .get-started-text-paragraph{
                width: 30vw;
                line-height: 3em;
             }

            button {
                @extend .button;
                width: 15vw;
                transition: all .5s ease;
                font-weight:bold;
                font-size: 1rem;
                height: 8vh;
                background-color: $success;
                color: $black;
                position: absolute;
                bottom: 20%;
                left: 15px;



                &:hover{
                    background-color: $primary-color;
                    color:$white
                }
                
            }
        }
    }

    .get-started-code {
        gap: 2em;
        display: flex;
        flex-direction: column;
        height: 100vh !important;

        .codeblock_one{
            position: absolute;
            left: 46%;
            top: 10%;
        }

      
         .get-started-code-text{
            position: absolute;
            width: max-content !important;
            height: 5vh !important;
            left: 46%;
            top: 36%;
            

            p{
            text-align: left;
            width: 15vw;
            }

    
   }

    .codeblock{
         width: 100% !important; 
         @include flex(column, flex-start, flex-start, 2em);


         p{
             @include flex(row, center, center, 1em);
         }

         &:nth-child(1){
             height:200px;
         }

        }
    }

    @media screen and (max-width: $breakingpoint_medium) {
        .get-started-container {
            display: grid;
            gap: 1em;
            height: max-content;
            padding-bottom: 2em;
            height: 120%;
            

            div:nth-child(n) {
                width: 100%;
            }
            div:nth-child(1) {
                text-align: center;
            }

            .get-started-text {
                gap: 1.5em;
             @include flex(column , center, center, 2em); 
             width: 40vw !important;



                .key-advantage-features{
                position: absolute;
                top: 50%;
                left: 55%;
                  

                }


                p{
                    width: 70%;

                }


                button {
                width: 30vw;

                }
            }
           

            .get-started-code{
                gap: 1em;
                position: relative;
                 width: 90vw !important;
                height: 50vh !important;
                position: absolute;
                right: -75%;
                transform: translateX(-50%);
                top: 40%;

                 .codeblock{
                    width: 70% !important;
                    
                    p{
                    width: 40vw;
                    
                }

            }


                  .codeblock_one{
                    position: absolute;
                    left: 0;
                    top: 0;
                    @include flex(column , center, center, 1em); 
                  }

                    .get-started-code-text{
                        position: absolute;
                        left: -50%;
                        transform: translateX(35%);
                        top: -30%;
                        width: 100% !important;
                        height: 80vh !important;
                        height: max-content;

                                p{
                                    width: 100%;
                                }
                    }

            }

        }
    }

    @media screen and (max-width: $breakingpoint_mobile) {
        .get-started-container {
            height: 180%;
            padding-bottom: 2em;
            


            .get-started-text{
                width: 100vw;
                min-width: 450px;
                position: absolute;
                left: 50%;
                top: 3%;
                transform: translateX(-50%);

             

                p{
                width: 100% !important;
                text-align: start;
                }

                .key-advantage-features{
                position: absolute;
                bottom:0% !important;
                display: none;
                }


                p{
                    width: 70%;


                }


           
            }

        

            

            .get-started-code{
                width: 90vw !important;
                height: 50vh !important;
                position: absolute;
                left: 50%;
                transform: translateX(-50%);
                top: 55%;


                .codeblock{
                    width: 100% !important;
                    
                    p{
                    width: 90vw;
                    
                }

            .get-started-code-text{
                    position: absolute;
                    top: -30%;
                    left: 0%;
                    display: none;
                 
                

    
                }

                }
            }
        }
    }
</style>
