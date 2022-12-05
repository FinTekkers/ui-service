package protos.serializers;

import com.amazonaws.util.StringUtils;
import common.model.protos.SecurityProto;
import common.model.security.BondSecurity;
import common.model.security.CashSecurity;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import protos.serializers.security.SecuritySerializer;
import testutil.DummyBondObjects;
import testutil.DummyEquityObjects;

import java.util.Random;

class SecuritySerializerTest {
    @Test
    public void testBaseSecurityAndEquitySecuritySerialize() {
        final var security = DummyEquityObjects.getDummySecurity();

        String description = new Random().nextInt() % 2 == 0 ? null : "TEST";
        security.setDescription(description);

        final SecuritySerializer serializer = SecuritySerializer.getInstance();
        final SecurityProto proto = serializer.serialize(security);

        final var copy = serializer.deserialize(proto);

        Assertions.assertEquals(security.getID(), copy.getID());
        Assertions.assertTrue(security.getAsOf().isEqual(copy.getAsOf()));

        Assertions.assertEquals(security.getIssuer(), copy.getIssuer());
        Assertions.assertEquals(security.getQuantityType(), copy.getQuantityType());

        Assertions.assertEquals(security.getDescription(), copy.getDescription());

        //Settlement security - Indirectly testing cash
        Assertions.assertEquals(security.getSettlementCurrency().getID(), copy.getSettlementCurrency().getID());
        Assertions.assertTrue(security.getAsOf().isEqual(copy.getAsOf()));

        Assertions.assertEquals(security.getSettlementCurrency().getIssuer(), copy.getSettlementCurrency().getIssuer());
        Assertions.assertEquals(security.getSettlementCurrency().getQuantityType(), copy.getSettlementCurrency().getQuantityType());

        Assertions.assertEquals(security.getSecurityId().getIdentifier(), copy.getSecurityId().getIdentifier());
        Assertions.assertEquals(security.getSecurityId().getIdentifierType(), copy.getSecurityId().getIdentifierType());
    }
    @Test
    public void testBondSecuritySerialize() {
        final var security = DummyBondObjects.getDummySecurity();

        final SecuritySerializer serializer = SecuritySerializer.getInstance();
        final SecurityProto proto = serializer.serialize(security);

        final var copy = (BondSecurity) serializer.deserialize(proto);

        //NOTE: Only testing bond specific items here
        Assertions.assertEquals(security.getID(), copy.getID());
        Assertions.assertTrue(security.getAsOf().isEqual(copy.getAsOf()));

        Assertions.assertEquals(security.getFaceValue().doubleValue(), copy.getFaceValue().doubleValue());
        Assertions.assertEquals(security.getCouponRate().doubleValue(), copy.getCouponRate().doubleValue());
        Assertions.assertEquals(security.getCouponFrequency(), copy.getCouponFrequency());
        Assertions.assertEquals(security.getCouponType(), copy.getCouponType());
        Assertions.assertEquals(security.getDatedDate(), copy.getDatedDate());
        Assertions.assertEquals(security.getIssueDate(), copy.getIssueDate());
        Assertions.assertEquals(security.getMaturityDate(), copy.getMaturityDate());
        Assertions.assertEquals(security.getPriceScaleFactor().doubleValue(), copy.getPriceScaleFactor().doubleValue());
    }

    @Test
    public void testCashSerialization() {
        final var security = CashSecurity.USD;

        final SecuritySerializer serializer = SecuritySerializer.getInstance();
        final SecurityProto proto = serializer.serialize(security);

        final var copy = (CashSecurity) serializer.deserialize(proto);

        //NOTE: Only testing bond specific items here
        Assertions.assertEquals(security.getID(), copy.getID());
        Assertions.assertTrue(security.getAsOf().isEqual(copy.getAsOf()));
    }

    @Test
    public void testJSONSerializationForCashSecurity() {
        final var security = CashSecurity.USD;

        final SecuritySerializer serializer = SecuritySerializer.getInstance();
        final SecurityProto proto = serializer.serialize(security);

        String serialized = serializer.serializeToJson(proto);
        String expectedJson = "{\"object_class\":\"Security\",\"version\":\"0.0.1\",\"uuid\":\"00000000-0000-0001-0000-000000000001\",\"as_of\":{\"timestamp\":\"1000-Jan-01 00:00:00.000000\",\"time_zone\":\"America/New_York\"},\"is_link\":false,\"security_type\":\"CASH_SECURITY\",\"asset_class\":\"Cash\",\"issuer_name\":\"USD\",\"quantity_type\":\"UNITS\",\"identifier\":{\"object_class\":\"Identifier\",\"version\":\"0.0.1\",\"identifier_value\":\"USD\",\"identifier_type\":\"CASH\"},\"description\":\"USD\",\"cash_id\":\"CASHUSD\"}";
        Assertions.assertEquals( 0 /*same*/, StringUtils.compare(expectedJson, serialized),
                "Json didn't match! Got:\n"+ serialized+ "\nExpected\n"+ expectedJson);

        SecurityProto protoCopy = serializer.deserializeFromJson(serialized);
        final var copy = (CashSecurity) serializer.deserialize(protoCopy);

        //NOTE: Only testing cash specific items here
        Assertions.assertEquals(security.getID(), copy.getID());
        Assertions.assertTrue(security.getAsOf().isEqual(copy.getAsOf()));
        Assertions.assertEquals(security.getSecurityId(), copy.getSecurityId());
        Assertions.assertEquals(security.getCashId(), copy.getCashId());
    }

    @Test
    public void testJSONSerializationForBondSecurity() {
        final var security = DummyBondObjects.getDummySecurity();

        final SecuritySerializer serializer = SecuritySerializer.getInstance();
        final SecurityProto proto = serializer.serialize(security);

        String serialized = serializer.serializeToJson(proto);

        SecurityProto protoCopy = serializer.deserializeFromJson(serialized);
        final var copy = (BondSecurity) serializer.deserialize(protoCopy);

        //NOTE: Only testing cash specific items here
        Assertions.assertEquals(security.getID(), copy.getID());
        Assertions.assertEquals(security.getAsOf(), copy.getAsOf());
        Assertions.assertEquals(security.getSecurityId(), copy.getSecurityId());

        //Bond security
        Assertions.assertEquals(security.getCouponType(), copy.getCouponType());
        Assertions.assertEquals(security.getCouponFrequency(), copy.getCouponFrequency());
        Assertions.assertEquals(security.getSettlementCurrency(), copy.getSettlementCurrency());
        Assertions.assertEquals(security.getIssueDate(), copy.getIssueDate());
        Assertions.assertEquals(security.getDatedDate(), copy.getDatedDate());
        Assertions.assertEquals(security.getMaturityDate(), copy.getMaturityDate());
        Assertions.assertEquals(security.getSecurityId(), copy.getSecurityId());
    }
}