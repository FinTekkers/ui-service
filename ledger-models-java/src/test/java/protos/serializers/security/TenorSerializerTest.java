package protos.serializers.security;

import common.models.security.Tenor;
import common.models.security.TenorType;
import fintekkers.models.security.TenorProto;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class TenorSerializerTest {
    private static TenorSerializer serializer = TenorSerializer.getInstance();

    @Test
    public void testTenorSerialization() {
        String tenorString = "1Y";
        checkSame(serializer, tenorString);

        tenorString = "18M";
        checkSame(serializer, tenorString);

        tenorString = "18W";
        checkSame(serializer, tenorString);

        tenorString = "7D";
        checkSame(serializer, tenorString);
    }

    @Test
    public void testMultipleSegmentTenorSerialization() {
        String tenorString = "1Y6M";
        checkSame(serializer, tenorString);
    }

    private void checkSame(TenorSerializer serializer, String tenorString) {
        Tenor tenor = new Tenor(TenorType.TERM, tenorString);
        TenorProto proto = serializer.serialize(tenor);

        Tenor tenor2 = serializer.deserialize(proto);

        Assertions.assertEquals(tenor.getTenorDescription(), tenor2.getTenorDescription());
        Assertions.assertEquals(tenor.getTenor(), tenor2.getTenor());
        Assertions.assertEquals(tenor.getType(), tenor2.getType());
    }
}