package common.model.taxLot;

import common.model.transaction.Transaction;

public class TaxLotSource {
    private final Transaction txn;

    public TaxLotSource(Transaction txn){
        this.txn = txn;
    }

    public Transaction getTxn() {
        return txn;
    }
}
