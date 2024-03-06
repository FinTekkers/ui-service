<script lang="ts">
    import Icon from "@iconify/svelte";
</script>

<div class="video_section">
    <div class="video_description">
        <Icon
            icon="ph:video-duotone"
            style="width: 120px; height: 120px; color:#258ea8; opacity:50%"
            class="icon"
        />
        <p>Learn more about our Platform</p>
    </div>

    <div class="video_container">
        <iframe
            id="videoFrame"
            width={670}
            height={380}
            src="https://www.youtube.com/embed/gjBxFPf0DTs?si=4HlILChW7lLOrpZp"
            title="YouTube video player"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        />
    </div>
</div>

<style lang="scss">
    @import "../style.scss";

    .video_section {
        height: 100vh;
        background: $white;
        @include flex(column, center, center, 2em);
        text-align: center;

        .video_description {
            @include flex(column, center, center, 1em);

            p {
                width: 40vw;
                color: $bgc-color;
                font-size: 2rem;
                margin-bottom: 1em;
                font-weight: bold;
                line-height: 1.2em;
            }
        }

        .video_container {
            position: relative;
            left: 0.8%;
        }
    }

    @media screen and (max-width: $breakingpoint_medium) {
        .video_section {
            .video_container {
                position: relative;
                width: 70%;
                padding-bottom: 40%;
                overflow: hidden;

                iframe {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                }
            }
        }
    }

    @media screen and (max-width: $breakingpoint_mobile) {
        .video_section {
            .video_container {
                position: relative;
                width: 100%;
                padding-bottom: 56.25%;
                overflow: hidden;
                left: 0%;
            }

            .video_container {
                iframe {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                }
            }
        }
    }
</style>
