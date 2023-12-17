<script>
    import { reveal } from "svelte-reveal";
    import { goto } from "../lib/helper";
    import {
        toggleUnderConstruct,
        UnderConstructBoolean,
    } from "../store/store";

    $: console.log($UnderConstructBoolean);
</script>

<div class="landing_overview">
    <div class="overlay" />

    <div class="content">
        <h1 class="content_title" use:reveal={{ transition: "fade" }}>
            Welcome to Fintekkers
        </h1>
        <p class="content_paragraph">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptate,
            error.
        </p>

        <div class="action_buttons">
            <button
                class="button btn_explore_product"
                on:click={() => toggleUnderConstruct("xploreProduct")}
                disabled>Explore Product</button
            >
            <button class="button btn_Try_Now" on:click={() => goto("/login")}
                >Try Now</button
            >
        </div>
    </div>
</div>

<style lang="scss">
    @import "../style.scss";

    .landing_overview {
        width: 100%;
        height: 100vh;
        background-image: url("../lib/images/background.png");
        background-size: cover;
        background-position: center center;
        background-repeat: no-repeat;
        position: relative;

        .content {
            @extend .centerAbsolute;
            width: 100%;
            @include flex(column, center, center, 3em);

            .action_buttons {
                @include flex(row, center, center, 1em);

                button {
                    min-width: 300px;
                    min-height: 50px;
                    font-weight: bold;

                    &:nth-child(1) {
                        background-color: $primary-color;
                        order: 2;
                    }
                    &:nth-child(2) {
                        background-color: $success;
                        color: $black;
                    }
                }

                .btn_explore_product {
                    transition: all 0.5s ease-in-out;
                    &:hover {
                        background-color: $success;
                        color: $black;
                    }
                }

                .btn_Try_Now {
                    transition: all 0.5s ease-in-out;
                    &:hover {
                        background-color: $primary-color;
                        color: $white;
                    }
                }
            }

            h1 {
                font-size: 5rem;
                text-align: center;
                width: 70%;
            }
        }

        .overlay {
            width: inherit;
            height: inherit;
            background-color: rgba(0, 0, 0, 0.719);
            @extend .centerAbsolute;
            z-index: 0;
        }
    }

    @media screen and (max-width: $breakingpoint_md) {
        @import "../style.scss";

        .landing_overview {
            .content {
                height: 60vh;

                .content_title {
                    font-size: 3.5rem;
                    line-height: 1em;
                }

                .content_paragraph {
                    text-align: center;
                    margin-bottom: 0.5em;
                }

                .action_buttons {
                    .button {
                        min-width: 200px;
                    }
                }
            }
        }
    }

    @media screen and (max-width: $breakingpoint_mobile) {
        @import "../style.scss";

        .landing_overview {
            .content {
                @include flex(column, center, center, 1em);

                .content_title {
                    font-size: 2.5rem;
                    width: 300px;
                    line-height: 1em;
                }

                .content_paragraph {
                    text-align: center;
                    width: 50%;
                }

                .action_buttons {
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
