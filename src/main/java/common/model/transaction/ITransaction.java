package common.model.transaction;

import common.model.IFinancialModelObject;
import common.model.IRawDataModelObject;
import common.model.portfolio.Portfolio;
import common.model.postion.Field;
import common.model.postion.Measure;
import common.model.postion.PositionFilter;
import common.model.postion.PositionStatus;
import common.model.price.Price;
import common.model.security.Security;
import common.model.strategy.StrategyAllocation;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;

public interface ITransaction extends IRawDataModelObject, IFinancialModelObject {
    //Field accessors
    Portfolio getPortfolio();

    Security getSecurity();

    StrategyAllocation getStrategyAllocation();

    Price getPrice();

    LocalDate getSettlementDate();

    BigDecimal getQuantity();

    BigDecimal getDirectedQuantity();

    LocalDate getTradeDate();

    TransactionType getTransactionType();

    Boolean isCancelled();

    String getTradeName();

    PositionStatus getPositionStatus();

    Object getField(Field field);

    Set<Field> getFields();

    Set<Measure> getMeasures();

    BigDecimal getMeasure(Measure measure);

    boolean isMatch(PositionFilter filter);

//    Transaction getCashTransaction();

    Transaction getParentTransaction();

    Transaction getCashTransaction();
}
