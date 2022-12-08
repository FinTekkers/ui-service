package client.transaction;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import common.models.JSONFieldNames;
import common.models.transaction.Transaction;
import common.request.TransactionRequestProto;
import common.request.TransactionResponseProto;
import protos.serializers.transaction.TransactionSerializer;
import protos.serializers.util.json.JsonSerializationUtil;

import java.util.List;

public class TransactionResponseSerializer {
    private static final class InstanceHolder {
        private static final TransactionResponseSerializer INSTANCE = new TransactionResponseSerializer();
    }

    public static TransactionResponseSerializer getInstance() {
        return InstanceHolder.INSTANCE;
    }

    private TransactionResponseSerializer() {}

    public TransactionResponseProto serialize(List<Transaction> transactions, TransactionRequestProto request) {
        TransactionResponseProto.Builder builder = TransactionResponseProto.newBuilder();
        builder
                .setObjectClass("TransactionResponse")
                .setVersion("0.0.1");

        if(request != null)
                builder.setCreateTransactionRequest(request);

        TransactionSerializer transactionSerializer = TransactionSerializer.getInstance();
        transactions.forEach(transaction ->
                builder.addTransactionResponse(transactionSerializer.serialize(transaction))
        );


        return builder.build();
    }

    public String serializeToJson(TransactionResponseProto proto) {
        Gson gson = JsonSerializationUtil.getGsonBuilder();

        JsonObject rootMap = new JsonObject();

        //Context
        JsonObject contextMap = new JsonObject();
        rootMap.add(JSONFieldNames.CONTEXT, contextMap);

        //Transaction Results
        JsonArray recordsList = new JsonArray();
        proto.getTransactionResponseList().forEach(transactionProto -> {
            String json = TransactionSerializer.getInstance().serializeToJson(transactionProto);
            JsonObject transaction = gson.fromJson(json, JsonObject.class);
            recordsList.add(transaction);
        });

        rootMap.add(JSONFieldNames.RECORDS, recordsList);

        return gson.toJson(rootMap);
    }
}
