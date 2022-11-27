package testutil;

import common.model.portfolio.Portfolio;
import common.model.postion.Field;
import common.model.postion.Measure;
import common.model.postion.Position;
import common.model.price.Price;
import common.model.security.CashSecurity;
import common.model.security.EquitySecurity;
import common.model.security.Security;
import common.model.security.identifier.Identifier;
import common.model.security.identifier.IdentifierType;
import common.model.strategy.Strategy;
import common.model.strategy.StrategyAllocation;
import common.model.taxLot.TaxLotDelta;
import common.model.taxLot.TaxLotSource;
import common.model.transaction.Transaction;
import common.model.transaction.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

import static common.model.postion.PositionStatus.EXECUTED;

public class DummyEquityObjects {
    public static Security getDummySecurity() {
        EquitySecurity equitySecurity = new EquitySecurity(UUID.randomUUID(), "dummy issuer",
                ZonedDateTime.now().minusYears(10), getCashSecurity());
        equitySecurity.setSecurityId(new Identifier(IdentifierType.EXCH_TICKER, "TSLA"));
        return equitySecurity;
    }

    public static CashSecurity getCashSecurity() {
        return CashSecurity.USD;
    }

    public static Portfolio getDummyPortfolio() {
        return new Portfolio(UUID.randomUUID(),
                "dummy portfolio: "+ ThreadLocalRandom.current().nextInt(0, 100),
                ZonedDateTime.now().plusYears(1));
    }
    public static Price getDummyPrice() {
        return new Price(UUID.randomUUID(), BigDecimal.valueOf(100), getDummySecurity(),
                ZonedDateTime.now().plusYears(1));
    }

    public static Position getDummyPosition() {
        Position position = new Position(
                Position.PositionType.TRANSACTION);
        position.setMeasureValue(Measure.DIRECTED_QUANTITY, BigDecimal.valueOf(100));
        position.setFieldValue(Field.PORTFOLIO, getDummyPortfolio());
        position.setFieldValue(Field.SECURITY, getDummySecurity());

        return position;
    }


    public static Transaction getDummyTransaction(
            LocalDate tradeDate, Portfolio portfolio, Security security,
            TransactionType transactionType, Price price, BigDecimal amount,
            StrategyAllocation strategyAllocation) {
        if(strategyAllocation == null) {
            strategyAllocation = new StrategyAllocation(UUID.randomUUID(), ZonedDateTime.now()) {{
                addAllocation(
                        new Strategy(UUID.randomUUID(), "Strategy Name", null, ZonedDateTime.now()),
                        BigDecimal.ONE
                );
            }};
        }

        Transaction transaction = new Transaction(UUID.randomUUID(), portfolio,
                price, tradeDate, tradeDate.plusDays(2),
                amount, security, transactionType,
                strategyAllocation,
                ZonedDateTime.now(), null, "No Trade Name", EXECUTED);

        Transaction.addCashImpact(transaction);
        Transaction.addDerivedTransactions(transaction);

        return transaction;
    }

    public static Transaction getDummyTransaction(Portfolio portfolio, Security security) {
        return getDummyTransaction(LocalDate.now(),
                portfolio, security, TransactionType.BUY,
                Price.getPrice(BigDecimal.TEN, security),
                BigDecimal.TEN, null);
    }

    public static Transaction getDummyTransaction() {
        return getDummyTransaction(getDummyPortfolio(), getDummySecurity());
    }

    public static TaxLotDelta getDummyTaxLot() {
        Transaction t = getDummyTransaction();
        return new TaxLotDelta(UUID.randomUUID(), t.getPortfolio(), TaxLotDelta.TaxLotStatus.Open, t.getPrice(), t.getTradeDate(),
                null, t.getQuantity(), t.getSecurity(),
                t.getAsOf(), new TaxLotSource(t), t.getPositionStatus());
    }
}
