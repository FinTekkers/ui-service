import delete_pkg from '@fintekkers/ledger-models/node/fintekkers/requests/util/delete_request_pb.js';
import { SecurityClient } from '@fintekkers/ledger-models/node/fintekkers/services/security-service/security_service_grpc_pb.js';
import { TransactionClient } from '@fintekkers/ledger-models/node/fintekkers/services/transaction-service/transaction_service_grpc_pb.js';
import { PortfolioClient } from '@fintekkers/ledger-models/node/fintekkers/services/portfolio-service/portfolio_service_grpc_pb.js';
import { UUIDProto } from '@fintekkers/ledger-models/node/fintekkers/models/util/uuid_pb.js';
import { getServiceConnection } from '$lib/grpc-auth';

const { DeleteRequestProto, EntityTypeProto } = delete_pkg;

export { EntityTypeProto };

export interface DeleteResult {
  success: boolean;
  totalCount: number;
  affectedEntities: Array<{ entityType: number; description: string }>;
  warnings: string[];
  error?: string;
}

export type EntityType = 'SECURITY' | 'TRANSACTION' | 'PORTFOLIO';

const entityTypeMap: Record<EntityType, number> = {
  SECURITY: EntityTypeProto.SECURITY,
  TRANSACTION: EntityTypeProto.TRANSACTION,
  PORTFOLIO: EntityTypeProto.PORTFOLIO,
};

function getClient(entityType: EntityType, apiKey?: string): any {
  const conn = getServiceConnection(apiKey);
  switch (entityType) {
    case 'SECURITY': return new SecurityClient(conn.url, conn.credentials, { interceptors: conn.interceptors });
    case 'TRANSACTION': return new TransactionClient(conn.url, conn.credentials, { interceptors: conn.interceptors });
    case 'PORTFOLIO': return new PortfolioClient(conn.url, conn.credentials, { interceptors: conn.interceptors });
  }
}

export async function deleteEntity(
  entityType: EntityType,
  uuidHex: string,
  dryRun: boolean,
  force = false,
  cascade = false,
  apiKey?: string,
): Promise<DeleteResult> {
  try {
    const request = new DeleteRequestProto();
    request.setObjectClass('DeleteRequestProto');
    request.setVersion('0.0.1');
    request.setUuid(UUIDProto.deserializeBinary(new Uint8Array(Buffer.from(uuidHex, 'hex'))));
    request.setEntityType(entityTypeMap[entityType]);
    request.setDryRun(dryRun);
    if (force) request.setForce(true);
    if (cascade) request.setCascade(true);

    const client = getClient(entityType, apiKey);

    const response = await new Promise<any>((resolve, reject) => {
      client.delete(request, (error: any, resp: any) => {
        if (error) reject(error);
        else resolve(resp);
      });
    });

    return {
      success: response.getSuccess(),
      totalCount: response.getTotalCount(),
      affectedEntities: (response.getAffectedEntitiesList?.() ?? []).map((e: any) => ({
        entityType: e.getEntityType(),
        description: e.getDescription(),
      })),
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
