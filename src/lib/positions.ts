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

export async function FetchPosition(requestData: { fields: FieldProto[], measures: MeasureProto[] }, positionViewEnumValue: PositionViewProto, positionTypeEnumValue: PositionTypeProto): Promise<any> {
    const positionService = new PositionService();

    // Assuming there's no need for the positionFilter for now
    const request = new QueryPositionRequest(
        new PositionFilter(), positionTypeEnumValue, positionViewEnumValue,
        requestData.fields, requestData.measures, ZonedDateTime.now()
    );

    try {
        const results = await positionService.search(request);
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