import type { User as GoogleUser } from "$lib/server/user";
import type { Session } from "$lib/server/session";

/** User authenticated via broker gRPC (email/password) */
interface BrokerUser {
      id: string;
      name: string;
      email: string;
      apiKey: string;
}

type AppUser = GoogleUser | BrokerUser;

// `declare global` (rather than top-level `declare namespace App`) is
// required when this file has imports — without it, the file is treated
// as a module and the App namespace is module-local. SvelteKit's
// generated $types files reference `App.Locals` from the global scope;
// without the global wrapper they get an empty Locals and every
// `locals.user` access lights up as "Property 'user' does not exist on
// type 'Locals'" (~41 svelte-check errors before this change).
declare global {
      namespace App {

            interface Error {
              [prop:string]:string,
              error?: object,
              errors?:object,
              flash?:{ type: 'success' | 'error'; message: string };
            }

            interface Locals{
                user: AppUser | null;
                session: Session | null;
            }

            interface PageData{
              pageMetaTags?: MetaTagsProps;
              isUserLoggedIn?: boolean;
              form?:any;
              flash?: { type: 'success' | 'error'; message: string };
                user?: AppUser | null;
            }

      }
}

// Marks this file as a module so the `declare global` above takes
// effect (would already be a module thanks to the imports, but the
// explicit empty export is the canonical idiom).
export {};
