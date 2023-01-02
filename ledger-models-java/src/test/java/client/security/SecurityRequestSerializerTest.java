package client.security;

import common.models.position.FieldProto;
import common.models.position.PositionFilterProto;
import common.request.CreateSecurityRequestProto;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class SecurityRequestSerializerTest {
    @Test
    public void testSearchRequestDeserialization() {
//        String json = "{\n" +
//                "\t\"context\": {\n" +
//                "\t\t\"operation\": \"SEARCH\"\n" +
//                "\t},\n" +
//                "\t\"search\": [{\n" +
//                "\t\t\"field_name\": \"IDENTIFIER\",\n" +
//                "\t\t\"field_display_value\": {\n" +
//                "\t\t\t\"identifier_type\": \"EXCH_TICKER\",\n" +
//                "\t\t\t\"identifier_value\": \"NYSE:1142\"\n" +
//                "\t\t},\n" +
//                "\t\t\"field_type\": \"Identifier\"\n" +
//                "\t}]\n" +
//                "}";
//
//
//        CreateSecurityRequestProto requestProto = null;
//        System.out.println(json);
//        requestProto = SecurityRequestSerializer.getInstance().deserializeFromJson(json);
//
//
//        PositionFilterProto searchSecurityInput = requestProto.getSecurityInput();
//        Assertions.assertEquals(1, searchSecurityInput.getFiltersList().size());
//        FieldProto field = searchSecurityInput.getFiltersList().get(0).getField();
//        Assertions.assertEquals(FieldProto.IDENTIFIER, field);
    }
}