package client.position;

import common.models.postion.Field;
import common.models.postion.Measure;
import common.models.postion.PositionFilter;

import java.time.ZonedDateTime;
import java.util.HashSet;
import java.util.Set;

public class PositionRequest {
    public enum Operation {
        VALIDATE,
        GET,

        //CREATE? Not valid, given they are manifested via transactions/tax lots
        //Look-through? Search?
    }

    public PositionRequest() {
        measures = new HashSet<>();
    }

    private Operation operation;
    private PositionFilter filter;
    private Set<Measure> measures;
    private Set<Field> fields;
    private PositionContext context;

    private ZonedDateTime asOf;

    public Set<Field> getFields() {
        return fields;
    }

    public void setFields(Set<Field> fields) {
        this.fields = fields;
    }

    public PositionContext getContext() {
        return this.context;
    }

    public void setContext(PositionContext context) {
        this.context = context;
    }

    public Set<Measure> getMeasures() {
        return measures;
    }

    public void addMeasure(Measure measure) {
        measures.add(measure);
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

    public ZonedDateTime getAsOf() {
        return asOf;
    }

    public void setAsOf(ZonedDateTime asOf) {
        this.asOf = asOf;
    }
}
