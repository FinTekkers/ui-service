package protos.serializers;

import com.google.protobuf.Any;
import org.junit.jupiter.api.Test;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ProtoUtilTest {
    @Test
    public void testGenericSerialization() {
        testLocalDate();
        testTimestamp();
        testBigDecimal();
    }

    private void testBigDecimal() {
        BigDecimal value = BigDecimal.TEN;
        Any serializedDate = ProtoSerializationUtil.serializeToAny(value);
        Object object = ProtoSerializationUtil.deserialize(serializedDate);

        assertEquals(value, object);
    }

    private void testTimestamp() {
        ZonedDateTime now = ZonedDateTime.now();
        Any serializedDate = ProtoSerializationUtil.serializeToAny(now);
        Object object = ProtoSerializationUtil.deserialize(serializedDate);

        assertEquals(now, object);
    }
    private void testLocalDate() {
        LocalDate date = LocalDate.now();
        Any serializedDate = ProtoSerializationUtil.serializeToAny(date);
        Object object = ProtoSerializationUtil.deserialize(serializedDate);

        assertEquals(date, object);
    }
}