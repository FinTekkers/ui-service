package protos.serializers;

import com.google.protobuf.Any;
import com.google.protobuf.GeneratedMessageV3;
import com.google.protobuf.InvalidProtocolBufferException;
import common.models.price.Price;
import common.models.security.*;
import common.models.transaction.Transaction;
import fintekkers.models.price.PriceProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.security.SecurityTypeProto;
import fintekkers.models.transaction.TransactionProto;
import org.junit.jupiter.api.Test;
import testutil.DummyBondObjects;
import testutil.DummyEquityObjects;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SerializerFactoryTest {
    /**
     * Tests that the serializer factor can successfully call the appropriate serializer given the appropriate object.
     */
    @Test
    public void testSerializationFactory() throws InvalidProtocolBufferException {
        SerializerFactory factory = SerializerFactory.getInstance();

        BondSecurity bondSecurity = DummyBondObjects.getDummySecurity();
        Security equitySecurity = DummyEquityObjects.getDummySecurity();

        GeneratedMessageV3 proto = factory.serialize(bondSecurity);
        assertEquals(Any.class, proto.getClass());
        assertTrue(((Any)proto).is(SecurityProto.class));
        proto = ((Any) proto).unpack(SecurityProto.class);
        assertEquals(SecurityTypeProto.BOND_SECURITY, ((SecurityProto) proto).getSecurityType());

        proto = factory.serialize(equitySecurity);
        assertEquals(Any.class, proto.getClass());
        assertTrue(((Any)proto).is(SecurityProto.class));
        proto = ((Any) proto).unpack(SecurityProto.class);
        assertEquals(SecurityTypeProto.EQUITY_SECURITY, ((SecurityProto) proto).getSecurityType());

        Transaction transaction = DummyBondObjects.getDummyTransaction();
        proto = factory.serialize(transaction);
        assertEquals(Any.class, proto.getClass());
        assertTrue(((Any)proto).is(TransactionProto.class));
        proto = ((Any) proto).unpack(TransactionProto.class);
        String tradeName = ((TransactionProto) proto).getObjectClass();
        assertEquals(Transaction.class.getSimpleName(), tradeName);

        //Price
        Price price = DummyEquityObjects.getDummyPrice();
        proto = factory.serialize(price);
        proto = ((Any) proto).unpack(PriceProto.class);
        assertEquals(PriceProto.class, proto.getClass());
    }

}