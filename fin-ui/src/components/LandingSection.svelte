<script lang="ts">
    import { CodeBlock } from '@skeletonlabs/skeleton';
    import {goto} from '../lib/helper';

 </script>
<div class="Intro_section">
   
    <div class="intro_description">
        <h1>Welcome to Fintekkers</h1>
        <p>
            Get started with Fintekkers instantly! Fintekkers platform provides
            you all the APIs you need to build your own fintech product, or
            solve your business opportunities at miminum cost.
        </p>
       <button on:click={()=>{
          goto('/login')
       }}>Try now</button>
    </div>
    <div class="intro_visualiser">
        Install Fintekkers client libraries:
        <CodeBlock
            language="ts"
            code={`
          npm i @fintekkers/ledger-models
        `}
        />

        Make your first API call:

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

<style lang="scss">
    @import "../style.scss";

    .Intro_section {
        width: 100%;
        height: 50vh;
        padding: 0 15em;
        @include flex(center, center, row, 1em);

        div:nth-child(n) {
            width: 50%;
            padding: 1em;
            margin-top: 2em;
        }

        .intro_description {
            display: grid;

            h1 {
                font-size: 2rem;
            }

            p {
                width: 100%;
            }

            button {
                @extend .button;
                width: 20vw;
            }
        }
    }

    .intro_visualiser {
        display: grid;
        gap: 1em;
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
