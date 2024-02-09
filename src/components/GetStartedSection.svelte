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
       
       <Icon icon="streamline:startup"   style="width: 25px; height: 25px;" /></button>
        </div>

        <div class="get-started-image">
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
        background-color: $bgc-color;
        border-radius: $bd-radius;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(50vw, 1fr));

       .get-started-image{
        grid-column: 1/-1;
        width:95%;
        height: 25vh;
        border-radius: $bd-radius;
        background: url('https://www.hp.com/us-en/shop/app/assets/images/uploads/prod/what%20is%20an%20api167511875313774.jpg') center center/cover no-repeat;
       }
         
       .get-started-text {
             gap: 1em;
             padding: 1em;
             display: grid;
             grid-template-columns: repeat(4,1fr);
             justify-items: center;
             border-right: solid 1px $bordercoltransp;

            .get-started-text-intro{
                display: grid;
                grid-template-columns: repeat(auto-fill,minmax(100px, 1fr));
                justify-items: center;
                grid-column: 1/-1; 
                padding: 1em;
                gap: 1em;

                .get-started-text-title{
                  @include flex(row, flex-start, center, .5em);
                   font-size: 1.5rem;
                   grid-area: 1/1/1/-1;
                }
    
                .get-started-text-paragraph{
                   line-height: 2em; 
                   grid-area: 2/2/2/5;
                   text-align: center;
                }

            
                button {
                    @extend .button;
                    transition: all .5s ease;
                    font-weight:bold;
                    font-size: 1rem;
                    height: 8vh;
                    background-color: $success;
                    color: $black;
                    grid-area: 3/3/3/3;
                    border-radius: 30px;
                    width: 20vh;
                    @include flex(row, center, center,0);

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
            width: 100%;

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
            



        :is(p){
            grid-column: 1/-1;
            @include flex(row,center, center, 1em);
            margin-bottom: 1em;

        }


        }
      
         .get-started-code-text{

            :is(p){
            text-align: left;
            }

    
   }

    }


    .code-block-installation{
        padding: 2em;
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

        .get-started-image{
            display: none;
        }

        .get-started-code{

            .codeblock{

            .code-block-installation{
                grid-column: 1/-1;
                border: solid 1px $grey;
                backdrop-filter: blur(13px) saturate(180%);
                -webkit-backdrop-filter: blur(13px) saturate(180%);
                background-color: #0b2e367e;
                border-radius: 12px;
                padding: 1em 0;
                margin: 1em 0 0 0;
             
            }

            }

            
        }

   

        }

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


               :is(p){
                    width: 70%;

                }


           
            }

            .get-started-code{

                .codeblock{
                    
                   :is(p){
                    width: 90vw;
                    
                }


                }
            }
        }
    }
</style>