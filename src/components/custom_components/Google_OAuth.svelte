<script lang='ts'>
  // external imports
  import Icon from "@iconify/svelte";
</script>

 <button
    type="submit"
    class="font-bold py-2 px-4 rounded focus:outline-none focus:border-green-500 hover:border-green-500 focus:ring-green-500 focus:ring-1"
    >
        <Icon
            icon="flat-color-icons:google"
            style="width: 25px; height: 25px;"
        />
        <span>Continue with Google</span>
   </button>


   <style lang="scss">
    @import "../../style.scss";

        :is(button){
                border: solid 2px $primary-color;
                background-color: $white;
                color: $primary-color;
                @include flex(row, center, center, 1em);
                height: 6vh;
                width: 100%;
                transition: all .5s ease;

                &:hover{
                    color: $white;
                    background-color: $primary-color;
                    border: solid 1px $white;
                }

            }
   </style>