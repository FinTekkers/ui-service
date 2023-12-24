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
    <div class="landing-page-overlay" />

    <div class="landing-content">
        <h1 class="landing-headline" use:reveal={{ transition: "fade" }}>
         Fintekkers is a Premier Fintech Infrastructure
        </h1>
        <p class="landing-description">
            We worry about scale, security and
            plumbing while you focus on your competitive advantage, your ideas.
        </p>

        <div class="landing-cta-buttons">
            <button
                class="button explore-product-button"
                on:click={() => toggleUnderConstruct("xploreProduct")}
                disabled>Explore Product</button
            >
            <button class="button try-now-button" on:click={() => goto("/login")}
                >Try Now</button
            >
        </div>
    </div>
    <div class="landing-image">
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
    </div>
</div>

<style lang="scss">
    @import "../style.scss";

    .landing-page-container {
        width: 100%;
        height: 100vh;
        background-image: url("https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"); 
        background-size: cover;
        background-position: center center;
        background-repeat: no-repeat;
        position: relative;
        @include flex(row,center,center, 1em);

        .landing-image{
            width: 50%;
            height: 100%;
            transform: rotateY(180deg);
            position: absolute;
            right: 10px;

            .landing-image-icon{
                position:  absolute;
                z-index: -1;
                left: 80%;
                top: 45%;   
            }

            .second-icon{
                top: 10%;
                left: 10px;
            }

            .third-icon{
                top: 62%;
                left: 10%;
                z-index: 3;
            }
        }

        .landing-content {
            width: 100%;
            height: 100%;
            @include flex(column, center, flex-start, 3em);
            padding-left: 5em;
            border-radius: $bd-radius;
           @extend .glass_background;

            .landing-headline {
                font-size: 3rem;
                text-align: left;
                width: 40vw;
                line-height: 1.2em;
            }


            .landing-description{
                width: 30vw;
                font-size: 1em;
            }

            .landing-cta-buttons {
                @include flex(row, center, center, 1em);

                button {
                    min-width: 100px;
                    min-height: 50px;
                    font-weight: bold;
                    border-radius: 30px;

                    &:nth-child(1) {
                        background-color: $primary-color;
                        order: 2;
                    }
                    &:nth-child(2) {
                        background-color: $success;
                        color: $black;
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

    @media screen and (max-width: $breakingpoint_md) {
        @import "../style.scss";

        .landing-page-container {
            .landing-content {
                height: 60vh;

                .landing-headline {
                    font-size: 3.5rem;
                    line-height: 1em;
                }

                .landing-description {
                    text-align: center;
                    margin-bottom: 0.5em;
                }

                .landing-cta-buttons {
                    .button {
                        min-width: 200px;
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

                .landing-headline {
                    font-size: 2.5rem;
                    width: 300px;
                    line-height: 1em;
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
