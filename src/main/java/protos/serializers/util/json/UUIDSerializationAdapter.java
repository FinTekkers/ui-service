package protos.serializers.util.json;

import com.google.gson.TypeAdapter;
import com.google.gson.stream.JsonReader;
import com.google.gson.stream.JsonToken;
import com.google.gson.stream.JsonWriter;
import common.model.protoUtils.Uuid;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.io.IOException;
import java.util.UUID;

public class UUIDSerializationAdapter extends TypeAdapter<Uuid.UUIDProto> {
    @Override
    public Uuid.UUIDProto read(JsonReader reader) throws IOException {
        Uuid.UUIDProto.Builder builder = Uuid.UUIDProto.newBuilder();
        JsonToken token = reader.peek();

        if (token != null) {
            String uuidStr = reader.nextString();
            UUID uuid = UUID.fromString(uuidStr);
            builder.setRawUuid(ProtoSerializationUtil.serializeUUID(uuid).getRawUuid());
        }

        return builder.build();
    }

    @Override
    public void write(JsonWriter writer, Uuid.UUIDProto uuid) throws IOException {
        if(uuid == null)
            writer.nullValue();
        else
            writer.value(ProtoSerializationUtil.deserializeUUID(uuid).toString());
    }
}
