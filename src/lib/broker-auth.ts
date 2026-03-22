/**
 * Broker authentication helper.
 *
 * When the broker's auth endpoints are ready, this module will handle:
 * - Register: POST to broker /auth/register
 * - Login: POST to broker /auth/login → returns API key
 * - Session: Store API key in httpOnly secure cookie
 * - gRPC metadata: Inject x-api-key into every gRPC call
 *
 * For now, this is a stub that documents the planned interface.
 * The existing Lucia/SQLite auth continues to work until the broker
 * auth is confirmed working.
 */

import EnvConfig from '@fintekkers/ledger-models/node/wrappers/models/utils/requestcontext';

// Broker runs on port 80
const BROKER_URL = EnvConfig.apiURL.replace(/:8082$/, ':80').replace(/:8080$/, ':80').replace(/:8083$/, ':80');

export interface RegisterRequest {
  email: string;
  password: string;
  firstname?: string;
  lastname?: string;
  signupCode: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  apiKey?: string;
  error?: string;
}

/**
 * TODO: Implement when broker auth endpoints are ready.
 * Will call broker's gRPC or REST register endpoint.
 */
export async function brokerRegister(_req: RegisterRequest): Promise<AuthResponse> {
  // Placeholder — will be implemented when broker auth is ready
  return { success: false, error: 'Broker auth not yet implemented — using local auth' };
}

/**
 * TODO: Implement when broker auth endpoints are ready.
 * Will call broker's gRPC or REST login endpoint and return API key.
 */
export async function brokerLogin(_req: LoginRequest): Promise<AuthResponse> {
  // Placeholder — will be implemented when broker auth is ready
  return { success: false, error: 'Broker auth not yet implemented — using local auth' };
}

/**
 * Get an authenticated gRPC channel URL.
 * Currently returns the direct service URL.
 * When broker auth is active, will return broker URL (port 80)
 * and all calls will be routed through the broker with x-api-key metadata.
 */
export function getServiceURL(servicePort: number): string {
  // TODO: When broker auth is active, route all calls through broker on :80
  // return BROKER_URL;

  // Current: direct connection to individual services
  return EnvConfig.apiURL.replace(':8082', `:${servicePort}`);
}

/**
 * Port mapping for direct service connections.
 * Will be removed when all calls go through broker.
 */
export const SERVICE_PORTS = {
  VALUATION: 8080,
  LEDGER: 8082,
  PRICE: 8083,
  BROKER: 80,
} as const;
