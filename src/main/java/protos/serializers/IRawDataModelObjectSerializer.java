package protos.serializers;

import com.google.protobuf.GeneratedMessageV3;
import common.model.IRawDataModelObject;

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
