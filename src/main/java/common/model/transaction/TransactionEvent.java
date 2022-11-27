package common.model.transaction;

import java.util.List;

/***
 * A transaction represents an operation that changes the position of a portfolio. The most obvious of which
 * is buy or sell transaction from the order management system, but this could also represent a transfer of a security
 * or a post-trade activity such as a divident payment, stock split, and so on.
 *
 */
public class TransactionEvent {
    private final List<Transaction> newTxns;
    private final List<Transaction> oldTxns;

    public TransactionEvent(List<Transaction> newTxn, List<Transaction> oldTxn) {
        this.newTxns = newTxn;
        this.oldTxns = oldTxn;
    }

    public List<Transaction> getOldTxns() {
        return oldTxns;
    }

    public List<Transaction> getNewTxns() {
        return newTxns;
    }
}