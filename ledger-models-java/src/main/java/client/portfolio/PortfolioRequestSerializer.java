package client.portfolio;

import client.position.PositionRequestSerializer;
import client.transaction.TransactionRequest;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import common.models.JSONFieldNames;
import common.models.portfolio.Portfolio;
import common.models.portfolio.PortfolioProto;
import common.models.position.PositionFilterProto;
import common.models.postion.PositionFilter;
import common.models.transaction.Transaction;
import common.request.PortfolioRequestProto;
import common.request.TransactionRequestProto;
import common.request.util.RequestOperationTypeProto;
import protos.serializers.portfolio.PortfolioSerializer;
import protos.serializers.util.json.JsonSerializationUtil;

/**
 * Serializes and deserializes position requests
 */
public class PortfolioRequestSerializer {
    private static final class InstanceHolder {
        private static final PortfolioRequestSerializer INSTANCE = new PortfolioRequestSerializer();
    }

    public static PortfolioRequestSerializer getInstance() {
        return InstanceHolder.INSTANCE;
    }

    private PortfolioRequestSerializer() {
    }

    public PortfolioRequestProto serialize(PortfolioRequest request) {
        PortfolioRequestProto.Builder builder = PortfolioRequestProto.newBuilder()
                .setObjectClass(PortfolioRequest.class.getSimpleName())
                .setVersion("0.0.1")
                .setOperationType(RequestOperationTypeProto.valueOf(request.getOperation().name()));

        Portfolio portfolio = request.getPortfolio();
        PortfolioProto PortfolioProto = PortfolioSerializer.getInstance().serialize(portfolio);
        builder.setCreatePortfolioInput(PortfolioProto);

        return builder.build();
    }

    public PortfolioRequest deserialize(PortfolioRequestProto proto) {
        PortfolioRequest request = new PortfolioRequest();
        request.setOperation(PortfolioRequest.Operation.valueOf(proto.getOperationType().name()));

        if(proto.hasCreatePortfolioInput()) {
            PortfolioProto portfolioProto = proto.getCreatePortfolioInput();
            Portfolio portfolio = PortfolioSerializer.getInstance().deserialize(portfolioProto);
            request.setPortfolio(portfolio);
        }

        if(proto.hasSearchPortfolioInput()) {
            PositionFilter filter = new PositionFilter();
            PositionRequestSerializer.addFilterFields(proto.getSearchPortfolioInput(), filter);
            request.setFilter(filter);
        }

        return request;
    }

    public String serializeToJson(TransactionRequestProto proto) {
        throw new UnsupportedOperationException("Do not currently support serializing this request to JSON");
    }

    public PortfolioRequestProto deserializeFromJson(String json) {
        Gson gson = JsonSerializationUtil.getGsonBuilder();
        JsonObject root = gson.fromJson(json, JsonObject.class);

        JsonObject contextMap = root.getAsJsonObject(JSONFieldNames.CONTEXT);

        if(!contextMap.has(JSONFieldNames.OPERATION)) {
            throw new RuntimeException("The Context must include an 'Operation' field. To create a new Portfolio, " +
                    "you should set it to "+ TransactionRequest.Operation.CREATE.name());
        }

        PortfolioRequestProto.Builder builder = PortfolioRequestProto.newBuilder();

        final PortfolioRequest.Operation operation =
                PortfolioRequest.Operation.valueOf(contextMap.get(JSONFieldNames.OPERATION).getAsString());
        final RequestOperationTypeProto operationType =
                RequestOperationTypeProto.valueOf(contextMap.get(JSONFieldNames.OPERATION).getAsString());

        builder.setObjectClass(PortfolioRequest.class.getSimpleName())
                .setVersion("0.0.1")
                .setOperationType(operationType);

        switch (operation) {
            case CREATE:
                addPortfolio(root, builder);
                break;
            case SEARCH:
                addSearch(root, builder);
        }

        return builder.build();
    }

    private void addPortfolio(JsonObject root, PortfolioRequestProto.Builder builder) {
        JsonObject Portfolio = root.getAsJsonObject(Transaction.class.getSimpleName().toLowerCase());
        PortfolioProto PortfolioProto = PortfolioSerializer.getInstance().deserializeFromJson(Portfolio.toString());
        builder.setCreatePortfolioInput(PortfolioProto);
    }
    private void addSearch(JsonObject root, PortfolioRequestProto.Builder builder) {
        JsonArray fieldsArray = root.get("search").getAsJsonArray();
        PositionFilterProto filterProto = PositionRequestSerializer.deserializeFieldList(fieldsArray);
        builder.setSearchPortfolioInput(filterProto);
    }
}
