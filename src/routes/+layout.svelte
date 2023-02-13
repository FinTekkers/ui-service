<script>
	import {
		Header,
		HeaderNav,
		HeaderNavItem,
		SkipToContent,
		Content
	} from 'carbon-components-svelte';

	import 'carbon-components-svelte/css/white.css';

	let isSideNavOpen = false;
</script>

<Header company="FNTKR" platformName="Analytics" bind:isSideNavOpen href="/">
	<svelte:fragment slot="skip-to-content">
		<SkipToContent />
	</svelte:fragment>
	<HeaderNav>
		<HeaderNavItem href="/valuation" text="Valuation" />
		<HeaderNavItem href="/" text="Portfolios" />
		<HeaderNavItem href="/" text="Securities" />
	</HeaderNav>
</Header>

<Content>
	<slot />
</Content>
