<script lang='ts'>

// internal imports
import ObrCard from "./OBRCard.svelte";
import { userArchetypeData } from "$lib/uidata";

 
</script>

<div>
    <div class="overlay_window"></div>
    
    <div class="obr_landing">
    {#each userArchetypeData as user} 
            <ObrCard {user} />
    {/each}
    </div>


</div>


<style lang="scss">
    @import "../../style.scss";
    .obr_landing{
        width: 50vw;
        height: 60vh;
        padding: 1em;
        @include flex(row, center, center, 1em);
        @extend .centerAbsolute;
        border-radius: $bd-radius;
        transition: all .5s ease;
        background: rgba(255, 255, 255, 0.856);

    }

      .overlay_window{
            width: 100vw;
            height: 100vh;
            @extend .centerAbsolute;
            background-color: $transpblack;
        }


@media screen and (max-width: $breakingpoint_medium){
    .obr_landing{
        width: 90%;
    }
    
}
        
@media screen and (max-width: $breakingpoint_mobile){
    .obr_landing{
        width: 90%;
    }
    
}
</style>