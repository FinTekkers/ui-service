package protos.serializers.util.json;

import com.google.gson.ExclusionStrategy;
import com.google.gson.FieldAttributes;

public class JsonFieldExclusionStrategy implements ExclusionStrategy {
    private static final JsonFieldExclusionStrategy INSTANCE = new JsonFieldExclusionStrategy();

    private JsonFieldExclusionStrategy() {
    }

    public static JsonFieldExclusionStrategy getInstance() {
        return INSTANCE;
    }

    @Override
    public boolean shouldSkipField(FieldAttributes field) {
        return field.getName().contains("memoized") || field.getName().contains("unknown");
    }

    @Override
    public boolean shouldSkipClass(Class<?> clazz) {
        return false;
    }
}
