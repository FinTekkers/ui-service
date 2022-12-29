package client.transaction;

import client.position.PositionRequest;
import client.position.PositionRequestSerializer;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import common.models.JSONFieldNames;
import common.models.position.PositionFilterProto;
import common.models.postion.PositionFilter;
import common.models.transaction.Transaction;
import common.models.transaction.TransactionProto;
import common.request.TransactionRequestProto;
import common.request.util.RequestOperationTypeProto;
import protos.serializers.transaction.TransactionSerializer;
import protos.serializers.util.json.JsonSerializationUtil;

/**
 * Serializes and deserializes position requests
 */
public class TransactionRequestSerializer {
    private static final class InstanceHolder {
        private static final TransactionRequestSerializer INSTANCE = new TransactionRequestSerializer();
    }

    public static TransactionRequestSerializer getInstance() {
        return InstanceHolder.INSTANCE;
    }

    private TransactionRequestSerializer() {
    }

    public TransactionRequestProto serialize(TransactionRequest request) {
        TransactionRequestProto.Builder builder = TransactionRequestProto.newBuilder()
                .setObjectClass(PositionRequest.class.getSimpleName())
                .setVersion("0.0.1")
                .setOperationType(RequestOperationTypeProto.valueOf(request.getOperation().name()));

        Transaction transaction = request.getTransaction();
        TransactionProto transactionProto = TransactionSerializer.getInstance().serialize(transaction);
        builder.setCreateTransactionInput(transactionProto);

        return builder.build();

    }

    public TransactionRequest deserialize(TransactionRequestProto proto) {
        TransactionRequest request = new TransactionRequest();
        request.setOperation(TransactionRequest.Operation.valueOf(proto.getOperationType().name()));

        if(proto.hasCreateTransactionInput()) {
            TransactionProto transactionProto = proto.getCreateTransactionInput();
            Transaction transaction = TransactionSerializer.getInstance().deserialize(transactionProto);
            request.setTransaction(transaction);
        } else if(proto.hasSearchTransactionInput()) {
            PositionFilter filter = new PositionFilter();
            PositionRequestSerializer.addFilterFields(proto.getSearchTransactionInput(), filter);
            request.setFilter(filter);
        }

        return request;
    }

    public String serializeToJson(TransactionRequestProto proto) {
        throw new UnsupportedOperationException("Do not currently support serializing this request to JSON");
    }

    public TransactionRequestProto deserializeFromJson(String json) {

        Gson gson = JsonSerializationUtil.getGsonBuilder();
        JsonObject root = gson.fromJson(json, JsonObject.class);

        JsonObject contextMap = root.getAsJsonObject(JSONFieldNames.CONTEXT);

        if(!contextMap.has(JSONFieldNames.OPERATION)) {
            throw new RuntimeException("The Context must include an 'Operation' field. To create a new transaction, " +
                    "you should set it to "+ TransactionRequest.Operation.CREATE.name());
        }

        TransactionRequestProto.Builder builder = TransactionRequestProto.newBuilder();

        final TransactionRequest.Operation operation =
                TransactionRequest.Operation.valueOf(contextMap.get(JSONFieldNames.OPERATION).getAsString());
        final RequestOperationTypeProto operationType =
                RequestOperationTypeProto.valueOf(contextMap.get(JSONFieldNames.OPERATION).getAsString());

        builder.setObjectClass(TransactionRequest.class.getSimpleName())
                .setVersion("0.0.1")
                .setOperationType(operationType);

        switch(operationType) {
            case CREATE:
                addTransaction(root, builder);
                break;
            case SEARCH:
                addSearch(root, builder);
        }
        return builder.build();
    }

    private void addTransaction(JsonObject root, TransactionRequestProto.Builder builder) {
        JsonObject transaction = root.getAsJsonObject(Transaction.class.getSimpleName().toLowerCase());
        TransactionProto transactionProto = TransactionSerializer.getInstance().deserializeFromJson(transaction.get("transaction").toString());
        builder.setCreateTransactionInput(transactionProto);
    }

    private void addSearch(JsonObject root, TransactionRequestProto.Builder builder) {
        JsonArray fieldsArray = root.get("search").getAsJsonArray();
        PositionFilterProto filterProto = PositionRequestSerializer.deserializeFieldList(fieldsArray);
        builder.setSearchTransactionInput(filterProto);
    }
}
