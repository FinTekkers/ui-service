package protos.serializers.util.json;

import com.google.gson.TypeAdapter;
import com.google.gson.stream.JsonReader;
import com.google.gson.stream.JsonToken;
import com.google.gson.stream.JsonWriter;
import common.model.protos.FieldMapEntry;

import java.io.IOException;

public class FieldMapEntrySerializationAdaptor extends TypeAdapter<FieldMapEntry> {
    @Override
    public FieldMapEntry read(JsonReader reader) throws IOException {
        JsonToken token = reader.peek();

        if (token != null) {
            String valueString = reader.nextString();
            System.out.println(valueString);
//            BigDecimal decimal = new BigDecimal(valueString);
//            return ProtoSerializationUtil.serializeBigDecimal(decimal);
        }

        throw new RuntimeException("Couldn't deserialize a big decimal value");
    }

    @Override
    public void write(JsonWriter writer, FieldMapEntry proto) throws IOException {
        if (proto == null) {
            writer.nullValue();
        } else {
//            Object unpackedProto = ProtoSerializationUtil.deserialize(proto.getFieldValuePacked());
//            unpackedProto = ProtoSerializationUtil.serialize(unpackedProto);
            writer.beginObject();
//
//
//            System.out.println(proto.getEnumValue());
//
//            String json = JsonSerializationUtil.getGsonBuilder().toJson(unpackedProto);
//            System.out.println(json);

            writer.value("hello");//{ \"hello\" : \"world\" }");
            writer.endObject();

//            JsonSerializationUtil.serializeToJSON(writer, unpackedProto);

//            proto.getField()
//            writer.nullValue();
        }
//            writer.value(ProtoSerializationUtil.deserializeBigDecimal(proto).toString());
    }
}
