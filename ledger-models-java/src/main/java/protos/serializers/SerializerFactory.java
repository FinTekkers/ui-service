package protos.serializers;

import com.google.protobuf.Any;
import com.google.protobuf.GeneratedMessageV3;
import com.google.protobuf.InvalidProtocolBufferException;
import common.models.IRawDataModelObject;
import common.models.portfolio.Portfolio;
import common.models.price.Price;
import common.models.security.Security;
import common.models.transaction.Transaction;
import fintekkers.models.portfolio.PortfolioProto;
import fintekkers.models.price.PriceProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.transaction.TransactionProto;
import protos.serializers.portfolio.PortfolioSerializer;
import protos.serializers.price.PriceSerializer;
import protos.serializers.security.SecuritySerializer;
import protos.serializers.transaction.TransactionSerializer;

import java.util.HashMap;
import java.util.Map;

public class SerializerFactory implements IRawDataModelObjectSerializer {
    private final static protos.serializers.SerializerFactory INSTANCE = new protos.serializers.SerializerFactory();

    public static protos.serializers.SerializerFactory getInstance() {
        return INSTANCE;
    }

    private final static Map<Class, IRawDataModelObjectSerializer> serializers = new HashMap<>() {{
        put(Transaction.class, TransactionSerializer.getInstance());
        put(Security.class, SecuritySerializer.getInstance());
        put(Price.class, PriceSerializer.getInstance());
        put(Portfolio.class, PortfolioSerializer.getInstance());
    }};

    private final static Map<Class, IRawDataModelObjectSerializer> serializers_by_proto = new HashMap<>() {{
        put(TransactionProto.class, TransactionSerializer.getInstance());
        put(SecurityProto.class, SecuritySerializer.getInstance());
        put(PriceProto.class, PriceSerializer.getInstance());
        put(PortfolioProto.class, PortfolioSerializer.getInstance());
    }};

    @Override
    public GeneratedMessageV3 serialize(IRawDataModelObject dataModelObject) {
        IRawDataModelObjectSerializer serializer = serializers.get(dataModelObject.getClass());

        if (serializer == null && Security.class.isAssignableFrom(dataModelObject.getClass())) {
            serializer = serializers.get(Security.class);
        }

        if (serializer == null) {
            throw new RuntimeException("No serializer found for " + dataModelObject.getClass().getSimpleName());
        }

        final GeneratedMessageV3 proto = serializer.serialize(dataModelObject);
        return Any.pack(proto);
    }

    public static byte[] serializeToBytes(GeneratedMessageV3 proto) {
        return proto.toByteArray();
    }

    public static GeneratedMessageV3 deserializeFromBytes(byte[] bytes) {
        try {
            return Any.parseFrom(bytes);
        } catch (InvalidProtocolBufferException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public IRawDataModelObject deserialize(GeneratedMessageV3 proto) {
        try {
            Any any = (Any) proto;
            GeneratedMessageV3 unpacked;

            if (any.is(TransactionProto.class)) {
                unpacked = any.unpack(TransactionProto.class);
            } else if (any.is(SecurityProto.class)) {
                unpacked = any.unpack(SecurityProto.class);
            } else if (any.is(PriceProto.class)) {
                unpacked = any.unpack(PriceProto.class);
            } else if (any.is(PortfolioProto.class)) {
                unpacked = any.unpack(PortfolioProto.class);
            } else {
                throw new UnsupportedOperationException("Could not process proto of type:" + proto.getDescriptorForType().getName());
            }

            final IRawDataModelObjectSerializer serializer = serializers_by_proto.get(unpacked.getClass());
            return serializer.deserialize(unpacked);
        } catch (InvalidProtocolBufferException e) {
            throw new RuntimeException(e);
        }
    }

    public IRawDataModelObject deserialize(byte[] bytes) {
        final GeneratedMessageV3 proto = protos.serializers.SerializerFactory.deserializeFromBytes(bytes);
        return this.deserialize(proto);
    }

    @Override
    public String serializeToJson(GeneratedMessageV3 proto) {
        IRawDataModelObjectSerializer serializer = serializers_by_proto.get(proto.getClass());
        if (serializer == null) {
            throw new RuntimeException("No serializer found for " + proto.getClass().getSimpleName());
        }
        return serializer.serializeToJson(proto);
    }

    @Override
    public GeneratedMessageV3 deserializeFromJson(String json) {
        throw new UnsupportedOperationException("Not implemented");
    }
}
