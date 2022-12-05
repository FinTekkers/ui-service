package protos.serializers.security;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonPrimitive;
import common.model.JSONFieldNames;
import common.model.protos.IdentifierProto;
import common.model.protos.IdentifierTypeProto;
import common.model.security.identifier.Identifier;
import common.model.security.identifier.IdentifierType;
import protos.serializers.IRawDataModelObjectSerializer;
import protos.serializers.util.json.JsonSerializationUtil;

public class IdentifierSerializer implements IRawDataModelObjectSerializer<IdentifierProto, Identifier> {

    private static final class InstanceHolder {
        private static final IdentifierSerializer INSTANCE = new IdentifierSerializer();
    }

    public static IdentifierSerializer getInstance() {
        return InstanceHolder.INSTANCE;
    }

    private IdentifierSerializer() {
    }

    @Override
    public IdentifierProto serialize(Identifier identifier) {
        IdentifierTypeProto identifierTypeProto = IdentifierTypeProto.valueOf(identifier.getIdentifierType().name());

        IdentifierProto.Builder builder = IdentifierProto.newBuilder()
                .setObjectClass(identifier.getClass().getSimpleName())
                .setVersion("0.0.1")

                .setIdentifierType(identifierTypeProto)
                .setIdentifierValue(identifier.getIdentifier());

        return builder.build();
    }

    @Override
    public String serializeToJson(IdentifierProto proto) {
        Gson gson = JsonSerializationUtil.getGsonBuilder();

        String json = gson.toJson(proto);

        JsonObject jsonObject = gson.fromJson(json, JsonObject.class);
        IdentifierTypeProto identifierTypeProto =
                IdentifierTypeProto.forNumber(jsonObject.get(JSONFieldNames.IDENTIFIER_TYPE).getAsInt());

        jsonObject.add(JSONFieldNames.IDENTIFIER_TYPE, new JsonPrimitive(identifierTypeProto.name()));

        return jsonObject.toString();
    }

    @Override
    public IdentifierProto deserializeFromJson(String json) {
        Gson gson = JsonSerializationUtil.getGsonBuilder();

        JsonObject jsonObject = gson.fromJson(json, JsonObject.class);

        IdentifierTypeProto identifierTypeProto = IdentifierTypeProto.valueOf(jsonObject.get(JSONFieldNames.IDENTIFIER_TYPE).getAsString());
        jsonObject.add(JSONFieldNames.IDENTIFIER_TYPE, new JsonPrimitive(identifierTypeProto.getNumber()));

        return gson.fromJson(jsonObject.toString(), IdentifierProto.class);
    }

    @Override
    public Identifier deserialize(IdentifierProto proto) {
        return new Identifier(
                IdentifierType.valueOf(proto.getIdentifierType().name()),
                proto.getIdentifierValue()
        );
    }
}
