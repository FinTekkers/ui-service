package protos.serializers;

import common.model.protos.TransactionProto;
import common.model.transaction.Transaction;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import protos.serializers.transaction.TransactionSerializer;
import testutil.DummyBondObjects;

class TransactionSerializerTest {
    @Test
    public void testTransactionSerialize() {
        Transaction transaction = DummyBondObjects.getDummyTransaction();

//        Transaction.addCashImpact(transaction);
//        Transaction.generateDerivedTransactions(transaction);

        TransactionSerializer serializer = TransactionSerializer.getInstance();
        TransactionProto proto = serializer.serialize(transaction);

        Transaction copy = serializer.deserialize(proto);

        compareTransaction(transaction, copy);
    }

    private void compareTransaction(Transaction transaction, Transaction copy) {
        Assertions.assertEquals(transaction.getID(), copy.getID());
        Assertions.assertEquals(transaction.getAsOf(), copy.getAsOf());

        Assertions.assertEquals(transaction.getPortfolio().getID(), copy.getPortfolio().getID());
        Assertions.assertEquals(transaction.getSecurity().getID(), copy.getSecurity().getID());
        Assertions.assertEquals(transaction.getTransactionType(), copy.getTransactionType());
        Assertions.assertEquals(transaction.getQuantity().doubleValue(), copy.getQuantity().doubleValue());
        //Other price values should be tested in a separate test
        Assertions.assertEquals(transaction.getPrice().getPrice().doubleValue(), copy.getPrice().getPrice().doubleValue());


        Assertions.assertEquals(transaction.getTradeDate(), copy.getTradeDate());
        Assertions.assertEquals(transaction.getSettlementDate(), copy.getSettlementDate());

        Assertions.assertEquals(transaction.getPositionStatus(), copy.getPositionStatus());
        Assertions.assertEquals(transaction.getTradeName(), copy.getTradeName());
        Assertions.assertEquals(transaction.isCancelled(), copy.isCancelled());

        for(int i=0; i< transaction.getChildTransactions().size(); i++) {
            compareTransaction(transaction.getChildTransactions().get(i), copy.getChildTransactions().get(i));
        }
    }

    @Test
    public void testTransactionSerializeToJson() {
        TransactionSerializer serializer = TransactionSerializer.getInstance();

        TransactionProto transactionProto = serializer.serialize(DummyBondObjects.getDummyTransaction());

        String json = serializer.serializeToJson(transactionProto);

        TransactionProto transactionProtoCopy = serializer.deserializeFromJson(json);

        Assertions.assertEquals(transactionProto.getPositionStatus(), transactionProtoCopy.getPositionStatus());
        Assertions.assertEquals(transactionProto.getTradeName(), transactionProtoCopy.getTradeName());
        Assertions.assertEquals(transactionProto.getIsCancelled(), transactionProtoCopy.getIsCancelled());
    }

}