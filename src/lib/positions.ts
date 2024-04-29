import * as ps from '@fintekkers/ledger-models/node/wrappers/services/position-service/PositionService';
import { QueryPositionRequestProto } from '@fintekkers/ledger-models/node/fintekkers/requests/position/query_position_request_pb';
import type { MeasureProto } from '@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb';
import type { FieldProto } from '@fintekkers/ledger-models/node/fintekkers/models/position/field_pb';
import { QueryPositionRequest } from '@fintekkers/ledger-models/node/wrappers/requests/position/QueryPositionRequest';
import { PositionFilter } from '@fintekkers/ledger-models/node/wrappers/models/position/positionfilter';
import { PositionTypeProto, PositionViewProto } from '@fintekkers/ledger-models/node/fintekkers/models/position/position_pb';
import { ZonedDateTime } from '@fintekkers/ledger-models/node/wrappers/models/utils/datetime';
import { string } from 'yup';
import Security from '@fintekkers/ledger-models/node/wrappers/models/security/security';
import { PriceProto } from '@fintekkers/ledger-models/node/fintekkers/models/price/price_pb';
import Portfolio from '@fintekkers/ledger-models/node/wrappers/models/portfolio/portfolio';
import { TenorProto } from '@fintekkers/ledger-models/node/fintekkers/models/security/tenor_pb';
import { Position } from '@fintekkers/ledger-models/node/wrappers/models/position/position';

function getDisplayValue(value: any): String {
    if (value instanceof String)
        return value;
    if (value instanceof Security) {
        value: Security;
        let securityID = value.getSecurityID()
        return securityID.getIdentifierType() + ":" + securityID.getIdentifierValue();
        // } if (value instanceof PriceProto) {
        //     let securityProto = value.getSecurity();
        //     let security = new Security(securityProto);
        //     let securityDescription = security.getSecurityID().getIdentifierValue();
        //     return securityDescription + ":" + value.getPrice()?.getArbitraryPrecisionValue();
    }
    if (value instanceof Portfolio) {
        return value.getPortfolioName();
    } if (value instanceof TenorProto) {
        return value.getTenorType() + ":" + value.getTermValue();
    }
    return value.toString();
}

export async function FetchPosition(requestData: { fields: FieldProto[], measures: MeasureProto[] }): Promise<any> {
    const positionService = new ps.PositionService();

    // Assuming there's no need for the positionFilter for now
    const request = new QueryPositionRequest(
        new PositionFilter(), PositionTypeProto.TRANSACTION, PositionViewProto.DEFAULT_VIEW,
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
            let value = element.getFieldValue(field.getField());
            processedElement[field.getField()] = getDisplayValue(value);
        }

        for (let measure of element.getMeasures()) {
            processedElement[measure.getMeasure()] = element.getMeasureValue(measure.getMeasure());
        }

        return processedElement;
    });
}

