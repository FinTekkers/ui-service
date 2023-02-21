package common.models.transaction;

import fintekkers.models.transaction.TransactionTypeProto;

import java.math.BigDecimal;

public enum TransactionType {
    UNKNOWN(null, TransactionTypeProto.UNKNOWN),
    BUY(BigDecimal.ONE, TransactionTypeProto.BUY),
    SELL(BigDecimal.ONE.multiply(BigDecimal.valueOf(-1)), TransactionTypeProto.SELL),
    DEPOSIT(BigDecimal.ONE, TransactionTypeProto.DEPOSIT),
    WITHDRAWAL(BigDecimal.ONE.multiply(BigDecimal.valueOf(-1)), TransactionTypeProto.WITHDRAWAL),

    MATURATION(BigDecimal.ONE.multiply(BigDecimal.valueOf(-1)), TransactionTypeProto.MATURATION),
    MATURATION_OFFSET(BigDecimal.ONE, TransactionTypeProto.MATURATION_OFFSET);
    //Maturation event is used for things like bonds. The direction is negative because it applies to the amount
    //of the security being reduced due to the maturation. The cash impact will be the reverse

    private final BigDecimal directionMultiplier;
    private final TransactionTypeProto proto;

    TransactionType(BigDecimal directionMultiplier,
                    TransactionTypeProto proto) {
        this.directionMultiplier = directionMultiplier;
        this.proto = proto;
    }

    public BigDecimal getDirectionMultiplier() {
        return directionMultiplier;
    }

    public TransactionTypeProto getProto() {
        return proto;
    }
}