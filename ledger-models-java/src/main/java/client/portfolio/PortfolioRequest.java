package client.portfolio;

import common.models.portfolio.Portfolio;
import common.models.postion.PositionFilter;

public class PortfolioRequest {
    private Portfolio portfolio;

    public Portfolio getPortfolio() {
        return portfolio;
    }

    public void setPortfolio(Portfolio portfolio) {

        this.portfolio = portfolio;
    }


    public enum Operation {
      VALIDATE,
      CREATE,
      GET,
        SEARCH
      //Look-through? Search?
    }

    public PortfolioRequest() {}

    private Operation operation;
    private PositionFilter filter;

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
