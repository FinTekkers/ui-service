package common.model.strategy;

import common.model.RawDataModelObject;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

public class StrategyAllocation extends RawDataModelObject {
    private final Map<Strategy, BigDecimal> allocations;

    public StrategyAllocation(UUID id, ZonedDateTime asOf) {
        super(id, asOf);
        allocations = new HashMap<>();
    }

    @Override
    public String toString() {
        StringBuffer buffer = new StringBuffer();

        for(Map.Entry<Strategy, BigDecimal> entry: allocations.entrySet()) {
            buffer.append(entry.getKey().getFullyQualifiedStrategyName());
            buffer.append("/");
            buffer.append(entry.getValue());
            buffer.append(";");
        }

        String id = getID() != null ? getID().toString() : "";
        return String.format("ID[%s], Strategy[%s]", id, buffer.toString());
    }

    @Override
    public boolean equals(Object obj) {
        if(obj instanceof StrategyAllocation) {
            return ((StrategyAllocation)obj).getID().equals(getID());
        } else {
            return false;
        }
    }

    public void addAllocation(Strategy strategy, BigDecimal allocation) {
        this.allocations.put(strategy, allocation);
    }

    public boolean validate() {
        BigDecimal total = BigDecimal.ZERO;

        for(BigDecimal val : this.allocations.values()) {
            total = total.add(val);
        }

        return BigDecimal.ONE.compareTo(total) == 0;
    }

    public Map<Strategy, BigDecimal> getAllocations() {
        return allocations;
    }
}
