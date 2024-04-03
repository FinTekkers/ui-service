//Models
import type { Position } from '@fintekkers/ledger-models/node/wrappers/models/position/position';
import * as positionFilter from '@fintekkers/ledger-models/node/wrappers/models/position/positionfilter';
import { MeasureProto } from '@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb';
import { FieldProto } from '@fintekkers/ledger-models/node/fintekkers/models/position/field_pb';

//Requests & Services
import * as ps from '@fintekkers/ledger-models/node/wrappers/services/position-service/PositionService';
import { QueryPositionRequestProto } from '@fintekkers/ledger-models/node/fintekkers/requests/position/query_position_request_pb';


export async function FetchPosition(requestData: any): Promise<any> {
    const positionService = new ps.PositionService();
    const filter = new positionFilter.PositionFilter();
    filter.addEqualsFilter(FieldProto.ASSET_CLASS, "Fixed Income");
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
