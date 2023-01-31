package protos.serializers.portfolio;

import com.google.gson.Gson;
import common.models.portfolio.Portfolio;
import common.models.postion.PositionStatus;
import fintekkers.models.portfolio.PortfolioProto;
import fintekkers.models.position.PositionStatusProto;
import protos.serializers.IRawDataModelObjectSerializer;
import protos.serializers.util.json.JsonSerializationUtil;
import protos.serializers.util.proto.ProtoSerializationUtil;

public class PortfolioSerializer implements IRawDataModelObjectSerializer<PortfolioProto, Portfolio> {
    private static final class InstanceHolder {
        private static final PortfolioSerializer INSTANCE = new PortfolioSerializer();
    }

    public static PortfolioSerializer getInstance() {
        return PortfolioSerializer.InstanceHolder.INSTANCE;
    }

    private PortfolioSerializer() {
    }

    @Override
    public PortfolioProto serialize(Portfolio portfolio) {
        PortfolioProto.Builder builder = PortfolioProto.newBuilder()
                .setObjectClass(Portfolio.class.getSimpleName())
                .setVersion("0.0.1")
                //Primary Key
                .setUuid(ProtoSerializationUtil.serializeUUID(portfolio.getID()))
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(portfolio.getAsOf()))
                //Biz fields
                .setPortfolioName(portfolio.getPortfolioName());

        return builder.build();
    }

    @Override
    public Portfolio deserialize(PortfolioProto proto) {
        return new Portfolio(
                ProtoSerializationUtil.deserializeUUID(proto.getUuid()),
                proto.getPortfolioName(),
                ProtoSerializationUtil.deserializeTimestamp(proto.getAsOf())
        );
    }

    public PositionStatusProto serialize(PositionStatus status) {
        return PositionStatusProto.valueOf(status.name());
    }

    @Override
    public String serializeToJson(PortfolioProto proto) {
        Gson gson = JsonSerializationUtil.getGsonBuilder();
        return gson.toJson(proto);
    }

    @Override
    public PortfolioProto deserializeFromJson(String json) {
        Gson gson = JsonSerializationUtil.getGsonBuilder();
        return gson.fromJson(json, PortfolioProto.class);
    }
}
