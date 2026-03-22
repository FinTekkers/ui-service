/**
 * gRPC Auth client for the broker service.
 * Handles Register and Login RPCs, API key session management,
 * and authenticated gRPC channel creation.
 */
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import type { Cookies } from '@sveltejs/kit';

const BROKER_HOST = process.env.BROKER_HOST ?? 'localhost:80';
const AUTH_COOKIE = 'ft_api_key';
const AUTH_PROTO_PATH = path.resolve(
  process.env.BROKER_PROTO_PATH ?? path.join(process.env.HOME ?? '', 'projects/broker-service/proto/auth.proto')
);

// --- Proto loading (dynamic, no compile needed) ---

let authClient: any = null;

function getAuthClient(): any {
  if (authClient) return authClient;

  const packageDef = protoLoader.loadSync(AUTH_PROTO_PATH, {
    keepCase: false,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });
  const proto = grpc.loadPackageDefinition(packageDef) as any;
  authClient = new proto.fintekkers.services.auth.Auth(
    BROKER_HOST,
    grpc.credentials.createInsecure()
  );
  return authClient;
}

// --- Public API ---

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  signupCode: string;
}

export interface RegisterResult {
  success: boolean;
  userId?: string;
  message?: string;
  error?: string;
}

export async function brokerRegister(input: RegisterInput): Promise<RegisterResult> {
  try {
    const client = getAuthClient();
    const response = await new Promise<any>((resolve, reject) => {
      client.register({
        email: input.email,
        password: input.password,
        name: input.name,
        signupCode: input.signupCode,
      }, (err: any, resp: any) => {
        if (err) reject(err);
        else resolve(resp);
      });
    });

    return {
      success: response.success,
      userId: response.userId,
      message: response.message,
    };
  } catch (error: any) {
    const code = error.code;
    const detail = error.details ?? error.message ?? 'Registration failed';

    if (code === grpc.status.INVALID_ARGUMENT) {
      return { success: false, error: detail };
    }
    if (code === grpc.status.ALREADY_EXISTS) {
      return { success: false, error: 'Email already registered' };
    }
    return { success: false, error: detail };
  }
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResult {
  success: boolean;
  apiKey?: string;
  email?: string;
  name?: string;
  userId?: string;
  error?: string;
}

export async function brokerLogin(input: LoginInput): Promise<LoginResult> {
  try {
    const client = getAuthClient();
    const response = await new Promise<any>((resolve, reject) => {
      client.login({
        email: input.email,
        password: input.password,
      }, (err: any, resp: any) => {
        if (err) reject(err);
        else resolve(resp);
      });
    });

    return {
      success: true,
      apiKey: response.apiKey,
      email: response.email,
      name: response.name,
      userId: response.userId,
    };
  } catch (error: any) {
    const detail = error.details ?? error.message ?? 'Login failed';
    return { success: false, error: detail };
  }
}

// --- Session management ---

export function setApiKeyCookie(cookies: Cookies, apiKey: string) {
  cookies.set(AUTH_COOKIE, apiKey, {
    path: '/',
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export function getApiKeyFromCookies(cookies: Cookies): string | undefined {
  return cookies.get(AUTH_COOKIE) || undefined;
}

export function clearApiKeyCookie(cookies: Cookies) {
  cookies.delete(AUTH_COOKIE, { path: '/' });
}

// --- gRPC metadata injection ---

/**
 * Create gRPC metadata with the API key for authenticated calls.
 */
export function createAuthMetadata(apiKey: string): grpc.Metadata {
  const metadata = new grpc.Metadata();
  metadata.add('x-api-key', apiKey);
  return metadata;
}

/**
 * Get an authenticated gRPC credentials object.
 * Wraps insecure credentials with per-call API key metadata.
 */
export function getAuthenticatedCredentials(apiKey: string): grpc.ChannelCredentials {
  const callCreds = grpc.credentials.createFromMetadataGenerator(
    (_params, callback) => {
      const metadata = new grpc.Metadata();
      metadata.add('x-api-key', apiKey);
      callback(null, metadata);
    }
  );
  return grpc.credentials.combineChannelCredentials(
    grpc.credentials.createInsecure(),
    callCreds
  );
}

/**
 * Get the broker URL for routing all gRPC calls.
 */
export function getBrokerURL(): string {
  return BROKER_HOST;
}

/**
 * Get gRPC connection params for service calls.
 * When API key is available, routes through broker with auth metadata.
 * Otherwise falls back to direct service connection.
 */
export function getServiceConnection(apiKey?: string): { url: string; credentials: grpc.ChannelCredentials } {
  if (apiKey) {
    return {
      url: BROKER_HOST,
      credentials: getAuthenticatedCredentials(apiKey),
    };
  }
  // Fallback: direct connection without auth
  return {
    url: BROKER_HOST,
    credentials: grpc.credentials.createInsecure(),
  };
}
