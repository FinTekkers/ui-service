import type { User } from "$lib/server/user";
import type { Session } from "$lib/server/session";

declare namespace App {

      interface Error {
        [prop:string]:string,
        error?: object,
        errors?:object,
        flash?:{ type: 'success' | 'error'; message: string };
      }

      interface Locals{
          user: User | null;
          session: Session | null;
      }

      interface PageData{
        pageMetaTags?: MetaTagsProps;
        isUserLoggedIn?: boolean;
        form?:any;
        flash?: { type: 'success' | 'error'; message: string };
          user?: User | null;
      }

}