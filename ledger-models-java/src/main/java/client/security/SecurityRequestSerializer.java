package client.security;

import client.position.PositionRequest;
import client.position.PositionRequestSerializer;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import common.models.JSONFieldNames;
import common.models.position.PositionFilterProto;
import common.models.postion.PositionFilter;
import common.models.security.Security;
import common.models.security.SecurityProto;
import common.request.SecurityRequestProto;
import common.request.TransactionRequestProto;
import protos.serializers.security.SecuritySerializer;
import protos.serializers.util.json.JsonSerializationUtil;
import util.Operation;

;

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

    public SecurityRequestProto serialize(SecurityRequest request) {
        SecurityRequestProto.Builder builder = SecurityRequestProto.newBuilder()
                .setObjectClass(PositionRequest.class.getSimpleName())
                .setVersion("0.0.1")
                .setOperationType(Operation.RequestOperationTypeProto.valueOf(request.getOperation().name()));

        Security transaction = request.getSecurity();
        SecurityProto securityProto = SecuritySerializer.getInstance().serialize(transaction);
        builder.setCreateSecurityInput(securityProto);

        return builder.build();
    }

    public SecurityRequest deserialize(SecurityRequestProto proto) {
        SecurityRequest request = new SecurityRequest();
        request.setOperation(SecurityRequest.Operation.valueOf(proto.getOperationType().name()));

        if(proto.hasCreateSecurityInput()) {
            SecurityProto securityProto = proto.getCreateSecurityInput();
            Security security = SecuritySerializer.getInstance().deserialize(securityProto);
            request.setSecurity(security);
        }

        if(proto.hasSearchSecurityInput()) {
            PositionFilter filter = new PositionFilter();
            PositionRequestSerializer.addFilterFields(proto.getSearchSecurityInput(), filter);
            request.setFilter(filter);
        }

        return request;
    }

    public String serializeToJson(TransactionRequestProto proto) {
        throw new UnsupportedOperationException("Do not currently support serializing this request to JSON");
    }

    public SecurityRequestProto deserializeFromJson(String json) {
        Gson gson = JsonSerializationUtil.getGsonBuilder();
        JsonObject root = gson.fromJson(json, JsonObject.class);

        JsonObject contextMap = root.getAsJsonObject(JSONFieldNames.CONTEXT);

        if(!contextMap.has(JSONFieldNames.OPERATION)) {
            throw new RuntimeException("The Context must include an 'Operation' field. To create a new security, " +
                    "you should set it to "+ SecurityRequest.Operation.CREATE.name() +" or "+
                    SecurityRequest.Operation.SEARCH.name());
        }

        SecurityRequest.Operation operation =
                SecurityRequest.Operation.valueOf(contextMap.get(JSONFieldNames.OPERATION).getAsString());
        Operation.RequestOperationTypeProto operationType =
                Operation.RequestOperationTypeProto.valueOf(contextMap.get(JSONFieldNames.OPERATION).getAsString());

        SecurityRequestProto.Builder builder = SecurityRequestProto.newBuilder();

        builder.setObjectClass(SecurityRequest.class.getSimpleName())
                .setVersion("0.0.1")
                .setOperationType(operationType);

        switch (operation) {
            case CREATE:
                addSecurity(root, builder);
                break;
            case SEARCH:
                addSearch(root, builder);
        }

        return builder.build();
    }

    private void addSearch(JsonObject root, SecurityRequestProto.Builder builder) {
        JsonArray fieldsArray = root.get("search").getAsJsonArray();
        PositionFilterProto filterProto = PositionRequestSerializer.deserializeFieldList(fieldsArray);
        builder.setSearchSecurityInput(filterProto);
    }

    private void addSecurity(JsonObject root, SecurityRequestProto.Builder builder) {
        JsonObject security = root.getAsJsonObject(Security.class.getSimpleName().toLowerCase());
        SecurityProto securityProto = SecuritySerializer.getInstance().deserializeFromJson(security.toString());
        builder.setCreateSecurityInput(securityProto);
    }
}
