package common.models.taxLot;

import common.models.transaction.Transaction;

public class TaxLotSource {
    private final Transaction txn;

    public TaxLotSource(Transaction txn){
        this.txn = txn;
    }

    public Transaction getTxn() {
        return txn;
    }
}
