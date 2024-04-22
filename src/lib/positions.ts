import * as ps from '@fintekkers/ledger-models/node/wrappers/services/position-service/PositionService';
import { QueryPositionRequestProto } from '@fintekkers/ledger-models/node/fintekkers/requests/position/query_position_request_pb';
import type { MeasureProto } from '@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb';
import type { FieldProto } from '@fintekkers/ledger-models/node/fintekkers/models/position/field_pb';

export async function FetchPosition(requestData: { fields: FieldProto[], measures: MeasureProto[] }): Promise<any> {
    const positionService = new ps.PositionService();
    
    // Assuming there's no need for the positionFilter for now
    const request = new QueryPositionRequestProto()
        .setFieldsList(requestData.fields)
        .setMeasuresList(requestData.measures);

    try {
        const results = await positionService.search(request);
        const processedResults = results.map(element => {
            const processedElement: any = {};

            for (let field of element.getFields()) {
                processedElement[field.getField()] = element.getFieldValue(field.getField());
            }

            for (let measure of element.getMeasures()) {
                processedElement[measure.getMeasure()] = element.getMeasureValue(measure.getMeasure());
            }

            return processedElement;
        });

        return processedResults;
    } catch (error) {
        console.error("Error fetching positions:", error);
        throw error;
    }
}
