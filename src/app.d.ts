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

declare namespace App {

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