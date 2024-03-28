//Models
import type { Position } from '@fintekkers/ledger-models/node/wrappers/models/position/position';
import * as positionFilter from '@fintekkers/ledger-models/node/wrappers/models/position/positionfilter';
import { MeasureProto } from '@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb';
import { FieldProto } from '@fintekkers/ledger-models/node/fintekkers/models/position/field_pb';

//Requests & Services
import * as ps from '@fintekkers/ledger-models/node/wrappers/services/position-service/PositionService';
import { QueryPositionRequestProto } from '@fintekkers/ledger-models/node/fintekkers/requests/position/query_position_request_pb';

const positionService = new ps.PositionService();
const filter = new positionFilter.PositionFilter();
filter.addEqualsFilter(FieldProto.ASSET_CLASS, "Fixed Income");

let request = new QueryPositionRequestProto().setFieldsList([FieldProto.TRADE_DATE]).setMeasuresList([MeasureProto.DIRECTED_QUANTITY]);

const results: Position[] = await positionService.search(request);

results.forEach(element => {

    for (let field of element.getFields()) {
        console.log(element.getFieldValue(field.getField()));
    }

    for (let field of element.getMeasures()) {
        console.log(element.getMeasureValue(field.getMeasure()));
    }
});
