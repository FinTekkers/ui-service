// src/lib/stores/media.ts
import { readable } from 'svelte/store';
import { onMount } from 'svelte';

export const isMobile = readable(false, (set) => {
    let mediaCheck: () => void;

    onMount(() => {
        const check = () => set(window.innerWidth <= 768);
        check();

        window.addEventListener('resize', check);
        mediaCheck = () => window.removeEventListener('resize', check);
    });

    return () => {
        if (mediaCheck) mediaCheck();
    };
});
