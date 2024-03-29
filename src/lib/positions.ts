import * as ps from '@fintekkers/ledger-models/node/wrappers/services/position-service/PositionService';
import type { Position } from '@fintekkers/ledger-models/node/wrappers/models/position/position';
import * as positionFilter from '@fintekkers/ledger-models/node/wrappers/models/position/positionfilter';
import { FieldProto } from '@fintekkers/ledger-models/node/fintekkers/models/position/field_pb';
import { QueryPositionRequestProto } from '@fintekkers/ledger-models/node/fintekkers/requests/position/query_position_request_pb';
import { MeasureProto } from '@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb';

interface FieldValue {
    [key: string]: any;
}

interface MeasureValue {
    [key: string]: any;
}

interface PositionData {
    fields: FieldValue;
    measures: MeasureValue;
}

export async function FetchPosition(selectedFields: string[], selectedMeasures: string[]): Promise<PositionData[]> {
    const positionService = new ps.PositionService();
    const filter = new positionFilter.PositionFilter();
    filter.addEqualsFilter(FieldProto.ASSET_CLASS, "Fixed Income");

    const request = new QueryPositionRequestProto()
        .setFieldsList(selectedFields.map(field => FieldProto[field as keyof typeof FieldProto]))
        .setMeasuresList(selectedMeasures.map(measure => MeasureProto[measure as keyof typeof MeasureProto]));

    try {
        const results: Position[] = await positionService.search(request);

        const positionsData: PositionData[] = results.map(element => {
            const fields: FieldValue = {};
            const measures: MeasureValue = {};

            for (let field of element.getFields()) {
                fields[field.getField()] = element.getFieldValue(field.getField());
            }

            for (let field of element.getMeasures()) {
                measures[field.getMeasure()] = element.getMeasureValue(field.getMeasure());
            }

            return { fields, measures };
        });

        return positionsData;
    } catch (error) {
        console.error('Error fetching position data:', error);
        throw error;
    }
}
