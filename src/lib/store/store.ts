import { writable } from "svelte/store";

export const selectedDashboardMenu = writable<string>("home");

export const selectedDashboardMenuUpdater = (item: string) => {
    selectedDashboardMenu.set(item);
};



