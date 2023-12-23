<script lang="ts">
    import { CodeBlock } from '@skeletonlabs/skeleton';
    import {goto} from '../lib/helper';
    import Icon from "@iconify/svelte";
    import {reveal} from 'svelte-reveal';
    import CustomCodeBlock from '../components/Utility/CustomCodeBlock.svelte'

 </script>
<div class="Intro_section">
   
    <div class="intro_description">
        <h1 use:reveal={{ transition: "fly" }}>                       
            Welcome to Fintekkers </h1>  
        <p use:reveal={{ transition: "fly", delay:3 }}>

            Get started with Fintekkers instantly!  <br/>  Fintekkers platform provides
            you all the APIs you need to build your own fintech product, or
            solve your business opportunities at miminum cost.
        </p>
       <button class="Trynow_btn" on:click={()=>{
          goto('/login')
       }}>Try now</button>

       <div class="description">

        <div class="description_tip" use:reveal={{ transition: "slide" }}>
            <Icon
                      icon="formkit:group"
                      style="width: 25px; height: 25px;"
                      
                    /> 
            Consolidate all your trading tools 
        </div>
        <div class="description_tip" use:reveal={{ transition: "slide", delay:0.5 }}>
            <Icon
                      icon="carbon:time"
                      style="width: 25px; height: 25px;"
                      
                    /> 
            Access robust real-time data
        </div>
        <div class="description_tip" use:reveal={{ transition: "slide", delay:1.5 }}>
            <Icon
                      icon="icons8:support"
                      style="width: 25px; height: 25px;"
                      
                    /> 
            Lean on free dedicated US-based support
        </div>

       </div>
    </div>
    <div class="intro_visualiser">
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
   

             <div class="codeblock-api">
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
   
    .Intro_section {
        width: 100%;
        height: 120vh;
        @include flex(row, space-between, flex-start, 2em); 
        padding: 2em;
        background-color: $background-color;
        position: relative;

        .description{
            max-width: 45vw;
            @extend .centerAbsolute;
            left: 50%;
            transform: translate(-110%,0%);
            font-size: 1rem;


            .description_tip{
             @include flex(column , center, center, 1em); 
             border: solid 1px $primary-color;
             height: 20vh;
             width: 12vw;
             text-align: center;
             border-radius: $bd-radius;
             position: absolute;

             &:nth-child(1){
                 left: 7%;
                 top: 5%;
             }

                &:nth-child(2){
                 left: 37.5%;
                 top: 25%;
             }
                &:nth-child(3){
                 left: 7%;
                 top: 50%;
             }
            }

        }


        div:nth-child(n) {
            padding: 1em;
            width: 50%;
            height: 50vh;

        }

      
 
        .intro_description {
             display: flex;
             flex-direction: column;
             gap: 2em;

             .landing_image{
                 width: 90%;
                 padding: 0;
                 img{
                     border-radius: $bd-radius;
                 }
             }


            h1 {
                font-size: 2rem;
            }

            p {
                width: 100%;
                line-height: 2em;
            }

            button {
                @extend .button;
                width: 50%;
                transition: all .5s ease;
                font-weight:bold;
                font-size: 1rem;
                height: 8vh;
                background-color: $success;
                color: $black;

                &:hover{
                    background-color: $primary-color;
                    color:$white
                }
                
            }
        }
    }

    .intro_visualiser {
        gap: 2em;
        display: flex;
        flex-direction: column;
        height: 100vh !important;

        .codeblock_one{
            position: absolute;
            left: 46%;
            top: 10%;
        }

      
         .codeblock-api{
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

    


    @media screen and (max-width: $breakingpoint_md) {
        .Intro_section {
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

            .intro_description {
                gap: 1.5em;
             @include flex(column , center, center, 2em); 
             width: 40vw !important;



                .description{
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
           

            .intro_visualiser{
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

                    .codeblock-api{
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
        .Intro_section {
            height: 180%;
            padding-bottom: 2em;

            .intro_description{
                width: 90vw  !important;
                p{
                width: 100%;

                }




                .description{
                position: absolute;
                bottom:0% !important;
                display: none;


                }


                p{
                    width: 70%;

                }


           
            }

            

            .intro_visualiser{
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

            .codeblock-api{
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
