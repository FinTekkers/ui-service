package common.model.errors.transaction;

import common.model.taxLot.TaxLotDelta;

import java.util.Collection;

public class TransactionErrorNoLotsToReduce extends TransactionProcessingException {
    public TransactionErrorNoLotsToReduce(String message, Collection<TaxLotDelta> lotsState) {
        super(message);
        this.lotsState = lotsState;
    }

    private final Collection<TaxLotDelta> lotsState;

    public Collection<TaxLotDelta> getLotsState() {
        return lotsState;
    }
}
