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

// route function helpers
type NonFunctionKeys<T> = { [K in keyof T]: T[K] extends Function ? never : K }[keyof T]
type FunctionKeys<T> = { [K in keyof T]: T[K] extends Function ? K : never }[keyof T]
type FunctionParams<T> = T extends (...args: infer P) => any ? P : never

const AllObjs = { ...PAGES, ...ACTIONS, ...SERVERS }
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
