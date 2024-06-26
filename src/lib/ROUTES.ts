/* eslint-disable */
/** 
 * This file was generated by 'vite-plugin-kit-routes'
 * 
 *      >> DO NOT EDIT THIS FILE MANUALLY <<
 */

/**
 * PAGES
 */
const PAGES = {
  "/": `/`,
  "/auth/email-verification": `/auth/email-verification`,
  "/auth/login": `/auth/login`,
  "/auth/register": `/auth/register`,
  "/auth/reset-password": `/auth/reset-password`,
  "/dashboard": `/dashboard`
}

/**
 * SERVERS
 */
const SERVERS = {
  "GET /auth/oauth/github": `/auth/oauth/github`,
  "GET /auth/oauth/github/callback": `/auth/oauth/github/callback`,
  "GET oauth/google": `oauth/google`,
  "GET oauth/google/callback": `oauth/google/callback`
}

/**
 * ACTIONS
 */
const ACTIONS = {
  "verifyCode /auth/email-verification": `/auth/email-verification?/verifyCode`,
  "sendNewCode /auth/email-verification": `/auth/email-verification?/sendNewCode`,
  "logInUser /auth/login": `/auth/login?/logInUser`,
  "sendPasswordResetEmail /auth/login": `/auth/login?/sendPasswordResetEmail`,
  "registerUser /auth/register": `/auth/register?/registerUser`,
  "resetPassword /auth/reset-password": `/auth/reset-password?/resetPassword`,
  "logout /dashboard": `/dashboard?/logout`,
  "changePassword /dashboard": `/dashboard?/changePassword`,
  "deleteAllUsers /dashboard": `/dashboard?/deleteAllUsers`
}

/**
 * LINKS
 */
const LINKS = {
  
}

/**
 * Append search params to a string
 */
const appendSp = (sp?: Record<string, string | number | undefined>, prefix: '?' | '&' = '?') => {
  if (sp === undefined) return ''
  const mapping = Object.entries(sp)
    .filter(c => c[1] !== undefined)
    .map(c => [c[0], String(c[1])])

  const formated = new URLSearchParams(mapping).toString()
  if (formated) {
    return `${prefix}${formated}`
  }
  return ''
}

/**
 * get the current search params
 * 
 * Could be use like this:
 * ```
 * route("/cities", { page: 2 }, { ...currentSP() })
 * ```
 */ 
export const currentSp = () => {
  const params = new URLSearchParams(window.location.search)
  const record: Record<string, string> = {}
  for (const [key, value] of params.entries()) {
    record[key] = value
  }
  return record
}

// route function helpers
type NonFunctionKeys<T> = { [K in keyof T]: T[K] extends Function ? never : K }[keyof T]
type FunctionKeys<T> = { [K in keyof T]: T[K] extends Function ? K : never }[keyof T]
type FunctionParams<T> = T extends (...args: infer P) => any ? P : never

const AllObjs = { ...PAGES, ...ACTIONS, ...SERVERS, ...LINKS }
type AllTypes = typeof AllObjs

/**
 * To be used like this: 
 * ```ts
 * import { route } from './ROUTES'
 * 
 * route('site_id', { id: 1 })
 * ```
 */
export function route<T extends FunctionKeys<AllTypes>>(key: T, ...params: FunctionParams<AllTypes[T]>): string
export function route<T extends NonFunctionKeys<AllTypes>>(key: T): string
export function route<T extends keyof AllTypes>(key: T, ...params: any[]): string {
  if (AllObjs[key] as any instanceof Function) {
    const element = (AllObjs as any)[key] as (...args: any[]) => string
    return element(...params)
  } else {
    return AllObjs[key] as string
  }
}

/**
* Add this type as a generic of the vite plugin `kitRoutes<KIT_ROUTES>`.
* 
* Full example:
* ```ts
* import type { KIT_ROUTES } from './ROUTES'
* import { kitRoutes } from 'vite-plugin-kit-routes'
* 
* kitRoutes<KIT_ROUTES>({
*  PAGES: {
*    // here, key of object will be typed!
*  }
* })
* ```
*/
export type KIT_ROUTES = { 
  PAGES: { '/': never, '/auth/email-verification': never, '/auth/login': never, '/auth/register': never, '/auth/reset-password': never, '/dashboard': never }
  SERVERS: { 'GET /auth/oauth/github': never, 'GET /auth/oauth/github/callback': never, 'GET oauth/google': never, 'GET oauth/google/callback': never }
  ACTIONS: { 'verifyCode /auth/email-verification': never, 'sendNewCode /auth/email-verification': never, 'logInUser /auth/login': never, 'sendPasswordResetEmail /auth/login': never, 'registerUser /auth/register': never, 'resetPassword /auth/reset-password': never, 'logout /dashboard': never, 'changePassword /dashboard': never, 'deleteAllUsers /dashboard': never }
  LINKS: Record<string, never>
  Params: Record<string, never>
}