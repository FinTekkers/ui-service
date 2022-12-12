package client.position;

import com.google.gson.*;
import com.google.protobuf.Any;
import common.model.protos.FieldProto;
import common.models.JSONFieldNames;
import common.models.position.*;
import common.models.postion.Field;
import common.models.postion.Measure;
import common.models.postion.Position;
import common.models.postion.PositionFilter;
import common.models.protoUtils.LocalTimestamp;
import common.models.security.identifier.IdentifierProto;
import common.models.security.identifier.IdentifierTypeProto;
import common.request.PositionRequestProto;
import protos.serializers.util.json.JsonSerializationUtil;
import protos.serializers.util.proto.ProtoSerializationUtil;
import util.Operation;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.TemporalAccessor;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static common.models.JSONFieldNames.*;
import static common.models.position.FieldMapEntry.FieldMapValueOneOfCase.ENUM_VALUE;
import static protos.serializers.position.PositionSerializer.*;

/**
 * Serializes and deserializes position requests
 */
public class PositionRequestSerializer {
    private static final class InstanceHolder {
        private static final PositionRequestSerializer INSTANCE = new PositionRequestSerializer();
    }

    public static PositionRequestSerializer getInstance() {
        return InstanceHolder.INSTANCE;
    }

    private PositionRequestSerializer() {
    }

    public PositionRequestProto serialize(PositionRequest request) {
        PositionRequestProto.Builder builder = PositionRequestProto.newBuilder()
                .setObjectClass(PositionRequest.class.getSimpleName())
                .setVersion("0.0.1")
                .setPositionType(PositionTypeProto.valueOf(request.getContext().getPositionType().name()))
                .setPositionView(PositionViewProto.valueOf(request.getContext().getPositionView().name()))
                .setOperationType(Operation.RequestOperationTypeProto.valueOf(request.getOperation().name()));

        request.getFields().forEach(field -> builder.addFields(FieldProto.valueOf(field.name())));

        serializeFilterFields(request, builder);

        request.getMeasures().forEach(measure -> builder.addMeasures(MeasureProto.valueOf(measure.name())));

        builder.setAsOf(ProtoSerializationUtil.serializeTimestamp(request.getAsOf()));

        return builder.build();

    }

    private void serializeFilterFields( PositionRequest request, PositionRequestProto.Builder builder) {
        PositionFilterProto.Builder filterBuilder = PositionFilterProto.newBuilder();
        request.getFilter().getFilters().forEach((field, comparator) -> {
            FieldMapEntry.Builder fieldBuilder =
                    FieldMapEntry.newBuilder().setField(FieldProto.valueOf(field.name()));

            if(field.getType().isEnum()) {
                //If enum then we serialize as a string
                fieldBuilder.setEnumValue(comparator.getValue().toString());
            }else {
                Any valuePacked = ProtoSerializationUtil.serializeToAny(comparator.getValue());
                fieldBuilder.setFieldValuePacked(valuePacked);
            }

            fieldBuilder.setOperator(PositionFilterOperator.valueOf(comparator.getOperator().name()));

            filterBuilder.addFilters(fieldBuilder.build());
        });

        builder.setFilterFields(filterBuilder.build());
    }

    public PositionRequest deserialize(PositionRequestProto proto) {
        PositionContext context = new PositionContext(
                Position.PositionView.valueOf(proto.getPositionView().name()),
                Position.PositionType.valueOf(proto.getPositionType().name())
        );

        PositionRequest request = new PositionRequest();
        request.setContext(context);
        request.setOperation(PositionRequest.Operation.valueOf(proto.getOperationType().name()));

        Set<Field> fields = new HashSet<>();
        proto.getFieldsList().forEach(fieldProto -> {
            Field field = Field.valueOf(convertFromDisplayName(fieldProto.name()));
            fields.add(field);
        });
        request.setFields(fields);

        proto.getMeasuresList().forEach(measureProto -> {
            Measure field = Measure.valueOf(convertFromDisplayName(measureProto.name()));
            request.addMeasure(field);
        });

        ZonedDateTime asOf = proto.hasAsOf() ? ProtoSerializationUtil.deserializeTimestamp(proto.getAsOf()) : ZonedDateTime.now();

        PositionFilter filter = new PositionFilter(asOf);
        addFilterFields(proto.getFilterFields(), filter);
        request.setFilter(filter);

        return request;
    }

    
    public static PositionFilter addFilterFields(PositionFilterProto filters, PositionFilter filter) {
        filters.getFiltersList().forEach(fieldProto -> {
            Field field = Field.valueOf(convertFromDisplayName(fieldProto.getField().name()));
            Object fieldValue;

            if(ENUM_VALUE.equals(fieldProto.getFieldMapValueOneOfCase())) {
                fieldValue = Enum.valueOf(field.getType(), fieldProto.getEnumValue());
            } /*else if (Field.IDENTIFIER.equals(field)) {
                fieldValue = IdentifierSerializer.getInstance().deserialize(fieldProto.getIdentifier());
            } */else {
                fieldValue = ProtoSerializationUtil.deserialize(fieldProto.getFieldValuePacked());
            }

            PositionFilter.Operator operator = PositionFilter.Operator.valueOf(fieldProto.getOperator().name());
            filter.addFilter(field, operator, fieldValue);
        });
        return filter;
    }

