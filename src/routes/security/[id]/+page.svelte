<script lang="ts">
    import {page} from "$app/stores"
    export let data;
</script>
<body>
    <div>
        Welcome to nested route
        <div>{$page.params.id}</div>
        <div>{JSON.stringify(data.nums)} </div>
        
            
    </div>
</body>