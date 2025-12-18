//Models
import { PositionFilter } from '@fintekkers/ledger-models/node/wrappers/models/position/positionfilter';
import { ZonedDateTime } from '@fintekkers/ledger-models/node/wrappers/models/utils/datetime';

//Services
import { PositionService } from '@fintekkers/ledger-models/node/wrappers/services/position-service/PositionService';

//Requests
import { QueryPositionRequest } from '@fintekkers/ledger-models/node/wrappers/requests/position/QueryPositionRequest';

//Types
import type { Position } from '@fintekkers/ledger-models/node/wrappers/models/position/position';
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
import { PositionFilterOperator } from '@fintekkers/ledger-models/node/fintekkers/models/position/position_util_pb.js';

export async function FetchPosition(
    requestData: { fields: FieldProtoType[], measures: MeasureProto[] },
    positionViewEnumValue: PositionViewProto,
    positionTypeEnumValue: PositionTypeProto,
    sortBy?: FieldProtoType,
    sortDirection: 'asc' | 'desc' = 'asc',
    cusip?: string,
    tradeDate?: string,
    tradeDateOperator?: 'greater_than' | 'lesser_than',
    assetClass?: string
): Promise<any> {
    const positionService = new PositionService();

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

    // Add ASSET_CLASS filter if provided
    if (assetClass && assetClass.trim() !== "") {
        positionFilter.addEqualsFilter(FieldProto.ASSET_CLASS, assetClass.trim());
    }

    const request = new QueryPositionRequest(
        positionFilter, positionTypeEnumValue, positionViewEnumValue,
        requestData.fields, requestData.measures, ZonedDateTime.now()
    );

    try {
        const results: Position[] = await positionService.search(request);

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
        const summary = await positionService.validateRequest(request);
        summary.getErrorsList().forEach((error) => {
            console.error(error.getDetail()?.getMessageForDeveloper());
        });

        console.error("Error fetching positions:", error);
        throw error;
    }
}

function elementsToReturn(results: Position[]) {
    return results.map(element => {
        const processedElement: any = {};

        for (let field of element.getFields()) {
            processedElement[field.getField()] = element.getFieldDisplay(field);
        }

        for (let measure of element.getMeasures()) {
            processedElement[measure.getMeasure()] = element.getMeasureValue(measure.getMeasure());
        }

        return processedElement;
    });
}