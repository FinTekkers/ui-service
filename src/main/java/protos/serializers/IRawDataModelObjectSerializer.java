package protos.serializers;

import com.google.protobuf.Any;
import com.google.protobuf.GeneratedMessageV3;
import com.google.protobuf.InvalidProtocolBufferException;
import common.model.IRawDataModelObject;
import common.model.portfolio.Portfolio;
import common.model.price.Price;
import common.model.protos.PortfolioProto;
import common.model.protos.PriceProto;
import common.model.protos.SecurityProto;
import common.model.protos.TransactionProto;
import common.model.security.Security;
import common.model.transaction.Transaction;
import protos.serializers.portfolio.PortfolioSerializer;
import protos.serializers.price.PriceSerializer;
import protos.serializers.security.SecuritySerializer;
import protos.serializers.transaction.TransactionSerializer;

import java.util.HashMap;
import java.util.Map;

/**
 * The interface that defines serialization methods.
 */
public interface IRawDataModelObjectSerializer
        <ProtoClass extends GeneratedMessageV3,
                RawDataModelClass extends IRawDataModelObject> {
    ProtoClass serialize(RawDataModelClass dataModelObject);

    String serializeToJson(ProtoClass proto);

    ProtoClass deserializeFromJson(String json);

    RawDataModelClass deserialize(ProtoClass proto);
}
