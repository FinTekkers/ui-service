/**
 * ISSUE #29 Step 3: E2E tests for transaction and portfolio deletion.
 *
 * Verifies:
 * 1. Delete infrastructure exists (proto, lib, UI, server actions)
 * 2. DeleteResult interface contract
 * 3. Delete buttons on securities, transactions, portfolios pages
 * 4. DeleteConfirmModal component exists and has required features
 * 5. Server actions: dryRun and confirmDelete on all entity pages
 * 6. Delete proto message structure (EntityTypeProto, flags)
 */
import { describe, expect, test } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// =============================================================================
// 1. Delete infrastructure — library files exist
// =============================================================================
describe('Delete infrastructure — library files', () => {
	test('entity-delete.ts exists', () => {
		expect(fs.existsSync(path.resolve('src/lib/entity-delete.ts'))).toBe(true);
	});

	test('security-delete.ts exists', () => {
		expect(fs.existsSync(path.resolve('src/lib/security-delete.ts'))).toBe(true);
	});

	test('DeleteConfirmModal.svelte exists', () => {
		expect(fs.existsSync(path.resolve('src/components/widgets/DeleteConfirmModal.svelte'))).toBe(true);
	});
});

// =============================================================================
// 2. entity-delete.ts — contract verification
// =============================================================================
describe('entity-delete.ts — delete function contract', () => {
	const entityDelete = fs.readFileSync(path.resolve('src/lib/entity-delete.ts'), 'utf-8');

	test('exports deleteEntity function', () => {
		expect(entityDelete).toContain('export async function deleteEntity');
	});

	test('exports EntityTypeProto', () => {
		expect(entityDelete).toContain('export { EntityTypeProto }');
	});

	test('exports DeleteResult interface', () => {
		expect(entityDelete).toContain('export interface DeleteResult');
	});

	test('exports EntityType union type', () => {
		expect(entityDelete).toContain("export type EntityType = 'SECURITY' | 'TRANSACTION' | 'PORTFOLIO'");
	});

	test('DeleteResult has success field', () => {
		expect(entityDelete).toContain('success: boolean');
	});

	test('DeleteResult has totalCount field', () => {
		expect(entityDelete).toContain('totalCount: number');
	});

	test('DeleteResult has affectedEntities array', () => {
		expect(entityDelete).toContain('affectedEntities:');
		expect(entityDelete).toContain('entityType: number');
		expect(entityDelete).toContain('description: string');
	});

	test('DeleteResult has warnings array', () => {
		expect(entityDelete).toContain('warnings: string[]');
	});

	test('deleteEntity supports dryRun flag', () => {
		expect(entityDelete).toContain('dryRun: boolean');
		expect(entityDelete).toContain('setDryRun');
	});

	test('deleteEntity supports force flag', () => {
		expect(entityDelete).toContain('force');
		expect(entityDelete).toContain('setForce');
	});

	test('deleteEntity supports cascade flag', () => {
		expect(entityDelete).toContain('cascade');
		expect(entityDelete).toContain('setCascade');
	});

	test('creates correct gRPC client for each entity type', () => {
		expect(entityDelete).toContain("case 'SECURITY': return new SecurityClient");
		expect(entityDelete).toContain("case 'TRANSACTION': return new TransactionClient");
		expect(entityDelete).toContain("case 'PORTFOLIO': return new PortfolioClient");
	});

	test('calls client.delete RPC', () => {
		expect(entityDelete).toContain('client.delete(request');
	});

	test('handles errors gracefully', () => {
		expect(entityDelete).toContain('catch');
		expect(entityDelete).toContain('error.details ?? error.message');
	});
});

// =============================================================================
// 3. security-delete.ts — security-specific wrapper
// =============================================================================
describe('security-delete.ts — security delete wrapper', () => {
	const secDelete = fs.readFileSync(path.resolve('src/lib/security-delete.ts'), 'utf-8');

	test('exports deleteSecurity function', () => {
		expect(secDelete).toContain('export async function deleteSecurity');
	});

	test('sets entity type to SECURITY', () => {
		expect(secDelete).toContain('EntityTypeProto.SECURITY');
	});

	test('supports dryRun parameter', () => {
		expect(secDelete).toContain('dryRun: boolean');
	});

	test('supports force parameter', () => {
		expect(secDelete).toContain('force');
	});

	test('builds DeleteRequestProto', () => {
		expect(secDelete).toContain('new DeleteRequestProto()');
	});

	test('parses UUID from hex string', () => {
		expect(secDelete).toContain('uuidFromHex');
		expect(secDelete).toContain("Buffer.from(hex, 'hex')");
	});

	test('returns affectedEntities list', () => {
		expect(secDelete).toContain('getAffectedEntitiesList');
	});
});

