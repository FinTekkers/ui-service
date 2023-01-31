package client.portfolio;

import common.models.postion.Field;
import common.models.postion.Measure;
import common.models.postion.Position;
import common.models.postion.PositionFilter;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import testutil.DummyEquityObjects;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.HashSet;

class PositionRequestSerializerTest {
//    @Test
//    public void testRequestSerialization() {
//        QueryPositionRequest request = getRequest();
//
//        PositionRequestSerializer serializer = PositionRequestSerializer.getInstance();
//        PositionRequestProto proto = serializer.serialize(request);
//        PositionRequest requestCopy = serializer.deserialize(proto);
//
//        Assertions.assertEquals(request.getContext().getPositionType(), requestCopy.getContext().getPositionType());
//        Assertions.assertEquals(request.getContext().getPositionView(), requestCopy.getContext().getPositionView());
//        Assertions.assertEquals(request.getFields(), requestCopy.getFields());
//        Assertions.assertEquals(request.getMeasures(), requestCopy.getMeasures());
//
//        HashMap<Field, PositionFilter.PositionComparator> filtersCopy = requestCopy.getFilter().getFilters();
//        request.getFilter().getFilters().forEach((key, value) -> {
//            Assertions.assertTrue(filtersCopy.containsKey(key));
//            PositionFilter.PositionComparator valueCopy = filtersCopy.get(key);
//            Assertions.assertEquals(value.getOperator(), valueCopy.getOperator());
//            Assertions.assertEquals(value.getValue(), valueCopy.getValue());
//        });
//    }
//
//
//    private PositionRequest getRequest() {
//        PositionRequest request = new PositionRequest();
//        request.setContext(new PositionContext(Position.PositionView.DEFAULT_VIEW, Position.PositionType.TRANSACTION));
//        request.addMeasure(Measure.DIRECTED_QUANTITY);
//        request.setOperation(PositionRequest.Operation.GET);
//        request.setFields(new HashSet<>() {{ add(Field.ID); }});
//
//        request.setAsOf(ZonedDateTime.of(2100,1,1,23,59,59, 999, ZoneId.systemDefault()));
//
//        PositionFilter filter = new PositionFilter();
//        filter.addFilter(Field.SECURITY_ID, DummyEquityObjects.getDummySecurity().getID());
//        filter.addFilter(Field.PORTFOLIO_NAME, "Not used");
//        filter.addFilter(Field.TRADE_DATE, PositionFilter.Operator.LESS_THAN_OR_EQUALS, LocalDate.now());
//        request.setFilter(filter);
//        return request;
//    }

    /*

Should serialize to something like this:

{
  "PositionFilter": [
    {
      "FieldName": "SECURITY_ID",
      "FieldDisplayValue": "1d9b1d40-76b8-40eb-ba21-8f7d1958de51",
      "FieldType": "UUID",
      "FieldDisplayName": "Security Id"
    }
  ],
  "Fields": [
    "ID"
  ],
  "Measures": [
    "DIRECTED_QUANTITY"
  ],
  JSONFieldNames.CONTEXT: {
    "PositionType": "TRANSACTION",
    "PositionView": "DEFAULT_VIEW",
    JSONFieldNames.OPERATION: "GET"
  }
}

     */
//    @Test
//    public void testJsonSerialization() {
//        PositionRequestSerializer serializer = PositionRequestSerializer.getInstance();
//
//        PositionRequest positionRequest = getRequest();
//        PositionRequestProto requestProto = serializer.serialize(positionRequest);
//        String json = serializer.serializeToJson(requestProto);
//
//        PositionRequestProto positionRequestProtoCopy = serializer.deserializeFromJson(json);
//        PositionRequest positionRequestCopy = serializer.deserialize(positionRequestProtoCopy);
//
//        Assertions.assertEquals(positionRequest.getMeasures(), positionRequestCopy.getMeasures());
//        Assertions.assertEquals(positionRequest.getFields(), positionRequestCopy.getFields());
//
//        checkContextsAreEqual(positionRequest, positionRequestCopy);
//        checkFiltersAreEqual(positionRequest, positionRequestCopy);
//    }
//
//    private void checkContextsAreEqual(PositionRequest positionRequest, PositionRequest positionRequestCopy) {
//        Assertions.assertEquals(positionRequest.getOperation(), positionRequestCopy.getOperation());
//        Assertions.assertEquals(positionRequest.getContext().getPositionView(),
//                positionRequestCopy.getContext().getPositionView());
//        Assertions.assertEquals(positionRequest.getContext().getPositionType(),
//                positionRequestCopy.getContext().getPositionType());
//    }
//
//    private void checkFiltersAreEqual(PositionRequest positionRequest, PositionRequest positionRequestCopy) {
//        PositionFilter filter = positionRequest.getFilter();
//        PositionFilter filterCopy = positionRequestCopy.getFilter();
//
//        Assertions.assertEquals(filter.getFilters().size(), filterCopy.getFilters().size());
//
//        HashMap<Field, PositionFilter.PositionComparator> filters = filter.getFilters();
//        HashMap<Field, PositionFilter.PositionComparator> filtersCopy = filterCopy.getFilters();
//
//        filters.keySet().forEach(key -> {
//            Assertions.assertTrue(filtersCopy.containsKey(key));
//            PositionFilter.PositionComparator value = filtersCopy.get(key);
//            Assertions.assertEquals(filters.get(key).getOperator(), value.getOperator());
//            Assertions.assertEquals(filters.get(key).getValue(), value.getValue());
//        });
//    }
}