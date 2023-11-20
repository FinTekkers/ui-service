
<script lang="ts">
    import { CodeBlock } from '@skeletonlabs/skeleton';
    import {goto} from '../lib/helper';

 </script>
<div class="Intro_section">
   
    <div class="intro_description">
        <h1>Welcome to Fintekkers</h1>
        <p> Lorem ipsum dolor sit amet consectetur adipisicing elit. Eius, aliquam veritatis commodi suscipit quo iure accusantium nostrum esse nam deleniti, nihil sint repudiandae veniam earum id saepe sunt ipsa totam?
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Eius, aliquam veritatis commodi suscipit quo iure accusantium nostrum esse nam deleniti, nihil sint repudiandae veniam earum id saepe sunt ipsa totam?
        </p>
       <button on:click={()=>{
          goto('/login')
       }}>Try now</button>
    </div>
    <div class="intro_visualiser">
      <CodeBlock language="ts" code={`
      {
  "data": [
    {
      "alias": "pop",
      "name": "Population",
      "title": "Population",
      "desc": "WorldPop produces different "
    },
  ]
}
      `}></CodeBlock>
      
    </div>
</div>

<style lang="scss">
    @import "../style.scss";

    .Intro_section{
        width: 100%;
        height: 50vh;
        padding: 0 15em;
        @include flex(center, center, row, 1em);

        div:nth-child(n){
            width: 50%;
            padding: 1em;
            margin-top: 2em;
        }

        .intro_description{
             display: grid;
            
            
            h1{
                font-size: 2rem;
            }

            p{
                width: 100%;
            }

            button{
                @extend .button;
                width: 20vw;
               
            }
        }
    }

    .intro_visualiser{
        display: grid;
        gap: 1em;
    }


    @media screen and (max-width: 1200px) {
  
        .Intro_section{
            display: grid;
            gap: 1em;
            height: max-content;
            padding-bottom:2em;


            div:nth-child(n){
            width: 80vw;
            }
            div:nth-child(1){
             text-align: center;
            }

            .intro_description{
                gap: 1.5em;

                button{
                width: 50vw;
                margin: 0 auto;
               
            }
            }
 
     }

}


@media screen and (max-width:600px){

      .Intro_section{
          height: 100%;
          padding-bottom:2em;
      }
}

</style>