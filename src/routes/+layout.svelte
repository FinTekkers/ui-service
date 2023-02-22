<script>
	import {
		Header,
		HeaderNav,
		HeaderNavItem,
		SkipToContent,
		Content,
		HeaderUtilities,
		HeaderSearch,
		HeaderAction,
		HeaderPanelLink
	} from 'carbon-components-svelte';

	import UserAvatarFilledAlt from 'carbon-icons-svelte/lib/UserAvatarFilledAlt.svelte';

	import 'carbon-components-svelte/css/white.css';

	let isSideNavOpen = false;
	let loggedIn = true;
</script>

<Header company="FNTKR" platformName="Ledger Modeling" bind:isSideNavOpen href="/">
	<svelte:fragment slot="skip-to-content">
		<SkipToContent />
	</svelte:fragment>
	<HeaderNav>
		<HeaderNavItem href="/portfolios" text="Portfolios" />
		<HeaderNavItem href="/transactions" text="Transactions" />
	</HeaderNav>
	<HeaderUtilities>
		<HeaderSearch />
		<HeaderAction icon={UserAvatarFilledAlt}>
			<HeaderPanelLink
				on:click={() => {
					loggedIn = !loggedIn;
				}}
				>{#if loggedIn}
					Log Out
				{:else}
					Log In
				{/if}
			</HeaderPanelLink>
		</HeaderAction>
	</HeaderUtilities>
</Header>

<Content>
	<slot />
</Content>
