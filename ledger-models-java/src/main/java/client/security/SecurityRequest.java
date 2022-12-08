package client.security;

import common.models.postion.PositionFilter;
import common.models.security.Security;

public class SecurityRequest {
    public enum Operation {
      VALIDATE, CREATE, GET, SEARCH,
    }

    public SecurityRequest() {}

    private Operation operation;
    private PositionFilter filter;
    private Security security;

    public void setSecurity(Security security) {
        this.security = security;
    }

    public Security getSecurity() {
        return security;
    }

    public Operation getOperation() {
        return operation;
    }

    public void setOperation(Operation operation) {
        this.operation = operation;
    }

    public PositionFilter getFilter() {
        return filter;
    }

    public void setFilter(PositionFilter filter) {
        this.filter = filter;
    }
}
