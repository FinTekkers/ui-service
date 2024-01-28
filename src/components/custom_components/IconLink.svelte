<script lang='ts'>
  // extenral imports
  import Icon from "@iconify/svelte";
  // internal imports
  export let iconName:string;
  export let iconCss:string = "width: 25px; height: 25px;";

</script>


<div class="custom-icon">
   <Icon
          icon={iconName}
          style={iconCss}
        />
<slot /> 
</div>

<style lang="scss">
    @import "../../style.scss";

    .custom-icon{
        @include flex(row, center, center, 1em);
    }
</style>