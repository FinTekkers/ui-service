//Models
import { PositionFilter } from '@fintekkers/ledger-models/node/wrappers/models/position/positionfilter';
import { ZonedDateTime } from '@fintekkers/ledger-models/node/wrappers/models/utils/datetime';
import { Position } from '@fintekkers/ledger-models/node/wrappers/models/position/position';

//Services
import { PositionClient } from '@fintekkers/ledger-models/node/fintekkers/services/position-service/position_service_grpc_pb.js';

//Requests
import { QueryPositionRequest } from '@fintekkers/ledger-models/node/wrappers/requests/position/QueryPositionRequest';
import type { QueryPositionResponseProto } from '@fintekkers/ledger-models/node/fintekkers/requests/position/query_position_response_pb';

//Auth
import { getServiceConnection } from '$lib/grpc-auth';
import type { MeasureProto } from '@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb';
import type { PositionTypeProto, PositionViewProto } from '@fintekkers/ledger-models/node/fintekkers/models/position/position_pb';

// Import FieldProto as both type and value
import pkg from '@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js';
const { FieldProto } = pkg;
import type { FieldProto as FieldProtoType } from '@fintekkers/ledger-models/node/fintekkers/models/position/field_pb';
import { IdentifierProto } from '@fintekkers/ledger-models/node/fintekkers/models/security/identifier/identifier_pb';
import { IdentifierTypeProto } from '@fintekkers/ledger-models/node/fintekkers/models/security/identifier/identifier_type_pb';
import { pack } from '@fintekkers/ledger-models/node/wrappers/models/utils/serialization.util';
import { Identifier } from '@fintekkers/ledger-models/node/wrappers/models/security/identifier';
import { UUID } from '@fintekkers/ledger-models/node/wrappers/models/utils/uuid';
import { PositionFilterOperator } from '@fintekkers/ledger-models/node/fintekkers/models/position/position_util_pb.js';

function searchPositions(request: ReturnType<QueryPositionRequest['toProto']>, apiKey?: string): Promise<Position[]> {
    const conn = getServiceConnection(apiKey);
    const client = new PositionClient(conn.url, conn.credentials, { interceptors: conn.interceptors });
    const listPositions: Position[] = [];
    const stream = client.search(request);
    return new Promise<Position[]>((resolve, reject) => {
        stream.on('data', (response: QueryPositionResponseProto) => {
            response.getPositionsList().forEach(p => listPositions.push(new Position(p)));
        });
        stream.on('end', () => resolve(listPositions));
        stream.on('error', (err) => reject(err));
    });
}

