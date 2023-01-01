package client.security;

import client.position.PositionRequest;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import common.models.security.Security;
import common.models.security.SecurityProto;
import common.request.CreateSecurityRequestProto;
import common.request.TransactionRequestProto;
import protos.serializers.security.SecuritySerializer;
import protos.serializers.util.json.JsonSerializationUtil;

/**
 * Serializes and deserializes position requests
 */
public class SecurityRequestSerializer {
    private static final class InstanceHolder {
        private static final SecurityRequestSerializer INSTANCE = new SecurityRequestSerializer();
    }

    public static SecurityRequestSerializer getInstance() {
        return InstanceHolder.INSTANCE;
    }

    private SecurityRequestSerializer() {}

    public CreateSecurityRequestProto serialize(SecurityRequest request) {
        CreateSecurityRequestProto.Builder builder = CreateSecurityRequestProto.newBuilder()
                .setObjectClass(PositionRequest.class.getSimpleName())
                .setVersion("0.0.1");

        Security transaction = request.getSecurity();
        SecurityProto securityProto = SecuritySerializer.getInstance().serialize(transaction);
        builder.setSecurityInput(securityProto);

        return builder.build();
    }

    public SecurityRequest deserialize(CreateSecurityRequestProto proto) {
        SecurityRequest request = new SecurityRequest();

        if(proto.hasSecurityInput()) {
            SecurityProto securityProto = proto.getSecurityInput();
            Security security = SecuritySerializer.getInstance().deserialize(securityProto);
            request.setSecurity(security);
        }

//        if(proto.hasSearchSecurityInput()) {
//            PositionFilter filter = new PositionFilter();
//            PositionRequestSerializer.addFilterFields(proto.getSearchSecurityInput(), filter);
//            request.setFilter(filter);
//        }

        return request;
    }

    public String serializeToJson(TransactionRequestProto proto) {
        throw new UnsupportedOperationException("Do not currently support serializing this request to JSON");
    }

    public CreateSecurityRequestProto deserializeFromJson(String json) {
        Gson gson = JsonSerializationUtil.getGsonBuilder();
        JsonObject root = gson.fromJson(json, JsonObject.class);

        CreateSecurityRequestProto.Builder builder = CreateSecurityRequestProto.newBuilder();

        builder.setObjectClass(SecurityRequest.class.getSimpleName())
                .setVersion("0.0.1");

        addSecurity(root, builder);

        return builder.build();
    }

//    private void addSearch(JsonObject root, CreateSecurityRequestProto.Builder builder) {
//        JsonArray fieldsArray = root.get("search").getAsJsonArray();
//        PositionFilterProto filterProto = PositionRequestSerializer.deserializeFieldList(fieldsArray);
//        builder.setSearchSecurityInput(filterProto);
//    }

    private void addSecurity(JsonObject root, CreateSecurityRequestProto.Builder builder) {
        JsonObject security = root.getAsJsonObject(Security.class.getSimpleName().toLowerCase());
        SecurityProto securityProto = SecuritySerializer.getInstance().deserializeFromJson(security.toString());
        builder.setSecurityInput(securityProto);
    }
}
