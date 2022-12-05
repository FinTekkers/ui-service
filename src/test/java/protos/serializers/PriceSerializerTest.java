package protos.serializers;

import common.model.price.Price;
import common.model.protos.PriceProto;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import protos.serializers.price.PriceSerializer;
import testutil.DummyEquityObjects;

class PriceSerializerTest {
    @Test
    public void testPortfolioSerialize() {
        final var price = DummyEquityObjects.getDummyPrice();

        final PriceSerializer serializer = PriceSerializer.getInstance();
        final PriceProto proto = serializer.serialize(price);

        final var copy = serializer.deserialize(proto);

        Assertions.assertEquals(price.getID(), copy.getID());
        Assertions.assertEquals(price.getAsOf(), copy.getAsOf());

        Assertions.assertEquals(price.getPrice().doubleValue(), copy.getPrice().doubleValue());
        Assertions.assertEquals(price.getSecurity().getID(), copy.getSecurity().getID());
        Assertions.assertEquals(price.getSecurity().getIssuer(), copy.getSecurity().getIssuer());
    }

    @Test
    public void testJSONSerialization() {
        final var price = DummyEquityObjects.getDummyPrice();

        final PriceSerializer serializer = PriceSerializer.getInstance();
        final PriceProto proto = serializer.serialize(price);

        String serialized = serializer.serializeToJson(proto);
        System.out.println(serialized);
        Assertions.assertTrue(serialized.contains("\"price\": \"100\""));

        PriceProto protoCopy = serializer.deserializeFromJson(serialized);
        final var copy = (Price) serializer.deserialize(protoCopy);

        //NOTE: Only testing cash specific items here
        Assertions.assertEquals(price.getID(), copy.getID());
        Assertions.assertEquals(price.getAsOf(), copy.getAsOf());
        Assertions.assertEquals(price.getPrice(), copy.getPrice());
    }
}