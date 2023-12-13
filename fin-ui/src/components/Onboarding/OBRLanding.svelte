<script lang='ts'>
import ObrCard from "./OBRCard.svelte";
import OBRPrompt from './OBRPrompt.svelte';
import { userArchetypes } from "$lib/uidata";
import {obrPromptBoolean} from '../../store/store';

 
</script>

<div>
    <div class="overlay_window"></div>
    
    <div class="obr_landing">
    {#each userArchetypes as user} 
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


@media screen and (max-width: $breakingpoint_md){
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