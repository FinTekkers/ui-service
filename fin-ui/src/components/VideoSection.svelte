<script lang="ts">
</script>


<div class="Video_section">

    <div class="video_description">
        <h1>Api calls</h1>
        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Non neque voluptatem ut qui quibusdam tempore placeat dolor. Veniam, iusto ab!</p>
    </div>

</div>

<style lang="scss">
    @import "../style.scss";

    .Video_section{
       padding: 4em 1em 1em 1em;
       height: 50vh;
       background-color: $background-color;
       border: 1px solid #000;
       @include flex(row,center, flex-start,1em);
       h1{
           padding-bottom: 1em;
       }
       p{
           width:30vw
       }


    }

</style>