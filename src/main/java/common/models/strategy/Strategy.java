package common.models.strategy;

import common.models.RawDataModelObject;

import java.time.ZonedDateTime;
import java.util.UUID;

public class Strategy extends RawDataModelObject {

    private final String strategyName;
    private final Strategy parent;

    public Strategy(UUID id, String strategyName, Strategy parent, ZonedDateTime asOf) {
        super(id, asOf);
        this.strategyName = strategyName;
        this.parent = parent;
    }

    @Override
    public String toString() {
        String strategyName = getFullyQualifiedStrategyName();

        return String.format("ID[%s], Strategy[%s]",
                getID().toString(), strategyName);
    }

    @Override
    public int hashCode() {
        return getID().hashCode();
    }

    @Override
    public boolean equals(Object obj) {
        if(obj instanceof Strategy) {
            return ((Strategy)obj).getID().equals(getID());
        } else {
            return false;
        }
    }

    public String getFullyQualifiedStrategyName() {
        StringBuilder buffer = new StringBuilder();
        buffer.append(this.getStrategyName());

        Strategy tmp = this.getParent();
        while(tmp != null) {
            buffer.insert(0, "/");
            buffer.insert(0, tmp.getStrategyName());

            tmp = tmp.getParent();
        }

        return buffer.toString();
    }

    public String getStrategyName() {
        return strategyName;
    }

    public Strategy getParent() {
        return parent;
    }

}
