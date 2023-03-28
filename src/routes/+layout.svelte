<script>
	import '../app.css';
</script>

<nav class=" bg-slate-900">
	<div class="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
		<div class="relative flex h-16 items-center justify-between">
			<div class="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
				<div class="flex flex-shrink-0 items-center">
					<img
						class="block h-8 w-auto lg:hidden"
						src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=500"
						alt="Your Company"
					/>
					<img
						class="hidden h-8 w-auto lg:block"
						src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=500"
						alt="Your Company"
					/>
				</div>
				<div class="hidden sm:ml-6 sm:block">
					<div class="flex space-x-4">
						<a
							href="/"
							class="text-white hover:bg-gray-700 hover:text-white rounded-md px-3 py-2 text-lg"
							>Home</a
						>
						<a
							href="/portfolios"
							class="text-white hover:bg-gray-700 hover:text-white rounded-md px-3 py-2 text-lg "
							>Portfolios</a
						>
						<a
							href="/transactions"
							class="text-white hover:bg-gray-700 hover:text-white rounded-md px-3 py-2 text-lg"
							>Transactions</a
						>
					</div>
				</div>
			</div>
		</div>
	</div>
</nav>

<div class="container mx-auto px-10 mb-20">
	<slot />
</div>

<style lang="postcss">
	:global(html) {
		background-color: theme(colors.stone.100);
	}
</style>
