package protos.serializers.util.json;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.TypeAdapter;
import com.google.gson.stream.JsonReader;
import com.google.gson.stream.JsonToken;
import com.google.gson.stream.JsonWriter;
import fintekkers.models.position.FieldMapEntry;
import fintekkers.models.security.SecurityQuantityTypeProto;
import fintekkers.models.util.DecimalValue;
import fintekkers.models.util.LocalTimestamp;
import fintekkers.models.util.Uuid;

import java.io.IOException;
import java.time.format.DateTimeFormatter;

public class JsonSerializationUtil {
    public static DateTimeFormatter ZONED_DATETIME_FORMAT = DateTimeFormatter.ofPattern("yyyy-MMM-dd HH:mm:ss.SSSSSS");

    public static Gson builder = getGsonBuilder();

    private static final class EnumTypeAdapter<T extends Enum<T>> extends TypeAdapter<T> {
        public EnumTypeAdapter() {
        }

        public T read(JsonReader in) throws IOException {
            if (in.peek() == JsonToken.NULL) {
                in.nextNull();
                return null;
            }
            return (T) SecurityQuantityTypeProto.valueOf(in.nextString());
        }

        public void write(JsonWriter out, T value) throws IOException {
            out.value(value == null ? null : value.name());
        }
    }

    
    public static Gson getGsonBuilder() {
        return new GsonBuilder()
                .setFieldNamingStrategy(new JsonFieldNamingStrategy())
                .registerTypeAdapter(SecurityQuantityTypeProto.class, new EnumTypeAdapter())
                .registerTypeAdapter(FieldMapEntry.class, new FieldMapEntrySerializationAdaptor())
                .registerTypeAdapter(DecimalValue.DecimalValueProto.class, new DecimalValueSerializationAdaptor())
                .registerTypeAdapter(Uuid.UUIDProto.class, new UUIDSerializationAdapter())
                .registerTypeAdapter(LocalTimestamp.LocalTimestampProto.class, new LocalTimestampSerializationAdapter())
                .setExclusionStrategies(JsonFieldExclusionStrategy.getInstance())
                .setPrettyPrinting()
                .disableHtmlEscaping()
                .create();

        /*
        Currently enums will be serialized as numbers because this is how they're stored. For example, a security proto
        stores the number of the security quantity type proto enum, rather than something more verbose. GSON isn't aware
        of this mapping, so just serializes the number.

        For now we will just serialize numbers. This will lead to a sub-optimal user experience using JSON as they need
        to map on their end. That said, I want to think about how to implement this. The code below *works* but it will
        likely be slow...
         */
//        ((Enum)((PropertyDescriptor) Arrays.stream(Introspector.getBeanInfo(value.getClass()).getPropertyDescriptors()).filter(f -> f.getDisplayName().contains("quantityTyp")).collect(Collectors.toList()).get(0)).getReadMethod().invoke(value)).name()
    }

//    private static final LocalTimestampSerializationAdapter LOCAL_TIMESTAMP_SERIALIZATION_ADAPTER
//            = new LocalTimestampSerializationAdapter();
//    private static final UUIDSerializationAdapter UUID_SERIALIZATION_ADAPTER
//            = new UUIDSerializationAdapter();
//    private static final DecimalValueSerializationAdaptor DECIMAL_VALUE_SERIALIZATION_ADAPTOR
//            = new DecimalValueSerializationAdaptor();


//
//    public static void serializeToJSON(JsonWriter writer, Object object) throws IOException {
//        GeneratedMessageV3 unpacked;
//        System.out.println(object.getClass());
//
//        if(object instanceof BigDecimal) {
//            DecimalValue.DecimalValueProto decimalValueProto = ProtoSerializationUtil.serializeBigDecimal((BigDecimal) object);
//            DECIMAL_VALUE_SERIALIZATION_ADAPTOR.write(writer, decimalValueProto);
//        } else if(object instanceof ZonedDateTime) {
//            LocalTimestamp.LocalTimestampProto timstampProto = ProtoSerializationUtil.serializeTimestamp((ZonedDateTime) object);
//            LOCAL_TIMESTAMP_SERIALIZATION_ADAPTER.write(writer, timstampProto);
//        } else if(object instanceof UUID) {
//            unpacked = serializeUUID((UUID) object);
//        } else if(object instanceof Price) {
//            unpacked = PriceSerializer.getInstance().serialize((Price) object);
//        } else if(object instanceof Security) {
//            unpacked = SecuritySerializer.getInstance().serialize((Security) object);
//        } else if(object instanceof Portfolio) {
//            unpacked = PortfolioSerializer.getInstance().serialize((Portfolio) object);
//        }  else if(object instanceof Strategy) {
//            unpacked = StrategySerializer.getInstance().serialize((Strategy)object);
//        } else if(object instanceof String) {
//            unpacked = StringValue.of(object.toString());
//        }  else {
////            this.toJson(src, typeOfSrc, (Appendable)writer);
////            getGsonBuilder().toJson(object, object.getClass());
//        }
////        if(object instanceof BigDecimal) {
////            unpacked = serializeToJSON()
////        } else if(object instanceof LocalDate) {
////            unpacked =  LOCAL_TIMESTAMP_SERIALIZATION_ADAPTER.write((LocalDate) object);
////        } else if(object instanceof ZonedDateTime) {
////            unpacked = serializeTimestamp((ZonedDateTime) object);
////        } else if(object instanceof UUID) {
////            unpacked = serializeUUID((UUID) object);
////        } else if(object instanceof Price) {
////            unpacked = PriceSerializer.getInstance().serialize((Price) object);
////        } else if(object instanceof Security) {
////            unpacked = SecuritySerializer.getInstance().serialize((Security) object);
////        } else if(object instanceof Portfolio) {
////            unpacked = PortfolioSerializer.getInstance().serialize((Portfolio) object);
////        }  else if(object instanceof Strategy) {
////            unpacked = StrategySerializer.getInstance().serialize((Strategy)object);
////        } else if(object instanceof String) {
////            unpacked = StringValue.of(object.toString());
////        }  else {
////            throw new UnsupportedOperationException("Type is not supported: "+ object.getClass().getName());
////        }
////
////        return Any.pack(unpacked);
//    }
}
