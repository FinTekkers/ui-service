<script lang="ts">
    import Icon from "@iconify/svelte";
    import { reveal } from "svelte-reveal";
</script>

<div class="About_section">
    <div
        class="abt_section abt_section_1"
        use:reveal={{ transition: "fly", y: 10 }}
    >
        <div class="abt_subsectionTitle">
            <Icon
                icon="icon-park-outline:speed"
                style="width: 25px; height: 25px;"
            />
            <h2>Fast</h2>
        </div>
        <p>
            Use binary data streams to turbo charge your products. 'Documents'
            like XML & JSON are decades old, and don't scale to your needs.
            Scale fast, scale globally.
        </p>
    </div>
    <div
        class="abt_section abt_section_2"
        use:reveal={{ transition: "fly", y: 20, delay: 20 }}
    >
        <div class="abt_subsectionTitle">
            <Icon
                icon="game-icons:flexible-lamp"
                style="width: 25px; height: 25px;"
            />
            <h2>Convenient</h2>
        </div>
        <p>
            Our platform is built on top of open-source models (<a
                href="https://github.com/FinTekkers/ledger-models"
                >see the code</a
            >). Out of the box models, and implementations in multiple languages
            (Javascript, Python, Java, Rust) let you start building your
            application, not read through reams of API docs
        </p>
    </div>
    <div
        class="abt_section abt_section_3"
        use:reveal={{ transition: "fly", y: 30, delay: 30 }}
    >
        <div class="abt_subsectionTitle">
            <Icon icon="octicon:goal-24" style="width: 25px; height: 25px;" />
            <h2>Flexible</h2>
        </div>

        <p>
            Leverage the services you want, no more no less. Get started today
            without even needing an API key, and use our publicly available
            data. Later, you can register for an API key once you want access to
            more features (security, scale, etc)
        </p>
    </div>
</div>

<style lang="scss">
    @import "../style.scss";

    .About_section {
        padding: 1em;
        @include flex(row, center, center, 1.5em);
        background-color: $primary-color;
        height: 50vh;

        .abt_section {
            @include flex(column, center, center, 1.5em);

            .abt_subsectionTitle {
                @include flex(row, center, center, 0.5em);
            }

            &:nth-child(n) {
                width: 25vw;
                border: solid 1px rgba(255, 255, 255, 0.102);
                border-radius: 6px;
                padding: 1em;

                p {
                    text-align: center;
                }
            }
        }
    }

    @media screen and (max-width: $breakingpoint_md) {
        .About_section {
            padding: 1em;

            .abt_section {
                &:nth-child(n) {
                    width: 30%;
                }
            }
        }
    }

    @media screen and (max-width: $breakingpoint_mobile) {
        .About_section {
            height: max-content;
            display: grid;
            grid-template-columns: 1fr;
            grid-template-rows: 1fr 1fr 1fr;

            .abt_section {
                @include flex(column, center, center, 1.5em);
                &:nth-child(n) {
                    min-width: 25vw;
                    max-width: 100%;
                    width: 100%;

                    p {
                        font-size: 1rem;
                    }
                }
            }
        }
    }
</style>
