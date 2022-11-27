package protos.serializers.util.json;

import com.google.gson.TypeAdapter;
import com.google.gson.stream.JsonReader;
import com.google.gson.stream.JsonToken;
import com.google.gson.stream.JsonWriter;
import common.model.protoUtils.LocalTimestamp;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;

public class LocalTimestampSerializationAdapter extends TypeAdapter<LocalTimestamp.LocalTimestampProto> {
    @Override
    public LocalTimestamp.LocalTimestampProto read(JsonReader reader) throws IOException {
        reader.beginObject();

        String fieldName = null;
        LocalDateTime timestamp = null;
        String zone = null;
        while (reader.hasNext()) {
            JsonToken token = reader.peek();

            if (token.equals(JsonToken.NAME)) {
                fieldName = reader.nextName();
            }

            if ("timestamp".equals(fieldName)) {
                String timestampString = reader.nextString();
                timestamp = LocalDateTime.parse(timestampString, JsonSerializationUtil.ZONED_DATETIME_FORMAT);
            } else if ("time_zone".equals(fieldName)) {
                zone = reader.nextString();
            }
        }

        reader.endObject();

        assert timestamp != null;
        assert zone != null;
        ZonedDateTime zonedDateTime = ZonedDateTime.of(timestamp, ZoneId.of(zone));

        return ProtoSerializationUtil.serializeTimestamp(zonedDateTime);
    }

    @Override
    public void write(JsonWriter writer, LocalTimestamp.LocalTimestampProto proto) throws IOException {
        if(proto == null) {
            writer.nullValue();
            return;
        }

        ZonedDateTime zonedDateTime = ProtoSerializationUtil.deserializeTimestamp(proto);
        String dateTimeFormat = JsonSerializationUtil.ZONED_DATETIME_FORMAT.format(zonedDateTime);

        writer.beginObject();
        writer.name("timestamp");
        writer.value(dateTimeFormat);
        writer.name("time_zone");
        writer.value(proto.getTimeZone());
        writer.endObject();
    }
}
