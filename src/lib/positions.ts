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
import type { FieldProto } from '@fintekkers/ledger-models/node/fintekkers/models/position/field_pb';
import type { PositionTypeProto, PositionViewProto } from '@fintekkers/ledger-models/node/fintekkers/models/position/position_pb';

export async function FetchPosition(requestData: { fields: FieldProto[], measures: MeasureProto[] }, positionViewEnumValue: PositionViewProto, positionTypeEnumValue: PositionTypeProto, sortBy?: FieldProto, sortDirection: 'asc' | 'desc' = 'asc'): Promise<any> {
    const positionService = new PositionService();

    // Assuming there's no need for the positionFilter for now
    const request = new QueryPositionRequest(
        new PositionFilter(), positionTypeEnumValue, positionViewEnumValue,
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