package common.models.transaction;

import common.models.IFinancialModelObject;
import common.models.IRawDataModelObject;
import common.models.portfolio.Portfolio;
import common.models.postion.Field;
import common.models.postion.Measure;
import common.models.postion.PositionFilter;
import common.models.postion.PositionStatus;
import common.models.price.Price;
import common.models.security.Security;
import common.models.strategy.StrategyAllocation;

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
