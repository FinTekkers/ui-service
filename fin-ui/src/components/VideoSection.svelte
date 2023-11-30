<script lang="ts">
</script>


<div class="Video_section">

    <div class="video_description">
        <h1>Learn More About Fintekkers</h1>
        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Non neque voluptatem ut qui quibusdam tempore placeat dolor. Veniam, iusto ab!</p>
    </div>

    <div class="video">
        <iframe width="670" height="380" src="https://www.youtube.com/embed/gjBxFPf0DTs?si=4HlILChW7lLOrpZp" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
  
    </div>

</div>

<style lang="scss">
    @import "../style.scss";

    .video{
        position: relative;
        left: 0.6%;
    }

    .Video_section{
       padding: 4em 1em 1em 1em;
       height: 100vh;
       background-color: $background-color;
    //    background-image: url('https://images.unsplash.com/photo-1597673030062-0a0f1a801a31?q=80&w=2796&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D');
       background-image: url('https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D');
       background-position: center -90px;
       background-size: cover;
       background-repeat: no-repeat;
       border: 1px solid #000;
       @include flex(column,flex-start, center,2em);
       text-align: center;


       .video_description{
       @include flex(column,center, center,1em);

       }
       h1{
           font-size: 2rem;
           color: $background-color;
       }
       p{
           width:50vw;
           color: $background-color;

       }


    }

</style>