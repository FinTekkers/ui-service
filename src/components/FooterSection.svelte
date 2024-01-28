<script lang="ts">
  // external import
  import Icon from "@iconify/svelte";
  import {footerURLText} from '../lib/uidata';
</script>

<div class="Footer">
  <div class="footer_container">
    <div class="footer_logo">
      <h2>
        <Icon
          icon="material-symbols:finance-mode"
          style="width: 25px; height: 25px;"
        /> Fintekkers
      </h2>
    </div>


    <div class="footer_links">
        {#each footerURLText as footerURL}
         <div>
           <h1>{footerURL.title}</h1>
           <ul>
               {#each footerURL.links as link}
                 <li><a href={link.url}>{link.text}</a></li>
               {/each}
           </ul>
         </div>
        {/each}

      <!-- <div >
        <h1>About Us</h1>
        <ul>
          <li><a href="#" >Home</a></li>
          <li>
            <a href="https://www.linkedin.com/company/fintekkers">About us</a>
          </li>
          <li>
            <a href="https://www.linkedin.com/company/fintekkers"
              >Contact info</a
            >
          </li>
        </ul>
      </div>
      <div >
        <h1>Contact Info</h1>
        <ul>
          <li>
            <a href="https://github.com/FinTekkers/ledger-models"
              >Github Ledger Models</a
            >
          </li>
          <li><a href="#">Code Examples</a></li>
          <li><a href="#">Support</a></li>
        </ul>
      </div> -->
    </div>

    
    <div class="footer_social_links">
      <div class="icon" data-custom="facebook">
        <Icon
          icon="basil:facebook-outline"
          style="width: 25px; height: 25px;"
        />
      </div>

      <div class="icon" data-custom="stackoverflow">
        <Icon icon="jam:stackoverflow" style="width: 25px; height: 25px;" />
      </div>

      <div class="icon" data-custom="github">
        <Icon icon="ri:github-fill" style="width: 25px; height: 25px;" />
      </div>
      <div class="icon" data-custom="twitter">
        <Icon icon="pajamas:twitter" style="width: 25px; height: 25px;" />
      </div>
    </div>
  </div>
</div>

<style lang="scss">
  @import "../style.scss";

  .Footer {
    width: 100%;
    height: 60vh;
    padding: 1em;
    background-color: $background-color;
    display: grid;
    justify-content: center;
    align-items: center;
    justify-items: center;
    align-content: center;

    .footer_container {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    grid-template-rows: repeat(5,10vh);
    height: 50vh;
    padding: 1em;
        justify-content: center;
    align-items: center;
    justify-items: center;
    align-content: center;


            .footer_logo {
              grid-area: 3/1/3/2;

            
              h2 {
                @include flex(row, flex-start, flex-start, 0.2em);
                font-size: 1.5rem;

              }
            }

            .footer_social_links {
              @include flex(column, space-between, flex-start, 1em);
              grid-area: 3/6/4/-1;


              .icon {
                cursor: pointer;
                position: relative;

                &::before {
                  position: absolute;
                  left: 2vw;
                  opacity: 0;
                  content: attr(data-custom);
                  transition: all 0.5s ease;
                }

                &:hover::before {
                  left: 2.5vw;
                  opacity: 1;
                }
              }
            }
    }

    .footer_links {
      width: 100%;
      grid-area: 1/2/6/6;
      display: grid;
      grid-template-columns: 1fr 1fr;

      div:nth-child(1){
        grid-column: 1/1;
      }
      div:nth-child(2){
        grid-column: 2/-1;
      }


      div:nth-child(n) {
        width: 100%;
        height: 100%;
        text-align: center;

        

        h1 {
          margin-bottom: 1em;
        }

        ul {
          line-height: 2em;
        }
      }
    }

  
  }

  @media screen and (max-width: $breakingpoint_medium) {

    .Footer{
      grid-template-columns: 1fr ;

      .footer_container{
      grid-template-columns: 1fr ;
      grid-template-rows: repeat(4,1fr);
      gap: 1em;

            .footer_logo {
               grid-area: 1/1/1/2;
             }

            .footer_social_links{
               grid-area: 4/1/4/-1;
               width: 50vw;
               margin: 0 auto;
              @include flex(row, space-between, flex-start, 1em);

          .icon {
            &::before {
              display: none;
            }
          }
            }

            .footer_links{
               grid-area: 2/1/2/-1;
            }
      
      }
    }

  }


  @media screen and (max-width: $breakingpoint_mobile) {
    .Footer {
      position: relative;
      padding: 2em;
      height: 60vh;

      .footer_container {
        width: 100%;
        .footer_logo {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          margin-top: 2em;
          @include flex(row, space-between, flex-start, 2em);

          h2 {
            margin: 0 auto;
            font-size: 1.5rem;
          }
        }

        .footer_social_links {
          @include flex(row, center, center, 2em);
          left: 0%;
          bottom: 10%;
          width: 100%;


          .icon {
            &::before {
              display: none;
            }
          }
        }
      }


      .footer_links{

        div:nth-child(n) {
        width: 100%;
        height: 100%;
        text-align: center;

        h1 {
          margin-bottom: 1em;
        }

        ul {
          line-height: 2em;
        }
      }


      }
    }
  }
</style>
