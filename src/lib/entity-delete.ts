import delete_pkg from '@fintekkers/ledger-models/node/fintekkers/requests/util/delete_request_pb.js';
import { SecurityClient } from '@fintekkers/ledger-models/node/fintekkers/services/security-service/security_service_grpc_pb.js';
import { TransactionClient } from '@fintekkers/ledger-models/node/fintekkers/services/transaction-service/transaction_service_grpc_pb.js';
import { PortfolioClient } from '@fintekkers/ledger-models/node/fintekkers/services/portfolio-service/portfolio_service_grpc_pb.js';
import { UUIDProto } from '@fintekkers/ledger-models/node/fintekkers/models/util/uuid_pb.js';
import EnvConfig from '@fintekkers/ledger-models/node/wrappers/models/utils/requestcontext';

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

function getClient(entityType: EntityType): any {
  const url = EnvConfig.apiURL;
  const creds = EnvConfig.apiCredentials;
  switch (entityType) {
    case 'SECURITY': return new SecurityClient(url, creds);
    case 'TRANSACTION': return new TransactionClient(url, creds);
    case 'PORTFOLIO': return new PortfolioClient(url, creds);
  }
}

export async function deleteEntity(
  entityType: EntityType,
  uuidHex: string,
  dryRun: boolean,
  force = false,
  cascade = false,
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

    const client = getClient(entityType);

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
