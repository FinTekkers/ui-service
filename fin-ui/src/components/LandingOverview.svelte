<script lang="ts">

</script>

<div class="landing_overview">
    <div class="overlay">
    </div>

    <div class="content">
        <h1>Welcome to Fintekkers</h1>
        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptate, error.</p>

        <div class="action_buttons">
            <button class="button">Explore Product</button>
            <button class="button">Try Now</button>
        </div>
    </div>
</div>

<style lang="scss">
    @import "../style.scss";

    .landing_overview{
        width: 100%;
        height: 100vh;
        background-image: url('https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D');
        background-size: cover;
        background-position: center center;
        background-repeat: no-repeat;
        position: relative;

        .content{
         @extend   .centerAbsolute;
         width: 100%;
         @include flex(column, center, center, 3em);

         .action_buttons{
         @include flex(row, center, center, 1em);

             button{
                 min-width: 300px;
                 min-height: 50px;
                 font-weight: bold;

                 &:nth-child(1){
                     background-color: $primary-color;
                 }
                 &:nth-child(2){
                     background-color: $success;
                     color: $black;
                 }
             }
         }

         h1{
             font-size: 5rem;
             text-align: center;
             width: 70%;
         }
        }

        .overlay{
            width: inherit;
            height: inherit;
            background-color: rgba(0, 0, 0, 0.719);
            @extend .centerAbsolute;
            z-index: 0;

        }
    }
</style>