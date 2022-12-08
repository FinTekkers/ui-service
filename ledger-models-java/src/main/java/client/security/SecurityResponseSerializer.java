package client.security;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import common.models.JSONFieldNames;
import common.models.security.Security;
import common.request.SecurityRequestProto;
import common.request.SecurityResponseProto;
import protos.serializers.security.SecuritySerializer;
import protos.serializers.util.json.JsonSerializationUtil;

import java.util.List;

public class SecurityResponseSerializer {
    private static final class InstanceHolder {
        private static final SecurityResponseSerializer INSTANCE = new SecurityResponseSerializer();
    }

    public static SecurityResponseSerializer getInstance() {
        return InstanceHolder.INSTANCE;
    }

    private SecurityResponseSerializer() {}

    public SecurityResponseProto serialize(List<Security> securities, SecurityRequestProto request) {
        SecurityResponseProto.Builder builder = SecurityResponseProto.newBuilder();
        builder
                .setObjectClass("SecurityResponse")
                .setVersion("0.0.1");

        if(request != null)
            builder.setCreateSecurityRequest(request);

        SecuritySerializer securitySerializer = SecuritySerializer.getInstance();
        securities.forEach(security ->
            builder.addSecurityResponse(securitySerializer.serialize(security))
        );

        return builder.build();
    }

    public String serializeToJson(SecurityResponseProto proto) {
        Gson gson = JsonSerializationUtil.getGsonBuilder();

        JsonObject rootMap = new JsonObject();

        //Context
        JsonObject contextMap = new JsonObject();
        rootMap.add(JSONFieldNames.CONTEXT, contextMap);

        //Transaction Results
        JsonArray recordsList = new JsonArray();
        proto.getSecurityResponseList().forEach(securityProto -> {
            String json = SecuritySerializer.getInstance().serializeToJson(securityProto);
            JsonObject transaction = gson.fromJson(json, JsonObject.class);
            recordsList.add(transaction);
        });

        rootMap.add(JSONFieldNames.RECORDS, recordsList);

        return gson.toJson(rootMap);
    }
}
