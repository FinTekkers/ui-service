package common.model.postion;

import common.model.IFinancialModelObject;
import common.model.IRawDataModelObject;
import common.model.portfolio.Portfolio;
import common.model.security.Security;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static java.lang.String.format;

public class Position implements IFinancialModelObject, IRawDataModelObject {
    private final PositionType type; // Transactions or TaxLots
    private final PositionView positionView; //Default or Strategy

    private final HashMap<Field, Object> fields;
    private final HashMap<Measure, BigDecimal> measures;
    private ZonedDateTime asOf;

    public void setAsOfDate(ZonedDateTime asOf) {
        this.asOf = asOf;
    }

    /**
     * To think through:
     *
     * PositionSource: Transaction / TaxLot / JournalEntry
     * PositionView: Basic / Strategy / Look-through
     * Key: Replaces Aggregation Level?
     *
     * Use cases:
     *
     *  * Find positions with settlement currency USD -> use the key concept?
     *  * Find cash equity positions -> use the key concept?
     *  * Settlement ladder / Cash Ladder - Should these be position views or you use the key somehow?
     *      -> use the key concept, to get raw positions, then have a layer above?
     *
     *  Need to think through decomposable views. I.e. show me total AUM; then show by portfolio, then portfolio and currency, etc.
     */

    public enum PositionType{
        TRANSACTION, TAX_LOT//, JournalEntry
    }

    public enum PositionView {
        DEFAULT_VIEW, STRATEGY_VIEW //, LOOKTHROUGH
    }

    public Position(PositionView view, PositionType type) {
        this.type = type;
        this.fields = new HashMap<>();
        this.measures = new HashMap<>();
        this.positionView = view;
    }

    public Position(PositionType type) {
        this(PositionView.DEFAULT_VIEW, type);
    }

    public Position(PositionType type, Measure measure, Portfolio portfolio, Security security, ZonedDateTime asOf) {
        this(PositionView.DEFAULT_VIEW, type);
        this.setFieldValue(Field.PORTFOLIO, portfolio);
        this.setFieldValue(Field.SECURITY, security);
        this.setMeasureValue(measure, null);
        this.asOf = asOf == null ? ZonedDateTime.now() : asOf;
    }

    public Position(PositionType type, Measure measure, Portfolio portfolio, Security security) {
        this(type, measure, portfolio, security, ZonedDateTime.now());
    }


    public PositionType getPositionType() {
        return type;
    }

    public PositionView getPositionView() {
        return positionView;
    }

    //Fields

    public Object getField(Field field) {
        return this.fields.get(field);
    }

    public Set<Field> getFields() {
        return this.fields.keySet();
    }

    public void setFieldValue(Field field, Object value) {
        if (value == null) {
            this.fields.remove(field);
        } else if(field.validateFieldValue(value)) {
            this.fields.put(field, value);
        } else {
            throw new RuntimeException(format("Field %s accepts %s type, but got %s",
                    field.name(),
                    field.getType().getName(),
                    value.getClass().getName()));
        }
    }

    //Measures

    public void setMeasureValue(Measure measure, BigDecimal value) {
        if (value == null || measure.getType().equals(value.getClass())) {
            this.measures.put(measure, value);
        } else {
            throw new RuntimeException(format("Field %s accepts %s type, but got %s",
                    measure.name(), measure.getType().getName(), value.getClass().getName()));
        }
    }

    public BigDecimal getMeasure(Measure measure) {
        return this.measures.get(measure);
    }

    public Set<Measure> getMeasures() {
        return this.measures.keySet();
    }

    public String toString() {
        String measures = getMeasures().stream()
                .map(e -> e.toString().concat(":").concat(
                        getMeasure(e) == null ? "" : getMeasure(e).toString())
                ).collect(Collectors.joining("|"));

        String fields = getFields().stream()
                .map(e -> e.toString().concat(":").concat(
                        getField(e) == null ? "" : getField(e).toString())
                ).collect(Collectors.joining("|"));

        return format("Position [View=%s, Type= %s] { %s } { %s }",
                getPositionView().toString(), getPositionType().toString(), measures, fields);
    }


    @Override
    public UUID getID() {
        throw new UnsupportedOperationException("Not supported for positions");
    }

    @Override
    public ZonedDateTime getValidFrom() {
        throw new UnsupportedOperationException("Not supported for positions");
    }

    @Override
    public ZonedDateTime getValidTo() {
        throw new UnsupportedOperationException("Not supported for positions");
    }

    @Override
    public ZonedDateTime getAsOf() {
        return this.asOf;
    }
}
