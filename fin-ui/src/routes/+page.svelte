
<script lang="ts">
  import LandingSection from "../components/LandingSection.svelte";
    import AboutSection from "../components/AboutSection.svelte";
    import Video_section from '../components/VideoSection.svelte';
    import VideoSection from "../components/VideoSection.svelte";
    import Icon from "@iconify/svelte";

</script>


<div class="landing_page_overlay">
 <LandingSection />
 <AboutSection />
 <VideoSection />
</div>


<style lang="scss">
  @import "../style.scss";

  .landing_page_overlay{
    height: 100vh;
    background-color: $background-color;
  }

</style>