export async function FetchPosition(
    requestData: { fields: FieldProtoType[], measures: MeasureProto[] },
    positionViewEnumValue: PositionViewProto,
    positionTypeEnumValue: PositionTypeProto,
    sortBy?: FieldProtoType,
    sortDirection: 'asc' | 'desc' = 'asc',
    cusip?: string,
    tradeDate?: string,
    tradeDateOperator?: 'greater_than' | 'lesser_than',
    assetClass?: string,
    portfolioId?: string,
    apiKey?: string
): Promise<any> {
    // Create position filter and add CUSIP filter if provided
    const positionFilter = new PositionFilter();
    if (cusip && cusip.trim() !== "") {
        //TODO: add constructor for this
        let identifierProto = new IdentifierProto().setIdentifierType(IdentifierTypeProto.CUSIP).setIdentifierValue(cusip.trim());
        let identifier = new Identifier(identifierProto);
        positionFilter.addObjectFilter(FieldProto.IDENTIFIER, identifier);
    }

    // Add TRADE_DATE filter if provided
    if (tradeDate && tradeDate.trim() !== "" && tradeDateOperator) {
        const tradeDateObj = new Date(tradeDate);
        const operator = tradeDateOperator === 'greater_than'
            ? PositionFilterOperator.MORE_THAN
            : PositionFilterOperator.LESS_THAN;
        positionFilter.addFilter(FieldProto.TRADE_DATE, operator, tradeDateObj);
    }

    // Add ASSET_CLASS filter if provided.
    // Must use addFilter with fieldValue (not fieldValueString) so pack() wraps the
    // string in google.protobuf.StringValue and the entry is serialised as field_value_packed.
    if (assetClass && assetClass.trim() !== "") {
        positionFilter.addFilter(FieldProto.ASSET_CLASS, PositionFilterOperator.EQUALS, assetClass.trim());
    }

    // Add PORTFOLIO_ID filter if provided.
    // The ledger-service expects field_value_packed with UUIDProto, so we convert the
    // UUID string to a UUID wrapper object; pack() serialises it as UUIDProto in an Any.
    if (portfolioId && portfolioId.trim() !== "") {
        const portfolioUuid = new UUID(UUID.fromString(portfolioId.trim()));
        positionFilter.addFilter(FieldProto.PORTFOLIO_ID, PositionFilterOperator.EQUALS, portfolioUuid);
    }

    const request = new QueryPositionRequest(
        positionFilter, positionTypeEnumValue, positionViewEnumValue,
        requestData.fields, requestData.measures, ZonedDateTime.now()
    );

    try {
        const results: Position[] = await searchPositions(request.toProto(), apiKey);

        // Sort results if sortBy field is provided
        if (sortBy) {
            results.sort((a, b) => {
                try {
                    const valueA = a.getFieldValue(sortBy);
                    const valueB = b.getFieldValue(sortBy);

                    // Handle null/undefined values
                    if (valueA == null && valueB == null) return 0;
                    if (valueA == null) return 1;
                    if (valueB == null) return -1;

                    let comparison = 0;

                    // If values are dates or LocalDate objects, compare them
                    if (valueA instanceof Date && valueB instanceof Date) {
                        comparison = valueA.getTime() - valueB.getTime();
                    }
                    // If values have toEpochSecond method (LocalDate/ZonedDateTime)
                    else if (typeof valueA.toEpochSecond === 'function' && typeof valueB.toEpochSecond === 'function') {
                        comparison = valueA.toEpochSecond() - valueB.toEpochSecond();
                    }
                    // Try numeric comparison
                    else {
                        const numA = Number(valueA);
                        const numB = Number(valueB);
                        if (!isNaN(numA) && !isNaN(numB)) {
                            comparison = numA - numB;
                        } else {
                            // Fall back to string comparison
                            comparison = String(valueA).localeCompare(String(valueB));
                        }
                    }

                    // Reverse comparison if descending
                    return sortDirection === 'desc' ? -comparison : comparison;
                } catch (error) {
                    // If getFieldValue fails, don't sort
                    console.warn('Error getting field value for sorting:', error);
                    return 0;
                }
            });
        }

        const processedResults = elementsToReturn(results);
        return processedResults;
    } catch (error) {
        try {
            const validateConn = getServiceConnection(apiKey);
            const validateClient = new PositionClient(validateConn.url, validateConn.credentials, { interceptors: validateConn.interceptors });
            const summary = await new Promise<any>((resolve, reject) => {
                validateClient.validateQueryRequest(request.toProto(), (err: any, res: any) => {
                    if (err) reject(err); else resolve(res);
                });
            });
            summary.getErrorsList().forEach((e: any) => {
                console.error(e.getDetail()?.getMessageForDeveloper());
            });
        } catch (_) { /* ignore validation errors */ }

        console.error("Error fetching positions:", error);
        throw error;
    }
}

function elementsToReturn(results: Position[]) {
    return results.map(element => {
        const processedElement: any = {};

        for (let field of element.getFields()) {
            let displayValue: any;
            try {
                displayValue = element.getFieldDisplay(field);
            } catch (error) {
                // getFieldDisplay can throw when optional fields (e.g. STRATEGY) are
                // null/unset on the position. Return null so the render layer can show
                // a graceful fallback (e.g. 'Unassigned') rather than crashing.
                console.warn(`Error getting field display for field ${field.getField()}:`, error);
                displayValue = null;
            }
            processedElement[field.getField()] = displayValue;
        }

        for (let measure of element.getMeasures()) {
            processedElement[measure.getMeasure()] = element.getMeasureValue(measure.getMeasure());
        }

        return processedElement;
    });
}