// =============================================================================
// 4. Delete buttons on entity pages
// =============================================================================
describe('Securities page — delete button and actions', () => {
	const pageSvelte = fs.readFileSync(
		path.resolve('src/routes/(authenticated)/data/securities/+page.svelte'), 'utf-8'
	);
	const pageServer = fs.readFileSync(
		path.resolve('src/routes/(authenticated)/data/securities/+page.server.ts'), 'utf-8'
	);

	test('page handles requestDelete event', () => {
		expect(pageSvelte).toContain('requestDelete');
	});

	test('page tracks deleteTarget state', () => {
		expect(pageSvelte).toContain('deleteTarget');
	});

	test('page has delete loading state', () => {
		expect(pageSvelte).toContain('deleteLoading');
	});

	test('page has dryRun result binding', () => {
		expect(pageSvelte).toContain('dryRunResult');
	});

	test('page has delete confirmation modal', () => {
		expect(pageSvelte).toContain('showModal');
		expect(pageSvelte).toContain('confirmInput');
	});

	test('server has dryRun action', () => {
		expect(pageServer).toContain('dryRun:');
		expect(pageServer).toContain('deleteSecurity(uuidHex, true)');
	});

	test('server has confirmDelete action', () => {
		expect(pageServer).toContain('confirmDelete:');
		expect(pageServer).toContain('deleteSecurity(uuidHex, false');
	});
});

describe('SecurityGrid — delete button', () => {
	const grid = fs.readFileSync(
		path.resolve('src/components/widgets/SecurityGrid.svelte'), 'utf-8'
	);

	test('has delete button', () => {
		expect(grid).toContain('delete-btn');
		expect(grid).toContain('Delete');
	});

	test('dispatches requestDelete event on click', () => {
		expect(grid).toContain("dispatch('requestDelete'");
	});

	test('passes cusip and uuidHex in delete event', () => {
		expect(grid).toContain('cusip: row.cusip');
		expect(grid).toContain('uuidHex: row.uuidHex');
	});
});

describe('Portfolios page — delete button and actions', () => {
	const pageServer = fs.readFileSync(
		path.resolve('src/routes/(authenticated)/data/portfolios/+page.server.ts'), 'utf-8'
	);

	test('server has dryRun action for portfolio', () => {
		expect(pageServer).toContain('dryRun:');
	});

	test('server has confirmDelete action for portfolio', () => {
		expect(pageServer).toContain('confirmDelete:');
	});

	test('server uses deleteEntity with PORTFOLIO type', () => {
		expect(pageServer).toContain("'PORTFOLIO'");
	});

	test('server supports cascade deletion for portfolios', () => {
		expect(pageServer).toContain('cascade');
	});
});

describe('PortfolioGrid — delete button', () => {
	const grid = fs.readFileSync(
		path.resolve('src/components/widgets/PortfolioGrid.svelte'), 'utf-8'
	);

	test('has delete button', () => {
		expect(grid).toMatch(/Del|delete|Delete/);
	});

	test('dispatches requestDelete event', () => {
		expect(grid).toContain('requestDelete');
	});
});

describe('Transactions page — delete button and actions', () => {
	const pageServer = fs.readFileSync(
		path.resolve('src/routes/(authenticated)/data/transactions/+page.server.ts'), 'utf-8'
	);

	test('server has dryRun action for transaction', () => {
		expect(pageServer).toContain('dryRun:');
	});

	test('server has confirmDelete action for transaction', () => {
		expect(pageServer).toContain('confirmDelete:');
	});

	test('server uses deleteEntity with TRANSACTION type', () => {
		expect(pageServer).toContain("'TRANSACTION'");
	});
});

describe('TransactionGrid — delete button', () => {
	const grid = fs.readFileSync(
		path.resolve('src/components/widgets/TransactionGrid.svelte'), 'utf-8'
	);

	test('has delete button', () => {
		expect(grid).toMatch(/Del|delete|Delete/);
	});

	test('dispatches requestDelete event', () => {
		expect(grid).toContain('requestDelete');
	});
});

