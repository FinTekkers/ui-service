import * as ps from '@fintekkers/ledger-models/node/wrappers/services/position-service/PositionService';
import type { Position } from '@fintekkers/ledger-models/node/wrappers/models/position/hardcoded.position';
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

export async function FetchPosition(): Promise<PositionData[]> {
    const positionService = new ps.PositionService();
    const filter = new positionFilter.PositionFilter();
    filter.addEqualsFilter(FieldProto.ASSET_CLASS, "Fixed Income");

    const request = new QueryPositionRequestProto()
        .setFieldsList([FieldProto.TRADE_DATE])
        .setMeasuresList([MeasureProto.DIRECTED_QUANTITY]);

    try {
        const results: Position[] = await positionService.search(request);

        const positionsData: PositionData[] = results.map(element => {
            const fields: FieldValue = {};
            const measures: MeasureValue = {};

            for (let field of element.getFields()) {
                fields[field] = element.getFieldValue(field);
            }

            for (let field of element.getMeasures()) {
                measures[field] = element.getMeasureValue(field);
            }

            return { fields, measures };
        });

        console.log(positionsData);

        return positionsData;
    } catch (error) {
        console.error('Error fetching position data:', error);
        throw error; // Re-throw the error so that the caller can handle it
    }
}
