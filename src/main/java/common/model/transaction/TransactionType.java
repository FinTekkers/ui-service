package common.model.transaction;

import java.math.BigDecimal;

public enum TransactionType {
    BUY(BigDecimal.ONE),
    SELL(BigDecimal.ONE.multiply(BigDecimal.valueOf(-1))),
    DEPOSIT(BigDecimal.ONE),
    WITHDRAWAL(BigDecimal.ONE.multiply(BigDecimal.valueOf(-1))),

    MATURATION(BigDecimal.ONE.multiply(BigDecimal.valueOf(-1))),
    MATURATION_OFFSET(BigDecimal.ONE);
    //Maturation event is used for things like bonds. The direction is negative because it applies to the amount
    //of the security being reduced due to the maturation. The cash impact will be the reverse

    private final BigDecimal directionMultiplier;

    TransactionType(BigDecimal directionMultiplier) {
        this.directionMultiplier = directionMultiplier;
    }

    public BigDecimal getDirectionMultiplier() {
        return directionMultiplier;
    }
}