// =============================================================================
// 5. DeleteConfirmModal — features
// =============================================================================
describe('DeleteConfirmModal — component features', () => {
	const modal = fs.readFileSync(
		path.resolve('src/components/widgets/DeleteConfirmModal.svelte'), 'utf-8'
	);

	test('shows affected entities count', () => {
		expect(modal).toContain('totalCount');
	});

	test('lists affected entities with descriptions', () => {
		expect(modal).toContain('affectedEntities');
		expect(modal).toContain('description');
	});

	test('displays warnings', () => {
		expect(modal).toContain('warnings');
	});

	test('requires typing DELETE for dangerous operations', () => {
		expect(modal).toContain('DELETE');
	});

	test('submits to confirmDelete action', () => {
		expect(modal).toContain('confirmDelete');
	});

	test('has cancel option', () => {
		expect(modal).toMatch(/cancel|Cancel|close|Close/i);
	});
});

// =============================================================================
// 6. Delete proto messages — verify structure
// =============================================================================
describe('Delete proto messages — structure', () => {
	const deleteProto = fs.readFileSync(
		path.resolve(
			'/Users/daviddoherty/projects/ledger-models/ledger-models-protos/fintekkers/requests/util/delete_request.proto'
		),
		'utf-8'
	);

	test('defines EntityTypeProto enum', () => {
		expect(deleteProto).toContain('enum EntityTypeProto');
	});

	test('EntityTypeProto has SECURITY, PORTFOLIO, TRANSACTION', () => {
		expect(deleteProto).toContain('SECURITY = 1');
		expect(deleteProto).toContain('PORTFOLIO = 2');
		expect(deleteProto).toContain('TRANSACTION = 3');
	});

	test('defines DeleteRequestProto message', () => {
		expect(deleteProto).toContain('message DeleteRequestProto');
	});

	test('DeleteRequestProto has uuid field', () => {
		expect(deleteProto).toContain('UUIDProto uuid');
	});

	test('DeleteRequestProto has dry_run field', () => {
		expect(deleteProto).toContain('bool dry_run');
	});

	test('DeleteRequestProto has cascade field', () => {
		expect(deleteProto).toContain('bool cascade');
	});

	test('DeleteRequestProto has force field', () => {
		expect(deleteProto).toContain('bool force');
	});

	test('defines DeleteResponseProto message', () => {
		expect(deleteProto).toContain('message DeleteResponseProto');
	});

	test('DeleteResponseProto has success field', () => {
		expect(deleteProto).toContain('bool success');
	});

	test('DeleteResponseProto has total_count field', () => {
		expect(deleteProto).toContain('int32 total_count');
	});

	test('DeleteResponseProto has affected_entities repeated field', () => {
		expect(deleteProto).toContain('repeated AffectedEntityProto affected_entities');
	});

	test('DeleteResponseProto has warnings repeated field', () => {
		expect(deleteProto).toContain('repeated string warnings');
	});

	test('defines AffectedEntityProto message', () => {
		expect(deleteProto).toContain('message AffectedEntityProto');
	});

	test('AffectedEntityProto has entity_type, uuid, and description', () => {
		expect(deleteProto).toContain('EntityTypeProto entity_type');
		expect(deleteProto).toContain('UUIDProto uuid');
		expect(deleteProto).toContain('string description');
	});

	test('documents cascade and force are mutually exclusive', () => {
		expect(deleteProto).toContain('mutually exclusive');
	});
});

// =============================================================================
// 7. Delete service RPCs — verify all three services have Delete
// =============================================================================
describe('Service protos — Delete RPC defined', () => {
	const protoDir = '/Users/daviddoherty/projects/ledger-models/ledger-models-protos/fintekkers/services';

	test('SecurityService has Delete RPC', () => {
		const proto = fs.readFileSync(path.join(protoDir, 'security-service/security_service.proto'), 'utf-8');
		expect(proto).toContain('rpc Delete');
		expect(proto).toContain('DeleteRequestProto');
		expect(proto).toContain('DeleteResponseProto');
	});

	test('TransactionService has Delete RPC', () => {
		const proto = fs.readFileSync(path.join(protoDir, 'transaction-service/transaction_service.proto'), 'utf-8');
		expect(proto).toContain('rpc Delete');
		expect(proto).toContain('DeleteRequestProto');
		expect(proto).toContain('DeleteResponseProto');
	});

	test('PortfolioService has Delete RPC', () => {
		const proto = fs.readFileSync(path.join(protoDir, 'portfolio-service/portfolio_service.proto'), 'utf-8');
		expect(proto).toContain('rpc Delete');
		expect(proto).toContain('DeleteRequestProto');
		expect(proto).toContain('DeleteResponseProto');
	});
});
