package client.security;

import common.models.postion.PositionFilter;
import common.models.security.Security;

public class SecurityRequest {
    public SecurityRequest() {}

    private PositionFilter filter;
    private Security security;

    public void setSecurity(Security security) {
        this.security = security;
    }

    public Security getSecurity() {
        return security;
    }

    public PositionFilter getFilter() {
        return filter;
    }

    public void setFilter(PositionFilter filter) {
        this.filter = filter;
    }
}
