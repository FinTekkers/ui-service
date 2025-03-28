import { writable, get } from "svelte/store";
import type { booleanStoreType, portfolioStoreType } from "../lib/types";
import { booleanKeys } from "$lib/Util";

// store updating all project booleans
export const booleanStore = writable<booleanStoreType>({
  [booleanKeys.IS_SIDE_NAV_ACTIVE]: false,
  [booleanKeys.IS_OBR_PROMPT_SHOWING]: true,
  [booleanKeys.IS_SIGN_IN_OR_SIGN_UP]: false,
  [booleanKeys.IS_PASSWORD_VISIBLE]: false,
  [booleanKeys.IS_FEATURE_ACTIVE]: false,
})

// function that updates the boolean store, receive a key to target specific boolean
export const customBooleanStoreUpdater: (key: booleanKeys) => void = (key: booleanKeys) => {
  let _storeValue = get(booleanStore);
  if (typeof key === 'string') {
    booleanStore.update((store) => {
      store[key] = !_storeValue[key]
      return store
    })

  }
}

export const selectedDashboardMenu = writable<string>("home");

export const selectedDashboardMenuUpdater = (item: string) => {
    selectedDashboardMenu.set(item);
};



