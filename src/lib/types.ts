import type { booleanKeys, dashboardMenuList } from "$lib/Util"

export type booleanStoreType = {
  [key in booleanKeys]?: boolean;
}

export type portfolioStoreType = any;

export type formError = {
  message?:string,
  formError?: ArrayLike<unknown>,
  Error?:object,
  missing?:boolean,
  firstname?:string,
  lastname?:string,
  email?:string,
  success?:boolean,

}

export type dashboardMenuItemType = {
    location: string,
    navigateTo: keyof typeof dashboardMenuList,
    style:string,
    iconName: string,
    menuName:string
}

export type dahsboardMenuDataType = [string, dashboardMenuItemType]

export interface dashboardMenuType {
    portfolio:dashboardMenuItemType,
    transaction:dashboardMenuItemType,
    position:dashboardMenuItemType,
    security:dashboardMenuItemType,
}


export interface NavbarURL {
    url:string,
    text:string,
    id:string,
    icon:string
  }

export interface FooterLink {
  text: string;
  url: string;
}

export interface FooterSection {
  title: string;
  links: FooterLink[];
}

export interface userArchetypes{
  title:string,
  content:string,
  link:string,
  type:string
}

export interface codeBlockContent{
  language:string,
  installCMD:string,
  importCode:string
}

export interface installCodeLangType {
  Typescript:codeBlockContent,
  Python:codeBlockContent,
  Java:codeBlockContent
}

export interface codeBlockData{
  codeLanguage:codeBlockContent;
  
}
