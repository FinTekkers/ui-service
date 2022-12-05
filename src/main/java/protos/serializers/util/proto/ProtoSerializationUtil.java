package protos.serializers.util.proto;

import com.google.protobuf.*;
import common.model.portfolio.Portfolio;
import common.model.price.Price;
import common.model.protoUtils.DecimalValue.DecimalValueProto;
import common.model.protoUtils.LocalDate.LocalDateProto;
import common.model.protoUtils.LocalTimestamp.LocalTimestampProto;
import common.model.protoUtils.Uuid.UUIDProto;
import common.model.protos.*;
import common.model.security.Security;
import common.model.security.identifier.Identifier;
import common.model.strategy.Strategy;
import protos.serializers.portfolio.PortfolioSerializer;
import protos.serializers.price.PriceSerializer;
import protos.serializers.security.IdentifierSerializer;
import protos.serializers.security.SecuritySerializer;
import protos.serializers.strategy.StrategySerializer;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.nio.ByteBuffer;
import java.time.*;
import java.util.UUID;

public class ProtoSerializationUtil {

    public static GeneratedMessageV3 serialize(Object object) {
        GeneratedMessageV3 unpacked;
        if(object instanceof BigDecimal) {
            unpacked = serializeBigDecimal((BigDecimal) object);
        } else if(object instanceof LocalDate) {
            unpacked =  serializeLocalDate((LocalDate) object);
        } else if(object instanceof ZonedDateTime) {
            unpacked = serializeTimestamp((ZonedDateTime) object);
        } else if(object instanceof UUID) {
            unpacked = serializeUUID((UUID) object);
        } else if(object instanceof Price) {
            unpacked = PriceSerializer.getInstance().serialize((Price) object);
        } else if(object instanceof Security) {
            unpacked = SecuritySerializer.getInstance().serialize((Security) object);
        } else if(object instanceof Portfolio) {
            unpacked = PortfolioSerializer.getInstance().serialize((Portfolio) object);
        }  else if(object instanceof Strategy) {
            unpacked = StrategySerializer.getInstance().serialize((Strategy)object);
        } else if(object instanceof String) {
            unpacked = StringValue.of(object.toString());
        } else if(object instanceof Identifier) {
            unpacked = IdentifierSerializer.getInstance().serialize((Identifier) object);
        } else if(object instanceof IdentifierProto) {
            unpacked = (GeneratedMessageV3) object;
        } else {
            throw new UnsupportedOperationException("Type is not supported: "+ object.getClass().getName());
        }

        return unpacked;
    }

    public static Any serializeToAny(Object object) {
        GeneratedMessageV3 unpacked = serialize(object);
        return Any.pack(unpacked);
    }

    public static Object deserialize(Any any) {
        try {
            if (any.is(DecimalValueProto.class)) {
                DecimalValueProto decimalValueProto = any.unpack(DecimalValueProto.class);
                return deserializeBigDecimal(decimalValueProto);
            } else if (any.is(LocalDateProto.class)) {
                LocalDateProto localDateProto = any.unpack(LocalDateProto.class);
                return deserializeLocalDate(localDateProto);
            } else if (any.is(LocalTimestampProto.class)) {
                LocalTimestampProto timestamp = any.unpack(LocalTimestampProto.class);
                return deserializeTimestamp(timestamp);
            } else if (any.is(UUIDProto.class)) {
                UUIDProto uuid = any.unpack(UUIDProto.class);
                return deserializeUUID(uuid);
            } else if(any.is(PriceProto.class)) {
                return PriceSerializer.getInstance().deserialize(any.unpack(PriceProto.class));
            } else if(any.is(SecurityProto.class)) {
                return SecuritySerializer.getInstance().deserialize(any.unpack(SecurityProto.class));
            } else if(any.is(PortfolioProto.class)) {
                return PortfolioSerializer.getInstance().deserialize(any.unpack(PortfolioProto.class));
            } else if(any.is(StrategyProto.class)) {
                return StrategySerializer.getInstance().deserialize(any.unpack(StrategyProto.class));
            } else if(any.is(StringValue.class)) {
                return any.unpack(StringValue.class).getValue();
            } else if(any.is(IdentifierProto.class)) {
                IdentifierProto identifierProto = any.unpack(IdentifierProto.class);
                return IdentifierSerializer.getInstance().deserialize(identifierProto);
            } else {
                throw new UnsupportedOperationException("Type is not supported: "+ any.getTypeUrl());
            }
        } catch (InvalidProtocolBufferException e) {
            throw new RuntimeException(e);
        }
    }

    public static UUIDProto serializeUUID(UUID uuid) {
        ByteBuffer bb = ByteBuffer.wrap(new byte[16]);
        bb.putLong(uuid.getMostSignificantBits());
        bb.putLong(uuid.getLeastSignificantBits());
        return UUIDProto.newBuilder().setRawUuid(ByteString.copyFrom(bb.array())).build();
    }

    public static UUID deserializeUUID(UUIDProto rawUUID) {
        ByteBuffer bb = ByteBuffer.wrap(rawUUID.getRawUuid().toByteArray());
        long firstLong = bb.getLong();
        long secondLong = bb.getLong();
        return new UUID(firstLong, secondLong);
    }

    public static DecimalValueProto serializeBigDecimal(BigDecimal quantity) {
        return DecimalValueProto.newBuilder()
                .setScale(quantity.scale())
                .setPrecision(quantity.precision())
                .setValue(ByteString.copyFrom(quantity.unscaledValue().toByteArray()))
                .build();
    }

    public static BigDecimal deserializeBigDecimal(DecimalValueProto quantity) {
        if(quantity == null)
            return null;

        java.math.MathContext mc = new java.math.MathContext(quantity.getPrecision());
        return new BigDecimal(
                new BigInteger(quantity.getValue().toByteArray()),
                quantity.getScale(),
                mc);
    }

    public static LocalDate deserializeLocalDate(LocalDateProto date) {
        return LocalDate.of(date.getYear(), date.getMonth(), date.getDay());
    }


    public static LocalDateProto serializeLocalDate(LocalDate date) {
        return LocalDateProto.newBuilder()
                .setYear(date.getYear())
                .setMonth(date.getMonthValue())
                .setDay(date.getDayOfMonth())
                .build();
    }

    public static ZonedDateTime deserializeTimestamp(LocalTimestampProto ts) {
        ZoneId zoneId = ZoneId.of(ts.getTimeZone());
        LocalDateTime localDateTime = Instant.ofEpochSecond(ts.getTimestamp().getSeconds(), ts.getTimestamp().getNanos())
                .atZone(ZoneId.systemDefault())
                .toLocalDateTime();

        ZonedDateTime zonedDateTime = ZonedDateTime.of(localDateTime, zoneId);

        System.out.println(zoneId);
        System.out.println(localDateTime);

        return zonedDateTime;
    }

    public static LocalTimestampProto serializeTimestamp(ZonedDateTime ts) {
        Instant instant = ts.toInstant();

        return LocalTimestampProto.newBuilder()
            .setTimeZone(ts.getZone().getId())
            .setTimestamp(
                    Timestamp.newBuilder().setSeconds(instant.getEpochSecond())
                            .setNanos(instant.getNano()).build()
            )
            .build();
    }

}
