package protos.serializers.util.json;

import com.google.gson.FieldNamingPolicy;
import com.google.gson.FieldNamingStrategy;

import java.lang.reflect.Field;

public class JsonFieldNamingStrategy implements FieldNamingStrategy {
    public String translateName(Field field) {
        String fieldName = FieldNamingPolicy.LOWER_CASE_WITH_UNDERSCORES.translateName(field);
        if (fieldName.startsWith("_")) {
            fieldName = fieldName.substring(1);
        }

        if (fieldName.endsWith("_")) {
            fieldName = fieldName.substring(0, fieldName.length() - 1);
        }

        return fieldName;
    }
}
