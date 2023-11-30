<script lang="ts">
import Icon from "@iconify/svelte";
export let user:Obr.userArchetypes;
import {toggleObrPromptBoolean} from '../../store/store';
</script>

<div class="obr_card" on:click={()=> {
  toggleObrPromptBoolean()
 
}} >
  <slot >
       <Icon icon='solar:user-linear' style='width:50px;height:50px; color:#1b6f85' class='icon'/>
       <h1>{user.title}</h1>
       <p>{user.content}</p>
    </slot>
</div>

<style lang="scss">
  @import "../../style.scss";


  .obr_card{ 
    border-radius: $bd-radius;
    padding: 1em;
    width: 15vw;
    aspect-ratio: 1/1;
    @include flex(column,center,center, 1em);
    transition: all .5s ease;
    border: solid 1px $grey;
    

    &:hover{
            cursor: pointer;
            border: solid 2px $primary-button;
        }



    h1{
      color:$black;
    }

    p{
      text-align:center;
      color: $grey;
    }

  }

</style>