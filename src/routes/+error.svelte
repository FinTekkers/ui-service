<script>
    import { goto } from '$app/navigation';
	import { page } from '$app/stores';
</script>

<div class="grid gap-5 text-center place-items-center">
	{#if $page.status === 404}
		<h1 class="text-2xl font-bold">404 - Page Not Found</h1>

		<p class="text-muted-foreground">
			Oops! The page you're looking for does not exist. It might have been moved, renamed, or might
			never existed.
		</p>

		<button on:click={()=>goto("/")} class="w-fit">Go Back</button>
	{:else}
		<h1>{$page.status}: {$page.error?.message}</h1>
	{/if}
</div>