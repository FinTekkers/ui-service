package client.transaction;

import common.models.postion.PositionFilter;
import common.models.transaction.Transaction;

public class TransactionRequest {
    public enum Operation {
      VALIDATE, CREATE, SEARCH
      //Look-through? Search?
    }

    public TransactionRequest() {}

    private Operation operation;
    private Transaction transaction;

    public PositionFilter getFilter() {
        return filter;
    }

    public void setFilter(PositionFilter filter) {
        this.filter = filter;
    }

    private PositionFilter filter;

    public Operation getOperation() {
        return operation;
    }

    public void setOperation(Operation operation) {
        this.operation = operation;
    }

    public Transaction getTransaction() {
        return transaction;
    }

    public void setTransaction(Transaction transaction) {
        this.transaction = transaction;
    }

}