    public String serializeToJson(PositionRequestProto proto) {
        Gson gson = JsonSerializationUtil.getGsonBuilder();

        JsonObject rootMap = new JsonObject();

        List<FieldMapEntry> filtersList = proto.getFilterFields().getFiltersList();
        JsonArray array = new JsonArray();
        filtersList.forEach(field -> serializeField(gson, array, field));
        rootMap.add(JSONFieldNames.POSITION_FILTER, array);

        rootMap.add(JSONFieldNames.FIELDS,  gson.toJsonTree(proto.getFieldsList()));
        rootMap.add(JSONFieldNames.MEASURES, gson.toJsonTree(proto.getMeasuresList()));


        JsonObject contextMap = new JsonObject();
        contextMap.add(JSONFieldNames.POSITION_TYPE, new JsonPrimitive(proto.getPositionType().name()));
        contextMap.add(JSONFieldNames.POSITION_VIEW, new JsonPrimitive(proto.getPositionView().name()));
        contextMap.add(JSONFieldNames.OPERATION, new JsonPrimitive(proto.getOperationType().name()));
        rootMap.add(JSONFieldNames.CONTEXT, contextMap);

        LocalTimestamp.LocalTimestampProto asOfProto = proto.getAsOf();
        JsonObject asOfMap = new JsonObject();

        ZonedDateTime asOf = ProtoSerializationUtil.deserializeTimestamp(asOfProto);
        String timestamp = JsonSerializationUtil.ZONED_DATETIME_FORMAT.format(asOf);
        asOfMap.add(TIMESTAMP, new JsonPrimitive(timestamp));
        asOfMap.add(TIME_ZONE, new JsonPrimitive(asOfProto.getTimeZone()));
        rootMap.add(AS_OF, asOfMap);

        return gson.toJson(rootMap);
    }

