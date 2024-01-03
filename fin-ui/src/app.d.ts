// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
declare namespace App {
  interface booleans{
    obrUser:boolean
  }

  interface NavbarURL {
    url:string,
    text:string,
    id:string,
    icon:string
  }

interface FooterLink {
  text: string;
  url: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}



declare namespace Login {
  interface formError{
    error:string
  }
}

declare namespace Obr{
  interface userArchetypes{
    title:string,
    content:string,
    link:string,
    type:string
  };

  interface codeBlockContent{
    language:string,
    installCMD:string,
    importCode:string
  };
  interface codeBlockData{
    codeLanguage:codeBlockContent;
   
  }
}


declare namespace Debug{
  interface underConstruct{
    xploreProduct:boolean
  }
}