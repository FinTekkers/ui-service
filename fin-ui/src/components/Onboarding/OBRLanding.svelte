<script lang='ts'>
import ObrCard from "./OBRCard.svelte";
import { userArchetypes } from "$lib/uidata";
</script>


<div class="obr_landing">
{#each userArchetypes as user}
        <ObrCard {user} />
{/each}
</div>

<style lang="scss">
    @import "../../style.scss";
    .obr_landing{
        width: 50vw;
        height: 50vh;
        padding: 1em;
        @include flex(row, center, center, 1em);
        @extend .centerAbsolute;
        background-color: $white;
        border-radius: $bd-radius;
        transition: all .5s ease;

       
    }
</style>