<script lang="ts">
    import { CodeBlock } from '@skeletonlabs/skeleton';
    import {goto} from '../lib/helper';
  import Icon from "@iconify/svelte";

 </script>
<div class="Intro_section">
   
    <div class="intro_description">
        <h1>
                        
            Welcome to Fintekkers </h1>

            <div class="landing_image"> 
                <img src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="">
            </div>
        <p>

            Get started with Fintekkers instantly!  <br/>  Fintekkers platform provides
            you all the APIs you need to build your own fintech product, or
            solve your business opportunities at miminum cost.
        </p>
       <button class="Trynow_btn" on:click={()=>{
          goto('/login')
       }}>Try now</button>
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

                &:hover{
                    background-color: $primary-color;
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
