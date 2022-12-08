package client.portfolio;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import common.models.JSONFieldNames;
import common.models.portfolio.Portfolio;
import common.request.PortfolioRequestProto;
import common.request.PortfolioResponseProto;
import protos.serializers.portfolio.PortfolioSerializer;
import protos.serializers.position.PositionSerializer;
import protos.serializers.util.json.JsonSerializationUtil;

import java.util.List;

public class PortfolioResponseSerializer {
    private static final class InstanceHolder {
        private static final PortfolioResponseSerializer INSTANCE = new PortfolioResponseSerializer();
    }

    public static PortfolioResponseSerializer getInstance() {
        return InstanceHolder.INSTANCE;
    }

    private PortfolioResponseSerializer() {}

    public PortfolioResponseProto serialize(List<Portfolio> portfolios, PortfolioRequestProto request) {
        PortfolioResponseProto.Builder builder = PortfolioResponseProto.newBuilder();
        builder
                .setObjectClass("PortfolioResponse")
                .setVersion("0.0.1");

        if(request != null)
            builder.setCreatePortfolioRequest(request);

        PortfolioSerializer portfolioSerializer = PortfolioSerializer.getInstance();
        portfolios.forEach(Portfolio ->
            builder.addPortfolioResponse(portfolioSerializer.serialize(Portfolio))
        );

        return builder.build();
    }

    public String serializeToJson(PortfolioResponseProto proto) {
        Gson gson = JsonSerializationUtil.getGsonBuilder();

        JsonObject rootMap = new JsonObject();

        //Context
        JsonObject contextMap = new JsonObject();
        rootMap.add(JSONFieldNames.CONTEXT, contextMap);

        //Transaction Results
        PositionSerializer positionSerializer = PositionSerializer.getInstance();
        JsonArray recordsList = new JsonArray();
        proto.getPortfolioResponseList().forEach(PortfolioProto -> {
            String json = PortfolioSerializer.getInstance().serializeToJson(PortfolioProto);
            JsonObject transaction = gson.fromJson(json, JsonObject.class);
            recordsList.add(transaction);
        });

        rootMap.add(JSONFieldNames.RECORDS, recordsList);

        return gson.toJson(rootMap);
    }
}
