package protos.serializers;

import com.google.gson.Gson;
import common.models.portfolio.Portfolio;
import fintekkers.models.portfolio.PortfolioProto;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import protos.serializers.portfolio.PortfolioSerializer;
import protos.serializers.util.json.JsonSerializationUtil;
import testutil.DummyEquityObjects;

class PortfolioSerializerTest {
    @Test
    public void testPortfolioSerialize() {
        Portfolio portfolio = DummyEquityObjects.getDummyPortfolio();
        PortfolioSerializer serializer = PortfolioSerializer.getInstance();
        PortfolioProto proto = serializer.serialize(portfolio);

        Portfolio copy = serializer.deserialize(proto);

        assertAttributesMatch(portfolio, copy);

    }

    private void assertAttributesMatch(Portfolio portfolio, Portfolio copy) {
        Assertions.assertEquals(portfolio, copy);
        Assertions.assertEquals(portfolio.getPortfolioName(), copy.getPortfolioName());
        Assertions.assertEquals(portfolio.getID(), copy.getID());
    }

    /**
     * Takes a portfolio object, converts it to proto and then serializes to JSON. It then deserializes back to a
     * proto and then instantiates another portfolio object to make sure the end-to-end process is solid.
     */
    @Test
    public void testObjectSerializesToJSONandBack() {
        /// Step 1: Object -> JSON
        Portfolio portfolio = DummyEquityObjects.getDummyPortfolio();

        PortfolioSerializer serializer = PortfolioSerializer.getInstance();
        PortfolioProto portfolioProto = serializer.serialize(portfolio);
        Gson gson = JsonSerializationUtil.getGsonBuilder();

        String serialized = gson.toJson(portfolioProto);

        // Step 2: JSON -> Object
        PortfolioProto portfolioProtoCopy = serializer.deserializeFromJson(serialized);
        Portfolio portfolioCopy = serializer.deserialize(portfolioProtoCopy);

        // Step 3: Compare attributes
        assertAttributesMatch(portfolio, portfolioCopy);

    }
}