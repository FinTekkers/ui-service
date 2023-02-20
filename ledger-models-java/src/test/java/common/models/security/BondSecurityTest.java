package common.models.security;

import common.models.price.Price;
import common.models.transaction.Transaction;
import common.models.transaction.TransactionType;
import fintekkers.models.position.PositionStatusProto;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import testutil.DummyEquityObjects;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;

class BondSecurityTest {
    @Test
    public void quantityTestOnBuyTransaction() {
        runTest(TransactionType.BUY, BigDecimal.valueOf(-1));
    }

    @Test
    public void quantityTestOnSellTransaction() {
        runTest(TransactionType.SELL, BigDecimal.ONE);
    }

    private void runTest(TransactionType buySell, BigDecimal multiplier) {
        BondSecurity security = new BondSecurity(
                UUID.randomUUID(), "Issuer", ZonedDateTime.now(), CashSecurity.USD);
        security.setFaceValue(BigDecimal.valueOf(1000));
        security.setMaturityDate(LocalDate.now().plusYears(5));

        BigDecimal numberBondUnits = BigDecimal.valueOf(50);
        BigDecimal totalFaceValue = numberBondUnits.multiply(security.getFaceValue());

        Price price = new Price(UUID.randomUUID(), BigDecimal.valueOf(105), security, ZonedDateTime.now());

        Transaction transaction = new Transaction(
                UUID.randomUUID(), DummyEquityObjects.getDummyPortfolio(),
                price,
                LocalDate.now(), LocalDate.now().plusDays(2),
                totalFaceValue,
                security, buySell, null, ZonedDateTime.now(), null,
                "No trade name", PositionStatusProto.HYPOTHETICAL);


        BigDecimal directedQuantity = totalFaceValue.multiply(multiplier).multiply(BigDecimal.valueOf(-1));
        Assertions.assertEquals(directedQuantity, transaction.getDirectedQuantity());
        Assertions.assertEquals(0, transaction.getChildTransactions().size());

        Transaction.addCashImpact(transaction);
        Assertions.assertEquals(1, transaction.getChildTransactions().size());

        //50 * price * price scale factor
        BigDecimal cashImpact =
                numberBondUnits.multiply(price.getPrice().multiply(security.getPriceScaleFactor()))
                        .multiply(multiplier);
        Assertions.assertEquals(cashImpact, transaction.getCashTransaction().getDirectedQuantity());

        Transaction.addDerivedTransactions(transaction);
        Assertions.assertEquals(2, transaction.getChildTransactions().size());

        Transaction futureCashImpact =
                transaction.getChildTransactions().stream().filter(t -> !t.getSecurity().isCash()).toList().get(0);

        //The maturation cash impact should be the face value of the bond, i.e. not based on the price paid
        Assertions.assertEquals(transaction.getDirectedQuantity(), futureCashImpact.getCashTransaction().getDirectedQuantity());
    }
}