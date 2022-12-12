package client.position;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonPrimitive;
import common.models.JSONFieldNames;
import common.models.position.PositionProto;
import common.models.postion.Position;
import common.request.PositionRequestProto;
import common.request.PositionResponseProto;
import protos.serializers.position.PositionSerializer;
import protos.serializers.util.json.JsonSerializationUtil;

import java.util.List;

public class PositionResponseSerializer {
    private static final class InstanceHolder {
        private static final PositionResponseSerializer INSTANCE = new PositionResponseSerializer();
    }

    public static PositionResponseSerializer getInstance() {
        return InstanceHolder.INSTANCE;
    }

    private PositionResponseSerializer() {}

    public PositionResponseProto serialize(List<Position> positions, PositionRequestProto requestProto) {
        PositionResponseProto.Builder builder = PositionResponseProto.newBuilder();
        builder.setReportingCurrency("USD"); //TODO - Need to decide if this is the best way to model

        positions.forEach(position -> {
            PositionProto positionProto = PositionSerializer.getInstance().serialize(position);
            builder.addPositions(positionProto);
        });

        builder.setObjectClass("PositionResponse")
                .setVersion("0.0.1")
                .setPositionRequest(requestProto);

        return builder.build();
    }

    public String serializeToJson(PositionResponseProto proto) {
        Gson gson = JsonSerializationUtil.getGsonBuilder();

        JsonObject rootMap = new JsonObject();

        JsonObject contextMap = new JsonObject();
        PositionRequestProto positionRequest = proto.getPositionRequest();
        contextMap.add(JSONFieldNames.REPORTING_CURRENCY, new JsonPrimitive(proto.getReportingCurrency()));
        rootMap.add(JSONFieldNames.CONTEXT, contextMap);

        PositionSerializer positionSerializer = PositionSerializer.getInstance();
        JsonArray recordsList = new JsonArray();
        proto.getPositionsList().forEach(positionProto ->
                positionSerializer.serializeSinglePositionToJson(positionProto, gson, recordsList));

        rootMap.add(JSONFieldNames.RECORDS, recordsList);
        return gson.toJson(rootMap);
    }
}
