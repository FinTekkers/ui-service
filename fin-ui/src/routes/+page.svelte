
<script lang="ts">
  import Footer from '../components/FooterSection.svelte';
  import LandingSection from "../components/GetStartedSection.svelte";
  import LandingOverview from '../components/LandingSection.svelte';
  import AboutSection from "../components/OurFeatureSection.svelte";
  import VideoSection from "../components/VideoSection.svelte";



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
    background-color: $bgc-color;
  }




</style>
