<script lang="ts">

export const load = async (event:any) => {
  return {
    session: await event?.locals.getSession(),
  }
}

</script>
<slot />
