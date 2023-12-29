<script lang="ts">

    // external exports
    import { reveal } from "svelte-reveal";
    import Icon from "@iconify/svelte";


    // internal imports
    import { goto } from "../lib/helper";
    import computerImage from '../lib/images/stock.png';
    import {
        toggleUnderConstruct,
        UnderConstructBoolean,
    } from "../store/store";

</script>

<div class="landing-page-container">
    <!-- <div class="landing-page-overlay" /> -->

    <div class="landing-content">
        <h1 class="landing-headline" use:reveal={{ transition: "fade" }}>
         Fintekkers is a Premier Fintech Infrastructure
        </h1>
        <p class="landing-description">
            We worry about scale, security and
            plumbing while you focus on your competitive advantage, your ideas.
        </p>
        <div class="landing-cta-buttons">
             <button class="button try-now-button" on:click={() => goto("/login")}
                >Try Now</button
            >
            <button
                class="button explore-product-button"
                on:click={() => toggleUnderConstruct("xploreProduct")}
                disabled>Explore Product</button
            >
           
        </div>
        <div class="landing-image">
        <img src={computerImage} alt="computer-vector" />

        <div class="landing-image-icon first-icon">
            <Icon
            icon="solar:graph-up-outline"
            style="width: 150px; height: 150px;color:#258ea8;opacity:50%"
            class='icon'
                                
            />
            
        </div>
        <div class="landing-image-icon second-icon">
            <Icon
            icon="cil:graph"
            style="width: 150px; height: 150px; color:#258ea8; opacity:50%"
            class='icon'
                                
            />
            
        </div>
        <div class="landing-image-icon third-icon">
            <Icon
            icon="pepicons-print:coins"
            style="width: 120px; height: 120px; color:#258ea8; opacity:50%"
            class='icon'
                                
            />
            
        </div>
        </div>
    </div>
    <!-- <div class="landing-image">
     <img src={computerImage} alt="computer-vector">

     <div class="landing-image-icon first-icon">
         <Icon
           icon="solar:graph-up-outline"
           style="width: 150px; height: 150px;color:#258ea8;opacity:50%"
           class='icon'
                            
         />
         
     </div>
     <div class="landing-image-icon second-icon">
         <Icon
           icon="cil:graph"
           style="width: 150px; height: 150px; color:#258ea8; opacity:50%"
           class='icon'
                            
         />
         
     </div>
     <div class="landing-image-icon third-icon">
         <Icon
           icon="pepicons-print:coins"
           style="width: 120px; height: 120px; color:#258ea8; opacity:50%"
           class='icon'
                            
         />
         
     </div>
    </div> -->
</div>

<style lang="scss">
    @import "../style.scss";

    .landing-page-container {
        width: 100%;
        height: 100vh;
        background: url("https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D") center center/cover no-repeat; 
        position: relative;
        display: grid;
        grid-template-columns: repeat(2,1fr);
        grid-template-rows: repeat(6,20%);
        border-radius: $bd-radius;
        // @include flex(row,center,center, 1em);


        .landing-content {
            width: 100vw;
            height: 100vh;
            display: grid;
            grid-template-columns: repeat(auto-fill,minmax(50px,1fr));
            grid-template-rows: repeat(8,100px);
            gap:1em;
            padding: 1em;
            @extend .glass_background;

            // @include flex(column, center, flex-start, 3em);
            // padding-left: 5em;
            // border-radius: $bd-radius;

            .landing-headline {
                font-size: 3rem;
                text-align: left;
                // width: 40vw;
                line-height: 1.2em;
                grid-area:3/2/4/12;
            }


            .landing-description{
                // width: 30vw; 
                font-size: 1em;
                grid-area:4/2/5/8;
                margin-top: 1em;

            }

            .landing-cta-buttons {
                // @include flex(row, center, center, 1em);
                grid-area:5/2/5/7;
                // position: relative;
                // z-index: 1;
                // top: -50px; 

                button {
                    min-width: 100px;
                    min-height: 50px;
                    font-weight: bold;
                    border-radius: 30px;

                     &:nth-child(1) {
                        background-color: $success;
                        color: $black;
                        margin-right: 1em;

                    }

                    &:nth-child(2) {
                        background-color: $primary-color;
                        order: 2;
                    }
                   
                }

                .explore-product-button {
                    transition: all 0.5s ease-in-out;
                    &:hover {
                        background-color: $success;
                        color: $black;
                    }
                }

                .try-now-button {
                    transition: all 0.5s ease-in-out;
                    &:hover {
                        background-color: $primary-color;
                        color: $white;
                    }
                }
            }


            .landing-image{
                width: 100%;
                height: 100%;
                transform: rotateY(180deg);
                grid-area: 1/10/-1/-1;
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px,1fr));
                grid-template-rows: repeat(6,100px);
                // position: absolute;
                // right: 10px;

                img{
                    display: block;
                    grid-area: 1/1/4/6;

                }
                

                .landing-image-icon{
                    // position:  absolute;
                    // z-index: -1;
                    // left: 80%;
                    // top: 45%;   
                    // display: none;
                }

                .first-icon{
                    grid-area:5/4/5/4;
                }

                .second-icon{
                    // top: 10%;
                    // left: 10px;
                    // display: none;
                    grid-area: 2/1/2/1;

                }

                .third-icon{
                    // top: 62%;
                    // left: 10%;
                    // z-index: 3;
                    // display: none;
                    grid-area: 7/2/7/2;
                }
            }

      
        }

        .landing-page-overlay {
            width: inherit;
            height: inherit;
            background-color: rgba(0, 0, 0, 0.719);
            @extend .centerAbsolute;
            z-index: 0;
            display: none;
        }
    }

    @media screen and (max-width: $breakingpoint_medium) {
        @import "../style.scss";

        .landing-page-container {
            .landing-content {

                .landing-headline {
                    font-size: 2.5rem;
                    line-height: 1em;
                    text-align: center;
                    grid-area: 3/1/3/-1;
                }

                .landing-description {
                    grid-area: 4/1/4/-1;
                    text-align: center;
                    margin: 0 auto;
                }

                .landing-cta-buttons {
                    grid-area: 5/1/5/-1;
                    text-align: center;
                }

                .landing-image{
                    // grid-area: 3/10/6/17;
                    display: none;
                .landing-image-icon{
                    display: none;



                }

            }
            }

         
        }
    }

    @media screen and (max-width: $breakingpoint_mobile) {
        @import "../style.scss";

        .landing-page-container {
            .landing-content {
                @include flex(column, center, center, 1em);
                height: 100vh;
                padding: 0;

                .landing-headline {
                    font-size: 2.5rem;
                    width:100%;
                    line-height: 1em;
                    text-align: center;

                }

                .landing-description {
                    text-align: center;
                    width: 50%;

                }

               

                .landing-cta-buttons {
                    @include flex(column, center, center, 1em);


                    button {
                        &:nth-child(1) {
                            order: 2;
                        }
                    }
                }
            }
        }
    }
</style>
