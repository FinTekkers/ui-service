import delete_pkg from '@fintekkers/ledger-models/node/fintekkers/requests/util/delete_request_pb.js';
import { SecurityClient } from '@fintekkers/ledger-models/node/fintekkers/services/security-service/security_service_grpc_pb.js';
import { UUIDProto } from '@fintekkers/ledger-models/node/fintekkers/models/util/uuid_pb.js';
import { getServiceConnection } from '$lib/grpc-auth';

const { DeleteRequestProto, EntityTypeProto } = delete_pkg;

export interface DeleteDryRunResult {
  success: boolean;
  totalCount: number;
  affectedEntities: Array<{ entityType: number; description: string }>;
  warnings: string[];
  error?: string;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

function uuidFromHex(hex: string): any {
  const bytes = Buffer.from(hex, 'hex');
  return UUIDProto.deserializeBinary(new Uint8Array(bytes));
}

function buildDeleteRequest(uuidHex: string, dryRun: boolean, force: boolean): any {
  const request = new DeleteRequestProto();
  request.setObjectClass('DeleteRequestProto');
  request.setVersion('0.0.1');
  request.setUuid(uuidFromHex(uuidHex));
  request.setEntityType(EntityTypeProto.SECURITY);
  request.setDryRun(dryRun);
  if (force) request.setForce(true);
  return request;
}

function getClient(): any {
  const conn = getServiceConnection();
  return new SecurityClient(conn.url, conn.credentials);
}

export async function deleteSecurity(uuidHex: string, dryRun: boolean, force = false): Promise<DeleteDryRunResult> {
  try {
    const request = buildDeleteRequest(uuidHex, dryRun, force);
    const client = getClient();

    const response = await new Promise<any>((resolve, reject) => {
      client.delete(request, (error: any, response: any) => {
        if (error) reject(error);
        else resolve(response);
      });
    });

    const affectedEntities = (response.getAffectedEntitiesList?.() ?? []).map((e: any) => ({
      entityType: e.getEntityType(),
      description: e.getDescription(),
    }));

    return {
      success: response.getSuccess(),
      totalCount: response.getTotalCount(),
      affectedEntities,
      warnings: response.getWarningsList?.() ?? [],
    };
  } catch (error: any) {
    return {
      success: false,
      totalCount: 0,
      affectedEntities: [],
      warnings: [],
      error: error.details ?? error.message ?? 'Delete failed',
    };
  }
}