    public PositionRequestProto deserializeFromJson(String json) {
        Gson gson = JsonSerializationUtil.getGsonBuilder();
        JsonObject root = gson.fromJson(json, JsonObject.class);

        JsonArray filterArray = root.getAsJsonArray(JSONFieldNames.POSITION_FILTER);

        PositionFilterProto positionFilterProto = deserializeFieldList(filterArray);

        JsonObject contextMap = root.getAsJsonObject(JSONFieldNames.CONTEXT);
        PositionRequestProto.Builder positionRequestBuilder = PositionRequestProto.newBuilder()
                .setFilterFields(positionFilterProto)
                .setPositionType(PositionTypeProto.valueOf(contextMap.get(JSONFieldNames.POSITION_TYPE).getAsString()))
                .setPositionView(PositionViewProto.valueOf(contextMap.get(JSONFieldNames.POSITION_VIEW).getAsString()))
                .setOperationType(Operation.RequestOperationTypeProto.valueOf(contextMap.get(JSONFieldNames.OPERATION).getAsString()));

        JsonArray fieldsArray = root.getAsJsonArray(JSONFieldNames.FIELDS);
        fieldsArray.iterator().forEachRemaining(field -> {
            String fieldStr = field.getAsString();
            FieldProto fieldProto = FieldProto.valueOf(convertFromDisplayName(fieldStr));
            positionRequestBuilder.addFields(fieldProto);
        });

        JsonArray measuresArray = root.getAsJsonArray(JSONFieldNames.MEASURES);
        measuresArray.iterator().forEachRemaining(measure -> {
            String measureStr = measure.getAsString();
            MeasureProto measureProto = MeasureProto.valueOf(convertFromDisplayName(measureStr));
            positionRequestBuilder.addMeasures(measureProto);
        });

        String asOfString = root.get(AS_OF).getAsJsonObject().get(TIMESTAMP).getAsString();
        TemporalAccessor parse = JsonSerializationUtil.ZONED_DATETIME_FORMAT.parse(asOfString);
        String zone = root.get(AS_OF).getAsJsonObject().get(JSONFieldNames.TIME_ZONE).getAsString();

        LocalDateTime tmpDate = LocalDateTime.parse(asOfString, JsonSerializationUtil.ZONED_DATETIME_FORMAT);
        ZonedDateTime asOf = ZonedDateTime.of(tmpDate, ZoneId.of(zone));

        LocalTimestamp.LocalTimestampProto asOfProto = ProtoSerializationUtil.serializeTimestamp(asOf);
        positionRequestBuilder.setAsOf(asOfProto);

        return positionRequestBuilder.build();
    }

    
    public static PositionFilterProto deserializeFieldList(JsonArray filterArray) {
        PositionFilterProto.Builder positionFilterBuilder = PositionFilterProto.newBuilder();

        filterArray.iterator().forEachRemaining(element -> {
            JsonObject jsonMap = (JsonObject) element;
            Field field = Field.valueOf(jsonMap.get(FIELD_NAME).getAsString());
            JsonElement fieldDisplayValue = jsonMap.get(FIELD_DISPLAY_VALUE);

            //If there is no explicit operator, we will assume it's an equals
            //TODO: Needs a unit test
            PositionFilterOperator operator =
                    jsonMap.has(FIELD_OPERATOR) ?
                    PositionFilterOperator.valueOf(jsonMap.get(FIELD_OPERATOR).getAsString()) :
                    PositionFilterOperator.EQUALS;

            if(Field.IDENTIFIER.equals(field)) {
                addIdentifier(positionFilterBuilder, field, fieldDisplayValue, operator);
            }
            else {
                parseStringIntoFilter(positionFilterBuilder, field, fieldDisplayValue, operator);
            }




        });
        return positionFilterBuilder.build();
    }

    private static void addIdentifier(PositionFilterProto.Builder positionFilterBuilder, Field field, JsonElement fieldDisplayValue, PositionFilterOperator operator) {
        JsonObject map = fieldDisplayValue.getAsJsonObject();

        String type = map.get(IDENTIFIER_TYPE).getAsString();
        String value = map.get(IDENTIFIER_VALUE).getAsString();

        IdentifierProto.Builder builder = IdentifierProto.newBuilder();
        builder.setIdentifierType(IdentifierTypeProto.valueOf(type));
        builder.setIdentifierValue(value);

        FieldMapEntry fieldMapEntry = getFieldMapEntry(field, operator, builder.build());
        positionFilterBuilder.addFilters(fieldMapEntry);
    }

    private static void parseStringIntoFilter(PositionFilterProto.Builder positionFilterBuilder, Field field, JsonElement fieldDisplayValue, PositionFilterOperator operator) {
        String valueString = fieldDisplayValue.isJsonNull() ? null : fieldDisplayValue.getAsString();

        if(valueString == null)
            return;

        Object value = null;

        if(String.class.equals(field.getType())) {
            value = fieldDisplayValue.getAsString();
        } else if(LocalDate.class.equals(field.getType())) {
            value = getDate(fieldDisplayValue.getAsString());
        } else {
            value = getUuid(field, valueString);
        }

        FieldMapEntry fieldMapEntry = getFieldMapEntry(field, operator, value);
        positionFilterBuilder.addFilters(fieldMapEntry);
    }

    private static UUID getUuid(Field field, String valueString) {
        UUID uuid = null;
        switch(field) {
            case SECURITY_ID:
            case PORTFOLIO_ID:
                uuid = UUID.fromString(valueString);
                break;
        }
        return uuid;
    }

    private static LocalDate getDate(String valueString) {
        return LocalDate.parse(valueString);
    }
}
