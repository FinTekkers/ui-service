import { writable, get } from "svelte/store";

// main portfolio data store & methods
export const portfolioStore = writable<string[]>([]);

export const portfolioStoreUpdate = async (data: App.PageData) => {
  try {
    const portfolioData = await data;
    if (portfolioData !== null || undefined) {
      portfolioStore.update(store => {
        store = data;
        return store;
      });
    }
  } catch (error) {
    if (error) {
      console.log("something went wrong in portfolio update");
      console.log(error);
    }
  }
};

// sidebar store
export const sideMenuStore = writable<boolean>(false);

// sidebar method

export const toggleSidebarMenu = ()=>{
  let bool = get(sideMenuStore);

  sideMenuStore.update((store)=>{
   store = !bool;
   return store;
  })
}
// Boolean store 
export const obrPromptBoolean = writable<boolean>(true)

export const toggleObrPromptBoolean = ()=>{
  let bool = get(obrPromptBoolean);
  
  obrPromptBoolean.update((store)=>{
    store = !bool;
    return store;
  })
}


// main menu navigation store & methods
export const currentMenu = writable<string>("home");


// login page store & methods
export const isSignInOrSignUp = writable<boolean>(false)

export const toggleSignInForm = ()=>{
       let bool = get(isSignInOrSignUp)
       isSignInOrSignUp.update((store)=>{
         store = !bool;
         return store
       })
}


// store of booleans
export const UnderConstructBoolean  = writable<Debug.underConstruct>({
    xploreProduct:false,
})  

export const toggleUnderConstruct = (key:keyof Debug.underConstruct)=>{
    let bool = get(UnderConstructBoolean);
    UnderConstructBoolean.update((store) => {
                  // Check if the key exists in the store
                  if (store.hasOwnProperty(key)) {
                    // Toggle the boolean value of the specified key
                    store[key] = !store[key];
                  } else {
                    // If the key doesn't exist, you may want to handle this case accordingly
                    console.error(`Key '${key}' does not exist in the store.`);
                  }
    return { ...store };
})

}