package protos.serializers.price;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import common.models.JSONFieldNames;
import common.models.price.Price;
import common.models.price.PriceProto;
import common.models.security.SecurityProto;
import protos.serializers.IRawDataModelObjectSerializer;
import protos.serializers.security.SecuritySerializer;
import protos.serializers.util.json.JsonSerializationUtil;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.math.BigDecimal;

public class PriceSerializer implements IRawDataModelObjectSerializer<PriceProto, Price> {
    private static final class InstanceHolder {
        private static final PriceSerializer INSTANCE = new PriceSerializer();
    }

    public static PriceSerializer getInstance() {
        return PriceSerializer.InstanceHolder.INSTANCE;
    }

    private PriceSerializer() {
    }

    @Override
    public PriceProto serialize(Price price) {
        PriceProto.Builder builder = PriceProto.newBuilder()
                .setObjectClass(Price.class.getSimpleName())
                .setVersion("0.0.1")
                //Primary Key
                .setUuid(ProtoSerializationUtil.serializeUUID(price.getID()))
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(price.getAsOf()))
                //Biz fields
                .setSecurity(SecuritySerializer.getInstance().serialize(price.getSecurity()))
                .setPrice(ProtoSerializationUtil.serializeBigDecimal(price.getPrice()));

        return builder.build();

    }

    @Override
    public Price deserialize(PriceProto proto) {
        return new Price(
                ProtoSerializationUtil.deserializeUUID(proto.getUuid()),
                ProtoSerializationUtil.deserializeBigDecimal(proto.getPrice()),
                SecuritySerializer.getInstance().deserialize(proto.getSecurity()),
                ProtoSerializationUtil.deserializeTimestamp(proto.getAsOf())
        );
    }

    @Override
    public String serializeToJson(PriceProto proto) {
        //NOTE: Serialization is a slow process and expensive with memory.
        //The in-built serialization doesn't handle enums well because the proto stores them as integers
        //So we have to serialize what we can then get the enum name (E.g. in the securities).
        //Might be better off writing a custom serialization framework later, but this code should only
        //be used by the broker which will scale horizontally. Service-to-service communications should
        //happen via protos which will bypass this inefficiency
        Gson gson = JsonSerializationUtil.getGsonBuilder();

        //First we serialize the price without the security
        PriceProto priceWithNoSecurity = PriceProto.newBuilder(proto).clearSecurity().build();

        //And we put that into a JSON Object
        String json = gson.toJson(priceWithNoSecurity);
        JsonObject jsonObject = gson.fromJson(json, JsonObject.class);

        //Now we serialize the secuirty explicitly
        String securityJson = SecuritySerializer.getInstance().serializeToJson(proto.getSecurity());

        //And add it to the JSON object
        jsonObject.add(JSONFieldNames.SECURITY, gson.fromJson(securityJson, JsonObject.class));

        //And then write that out to a string
        return gson.toJson(jsonObject);
    }

    @Override
    public PriceProto deserializeFromJson(String json) {
        Gson gson = JsonSerializationUtil.getGsonBuilder();

        //First we need to get a Json Object from the raw string
        JsonObject jsonObject = gson.fromJson(json, JsonObject.class);

        if(jsonObject.keySet().size() == 1 && jsonObject.has("price")) {
            //The JSON is a short-form Price object
            return PriceProto.newBuilder().setPrice(
                    ProtoSerializationUtil.serializeBigDecimal(BigDecimal.valueOf(jsonObject.get("price").getAsDouble()))
            ).build();
        }

        //Then we will remove the security and deserialize it explicitly
        String securityJson = jsonObject.get(JSONFieldNames.SECURITY).toString();
        SecurityProto securityProto = SecuritySerializer.getInstance().deserializeFromJson(securityJson);
        jsonObject.remove(JSONFieldNames.SECURITY);

        //We deserialize the price without the security using regular gson deserialization
        PriceProto priceProto = gson.fromJson(jsonObject.toString(), PriceProto.class);

        //Then we add the security to a new prototype and return
        return PriceProto.newBuilder(priceProto).setSecurity(securityProto).build();
    }
}
