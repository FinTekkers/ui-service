<script lang="ts">
  import Icon from "@iconify/svelte";
  import {reveal} from 'svelte-reveal';

</script>

<div class="About_section">
    <div class="abt_section abt_section_1" use:reveal={{transition:"fly", y:10}}>
        <div class="abt_subsectionTitle">
            <Icon
            icon="icon-park-outline:speed"
            style="width: 25px; height: 25px;"          
            />
            <h2>Fast</h2>

        </div>
        <p>
         Lorem ipsum dolor sit, amet consectetur adipisicing elit. Aspernatur mollitia incidunt sequi quaerat enim eum deleniti! Deserunt culpa modi maiores?
        </p>
    </div>
    <div class="abt_section abt_section_2" use:reveal={{transition:"fly", y:20, delay:20}}>
         <div class="abt_subsectionTitle">
            <Icon
            icon="game-icons:flexible-lamp"
            style="width: 25px; height: 25px;"          
            />
            <h2>Flexible</h2>
        </div>
        <p>
         Lorem ipsum dolor sit, amet consectetur adipisicing elit. Aspernatur mollitia incidunt sequi quaerat enim eum deleniti! Deserunt culpa modi maiores?
        </p>
    </div>
    <div class="abt_section abt_section_3" use:reveal={{transition:"fly", y:30, delay:30}}>
         <div class="abt_subsectionTitle">
            <Icon
            icon="octicon:goal-24"
            style="width: 25px; height: 25px;"          
            />
           <h2>Accurate</h2>
        </div>

        <p>
         Lorem ipsum dolor sit, amet consectetur adipisicing elit. Aspernatur mollitia incidunt sequi quaerat enim eum deleniti! Deserunt culpa modi maiores?
        </p>
    </div>
</div>

<style lang="scss">
    @import "../style.scss";

    .About_section{
        padding: 4em 1em 1em 1em;
        @include flex(row, center, center, 1.5em);
        background-color: $primary-color;
        height: 50vh;

      .abt_section{
        @include flex(column, center, center, 1.5em);


        .abt_subsectionTitle{
        @include flex(row, center, center, .5em);

        }

          &:nth-child(n){
              width: 25vw;
              border: solid 1px rgba(255, 255, 255, 0.102);
              border-radius: 6px;
              padding: 1em;

              p{
                  text-align: center;
              }
          }
      }

    }

    @media screen and (max-width:600px){
         .About_section{
           height: max-content;
                .abt_section{
                @include flex(column, center, center, 1.5em);
                    &:nth-child(n){
                        min-width: 25vw;
                        max-width: 30vw;
                        width: 300px;

                        p{
                            font-size: .8rem;
                        }
                    }
                }
         }
    }

</style>