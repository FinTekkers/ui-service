
<script lang="ts">
  import LandingSection from "../components/GetStartedSection.svelte";
    import AboutSection from "../components/OurFeatureSection.svelte";
    import Video_section from '../components/VideoSection.svelte';
    import VideoSection from "../components/VideoSection.svelte";
    import LandingOverview from '../components/LandingSection.svelte';
    import Icon from "@iconify/svelte";
    import Page from '../routes/+page.svelte';
    import Footer from '../components/FooterSection.svelte';



</script>


<div class="landing_page_overlay" >
 <LandingOverview />
 <LandingSection />
 <AboutSection />
 <VideoSection />
 <Footer />
</div>


<style lang="scss">
  @import "../style.scss";

  .landing_page_overlay{
    height: 100vh;
    width: 100vw;
    background-color: $background-color;
  }




</style>
