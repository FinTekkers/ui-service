package protos.serializers.util.json;

import com.google.gson.TypeAdapter;
import com.google.gson.stream.JsonReader;
import com.google.gson.stream.JsonToken;
import com.google.gson.stream.JsonWriter;
import common.models.protoUtils.DecimalValue;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.io.IOException;
import java.math.BigDecimal;

public class DecimalValueSerializationAdaptor extends TypeAdapter<DecimalValue.DecimalValueProto> {
    @Override
    public DecimalValue.DecimalValueProto read(JsonReader reader) throws IOException {
        JsonToken token = reader.peek();

        if (token != null) {
            String valueString = reader.nextString();
            BigDecimal decimal = new BigDecimal(valueString);
            return ProtoSerializationUtil.serializeBigDecimal(decimal);
        }

        throw new RuntimeException("Couldn't deserialize a big decimal value");
    }

    @Override
    public void write(JsonWriter writer, DecimalValue.DecimalValueProto proto) throws IOException {
        if(proto == null)
            writer.nullValue();
        else
            writer.value(ProtoSerializationUtil.deserializeBigDecimal(proto).toString());
    }
}
