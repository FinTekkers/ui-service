<script lang="ts">
    // external imports
    import Icon from "@iconify/svelte";
    import { reveal } from 'svelte-reveal';
// internal imports
    import { goto } from '../lib/helper';
    import CustomCodeBlock from './custom_components/CustomCodeBlock.svelte';

 </script>
<div class="get-started-container">
    <div class="get-started-text">
       
        <div class="get-started-text-intro" use:reveal={{ transition: "fly", delay:3 }}>

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

          <button class="get-started-cta-button" on:click={()=>{
          goto('/login')
       }}>
       
       
       Get Started</button>
        </div>
  

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
                <div class="codeblock ">
       
                        <p>
                            <Icon
                                    icon="line-md:cog-loop"
                                    style="width: 25px; height: 25px;"
                                    
                                    /> 
                            Install Fintekkers client libraries

                            <span>
                                /
                            </span>

                            <Icon
                                    icon="material-symbols:electric-bolt-outline"
                                    style="width: 25px; height: 25px;"
                                    
                                    />  Make your first API call
                        </p>

        
                        <div class="code-block-installation">

                            <CustomCodeBlock  />
                        </div>

                </div>
       
    </div> 
</div>

<style lang="scss">
    @import "../style.scss";
   
    .get-started-container {
        width: 100%;
        background-color: $background-color;
        border-radius: $bd-radius;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(50vw, 1fr));


         
       .get-started-text {
             gap: 1em;
             padding: 1em;
             display: grid;
             grid-template-columns: repeat(4,1fr);

            .get-started-text-intro{
                display: grid;
                grid-template-columns: repeat(auto-fill,minmax(100px, 1fr));
                grid-column: 1/-1; 
                padding: 1em;
                gap: 1em;




                .get-started-text-title{
                  @include flex(row, flex-start, center, .5em);
                   font-size: 1.5rem;
                   grid-area: 1/1/1/-1;
                   // grid-area: title;

                }
    
                .get-started-text-paragraph{
                   // width: 30vw;
                   line-height: 2em; 
                   grid-area: 2/1/2/5;
                //    margin: 1em 0;
    
                }


                button {
                    @extend .button;
                    // width: 15vw;
                    transition: all .5s ease;
                    font-weight:bold;
                    font-size: 1rem;
                    height: 8vh;
                    background-color: $success;
                    color: $black;
                    grid-area: 3/1/3/3;
                    border-radius: 30px;
                    width: 20vh;

                    
                    // grid-area: button;

                    // position: absolute;
                    // bottom: 20%;
                    // left: 15px;

                    &:hover{
                        background-color: $primary-color;
                        color:$white
                    }
                    
                }
            }



        .key-advantage-features{
       
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(5vw, 1fr)); 
            justify-content: center;
            gap: 1em;
            grid-auto-flow: dense;
            grid-column: 1/-1;
            padding: 1em;

            .key-advantage-feature{
                border-radius: $bd-radius;
                padding: 1em;
                aspect-ratio: 1/1;
                @include flex(column , center, center, 1em); 
                border: solid 1px $primary-color;
                text-align: center;
            }

        }




        }

       .get-started-code {
        gap: 2em;
   
        


        .codeblock{
            padding: 2em 1em 1em 1em;
            display: grid;
            grid-template-columns: repeat(5,1fr);
            justify-content: center;
            align-items: center;
            



        p{
            grid-column: 1/-1;
            @include flex(row,center, center, 1em);
            margin-bottom: 1em;

        }


        }
      
         .get-started-code-text{

            p{
            text-align: left;
            }

    
   }

    }




      

    }

    @media screen and (max-width: $breakingpoint_medium) {
        .get-started-container {
        grid-template-columns: 1fr;

        .get-started-text {

                .get-started-text-intro{
                display: grid;
                justify-items: center;
                    .get-started-text-paragraph{
                    grid-area: 2/1/2/-1;
                    width: 50vw;
                    text-align: center;
                    }

                    button {
                        grid-area: 3/1/3/-1;
                    }

                }

                .key-advantage-features{
                    grid-template-columns: repeat(auto-fit, 15vw); 

                }

        }

        .get-started-code{

            .codeblock{

            .code-block-installation{
                border: solid 2px green;
                grid-column: 1/-1;
                border: solid 1px $grey;
                backdrop-filter: blur(13px) saturate(180%);
                -webkit-backdrop-filter: blur(13px) saturate(180%);
                background-color: #0b2e367e;
                border-radius: 12px;
                border: 1px solid #5a96a37e;
                padding: 1em 0;
                margin: 1em 0 0 0;
             
            }

            }

            
        }

   

        }
        //     display: grid;
        //     gap: 1em;
        //     height: max-content;
        //     padding-bottom: 2em;
        //     height: 120%;
            

        //     div:nth-child(n) {
        //         width: 100%;
        //     }
        //     div:nth-child(1) {
        //         text-align: center;
        //     }

        //     .get-started-text {
        //         gap: 1.5em;
        //      @include flex(column , center, center, 2em); 
        //      width: 40vw !important;



        //         .key-advantage-features{
        //         position: absolute;
        //         top: 50%;
        //         left: 55%;
                  

        //         }


        //         p{
        //             width: 70%;

        //         }


        //         button {
        //         width: 30vw;

        //         }
        //     }
           

        //     .get-started-code{
        //         gap: 1em;
        //         position: relative;
        //          width: 90vw !important;
        //         height: 50vh !important;
        //         position: absolute;
        //         right: -75%;
        //         transform: translateX(-50%);
        //         top: 40%;

        //          .codeblock{
        //             width: 70% !important;
                    
        //             p{
        //             width: 40vw;
                    
        //         }

        //     }


        //           .codeblock_one{
        //             position: absolute;
        //             left: 0;
        //             top: 0;
        //             @include flex(column , center, center, 1em); 
        //           }

        //             .get-started-code-text{
        //                 position: absolute;
        //                 left: -50%;
        //                 transform: translateX(35%);
        //                 top: -30%;
        //                 width: 100% !important;
        //                 height: 80vh !important;
        //                 height: max-content;

        //                         p{
        //                             width: 100%;
        //                         }
        //             }

        //     }

        // }
    }

    @media screen and (max-width: $breakingpoint_mobile) {
        .get-started-container {
            padding-bottom: 2em;

            .get-started-text{
             
              .get-started-text-intro{

                  .get-started-text-title,.get-started-text-paragraph{
                  width: 90vw;
                  @include flex(row, center, center, 1em)
                  
  
                  }

              }

                .key-advantage-features{
                grid-template-columns: repeat(3,1fr);
                border-bottom: solid 1px rgba(255, 255, 255, 0.229);
                padding-bottom: 3em;
     
                }


                p{
                    width: 70%;

                }


           
            }

            .get-started-code{

                .codeblock{
                    
                    p{
                    width: 90vw;
                    
                }


                }
            }
        }
    }
</style>
