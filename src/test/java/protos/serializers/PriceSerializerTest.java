package protos.serializers;

import common.model.price.Price;
import common.model.protos.PriceProto;
import org.junit.jupiter.api.Test;
import protos.serializers.price.PriceSerializer;
import testutil.DummyEquityObjects;

import static java.time.temporal.ChronoUnit.MILLIS;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PriceSerializerTest {
    @Test
    public void testPortfolioSerialize() {
        final var price = DummyEquityObjects.getDummyPrice();

        final PriceSerializer serializer = PriceSerializer.getInstance();
        final PriceProto proto = serializer.serialize(price);

        final var copy = serializer.deserialize(proto);

        assertEquals(price.getID(), copy.getID());
        assertTrue(price.getAsOf().truncatedTo(MILLIS).isEqual(copy.getAsOf().truncatedTo(MILLIS)));

        assertEquals(price.getPrice().doubleValue(), copy.getPrice().doubleValue());
        assertEquals(price.getSecurity().getID(), copy.getSecurity().getID());
        assertEquals(price.getSecurity().getIssuer(), copy.getSecurity().getIssuer());
    }

    @Test
    public void testJSONSerialization() {
        final var price = DummyEquityObjects.getDummyPrice();

        final PriceSerializer serializer = PriceSerializer.getInstance();
        final PriceProto proto = serializer.serialize(price);

        String serialized = serializer.serializeToJson(proto);
        assertTrue(serialized.contains("\"price\": \"100\""));

        PriceProto protoCopy = serializer.deserializeFromJson(serialized);
        final var copy = (Price) serializer.deserialize(protoCopy);

        //NOTE: Only testing cash specific items here
        assertEquals(price.getID(), copy.getID());
        assertTrue(price.getAsOf().truncatedTo(MILLIS).isEqual(copy.getAsOf().truncatedTo(MILLIS)));
        assertEquals(price.getPrice(), copy.getPrice());
    }
}