package protos.serializers;

import common.model.protos.StrategyAllocationProto;
import common.model.strategy.Strategy;
import common.model.strategy.StrategyAllocation;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import protos.serializers.strategy.StrategySerializer;
import testutil.DummyEquityObjects;

import java.math.BigDecimal;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class StrategySerializerTest {
    @Test
    public void strategySerializationTest() {
        final StrategySerializer serializer = StrategySerializer.getInstance();

        final StrategyAllocation strategyAllocation = DummyEquityObjects.getDummyTransaction().getStrategyAllocation();
        final StrategyAllocationProto proto = serializer.serialize(strategyAllocation);
        final StrategyAllocation strategyAllocationCopy = serializer.deserialize(proto);

        assertEquals(strategyAllocation.getID(), strategyAllocationCopy.getID());
        assertEquals(strategyAllocation.getAsOf(), strategyAllocationCopy.getAsOf());

        Map<Strategy, BigDecimal> originalAllocations = strategyAllocation.getAllocations();
        int numberStrategies = originalAllocations.size();

        Map<Strategy, BigDecimal> copyOfAllocations = strategyAllocationCopy.getAllocations();
        assertEquals(numberStrategies, copyOfAllocations.size());

        originalAllocations.forEach((strategy, allocation) -> {
            BigDecimal copyAllocation = copyOfAllocations.get(strategy);
            assertEquals(allocation.doubleValue(), copyAllocation.doubleValue());
        });
    }


    @Test
    public void testJSONSerialization() {
        final var strategyAllocation = DummyEquityObjects.getDummyTransaction().getStrategyAllocation();

        final StrategySerializer serializer = StrategySerializer.getInstance();
        final StrategyAllocationProto proto = serializer.serialize(strategyAllocation);

        String serialized = serializer.serializeToJson(proto);
        Assertions.assertTrue(serialized.contains("\"strategy_name\": \"Strategy Name\""));
        Assertions.assertTrue(serialized.contains("\"value\": \"1\""));

        StrategyAllocationProto protoCopy = serializer.deserializeFromJson(serialized);
        final var copy = (StrategyAllocation) serializer.deserialize(protoCopy);

        //Check IDs
        Assertions.assertEquals(strategyAllocation.getID(), copy.getID());
        Assertions.assertEquals(strategyAllocation.getAsOf(), copy.getAsOf());
        //Check size, then contents
        Assertions.assertEquals(strategyAllocation.getAllocations().size(), copy.getAllocations().size());
        Assertions.assertEquals(strategyAllocation.getAllocations(), copy.getAllocations());

    }
}