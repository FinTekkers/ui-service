<script lang="ts">
    import { CodeBlock } from '@skeletonlabs/skeleton';
    import {goto} from '../lib/helper';
  import Icon from "@iconify/svelte";
  import {reveal} from 'svelte-reveal'

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
        <div class="codeblock">
          <p>
              <Icon
                      icon="line-md:cog-loop"
                      style="width: 25px; height: 25px;"
                      
                    /> 
              Install Fintekkers client libraries:
          </p>
            <CodeBlock
                language="ts"
                code={`
              npm i @fintekkers/ledger-models
            `}
            />
        </div>

        <div class="codeblock">
          <p> <Icon
                      icon="material-symbols:electric-bolt-outline"
                      style="width: 25px; height: 25px;"
                      
                    />  Make your first API call:</p> 
               <CodeBlock
                   language="ts"
                   code={`
                           // Model Utils
                           import { FieldProto } from '../../../fintekkers/models/position/field_pb';
                           import * as uuid from '../../models/utils/uuid';
                           import * as dt from '../../models/utils/datetime';
       
                           //Requests & Services
                           import { PortfolioService } from './PortfolioService';
       
                           const now = dt.ZonedDateTime.now();
       
                           const portfolioService = new PortfolioService();
       
                           var searchResults = await portfolioService.searchPortfolio(now.toProto(), new PositionFilter().addEqualsFilter(FieldProto.PORTFOLIO_NAME, 'Federal Reserve SOMA Holdings'));
                           console.log(searchResults[0].getPortfolioName());
             `}
               />
        </div>

    </div> 
</div>

<style lang="scss">
    @import "../style.scss";

   
    .Intro_section {
        width: 100%;
        height: 100vh;
        @include flex(row, space-between, flex-start, 2em); 
        padding: 6em;
        background-color: $background-color;
        position: relative;

        .description{
            max-width: 45vw;
            @include flex(row, center, center, .5em); 
            @extend .centerAbsolute;
            left: 50%;
            transform: translate(-100%,0%);
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

    @media screen and (max-width: 1200px) {
        .Intro_section {
            display: grid;
            gap: 1em;
            height: max-content;
            padding-bottom: 2em;
            

            div:nth-child(n) {
                width: 80vw;
            }
            div:nth-child(1) {
                text-align: center;
            }

            .intro_description {
                gap: 1.5em;

                button {
                    width: 50vw;
                    margin: 0 auto;
                }
            }
        }
    }

    @media screen and (max-width: 600px) {
        .Intro_section {
            height: 100%;
            padding-bottom: 2em;
        }
    }
</style>
