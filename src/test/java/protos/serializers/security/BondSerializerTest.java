package protos.serializers.security;

import common.models.security.*;
import common.models.security.bonds.FloatingRateNote;
import common.models.security.bonds.TIPSBond;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;

class BondSerializerTest {
    @Test
    public void testBond() {
        BondSecurity bond = new BondSecurity(UUID.randomUUID(), "Issuer", ZonedDateTime.now(),
                CashSecurity.USD);
        setBondFields(bond);

        SecuritySerializer serializer = SecuritySerializer.getInstance();
        SecurityProto proto = serializer.serialize(bond);
        String json = serializer.serializeToJson(proto);
        SecurityProto protoCopy = serializer.deserializeFromJson(json);
        BondSecurity securityCopy = (BondSecurity) serializer.deserialize(protoCopy);

        Assertions.assertEquals(bond, securityCopy);
        Assertions.assertEquals(bond.getCouponFrequency(), securityCopy.getCouponFrequency());
        Assertions.assertEquals(bond.getCouponType(), securityCopy.getCouponType());
        Assertions.assertEquals(bond.getCouponRate(), securityCopy.getCouponRate());
        Assertions.assertEquals(bond.getCouponCurrency(), securityCopy.getCouponCurrency());

        Assertions.assertEquals(bond.getIssueDate(), securityCopy.getIssueDate());
        Assertions.assertEquals(bond.getMaturityDate(), securityCopy.getMaturityDate());
        Assertions.assertEquals(bond.getTenor().getTenor(), securityCopy.getTenor().getTenor());
    }

    private void setBondFields(BondSecurity bond) {
        bond.setIssueDate(LocalDate.now());
        bond.setMaturityDate(LocalDate.now().plusYears(10));
        bond.setFaceValue(BigDecimal.valueOf(1000));
        bond.setCouponFrequency(CouponFrequency.SEMIANNUALLY);
        bond.setCouponType(CouponType.FIXED);
        bond.setCouponRate(BigDecimal.valueOf(.5));
    }

    @Test
    public void testFRN() {
        FloatingRateNote bond = new FloatingRateNote(UUID.randomUUID(), "Issuer", ZonedDateTime.now(),
                CashSecurity.USD);
        setBondFields(bond);
        bond.setCouponType(CouponType.FLOAT);

        SecuritySerializer serializer = SecuritySerializer.getInstance();
        SecurityProto proto = serializer.serialize(bond);
        String json = serializer.serializeToJson(proto);
        SecurityProto protoCopy = serializer.deserializeFromJson(json);
        FloatingRateNote securityCopy = (FloatingRateNote) serializer.deserialize(protoCopy);

        Assertions.assertEquals(bond, securityCopy);
        Assertions.assertEquals(bond.getCouponFrequency(), securityCopy.getCouponFrequency());
        Assertions.assertEquals(bond.getCouponType(), securityCopy.getCouponType());
//        Assertions.assertEquals(bond.getCouponRate(), securityCopy.getCouponRate());
        Assertions.assertEquals(bond.getCouponCurrency(), securityCopy.getCouponCurrency());

        Assertions.assertEquals(bond.getIssueDate(), securityCopy.getIssueDate());
        Assertions.assertEquals(bond.getMaturityDate(), securityCopy.getMaturityDate());
        Assertions.assertEquals(bond.getTenor().getTenor(), securityCopy.getTenor().getTenor());
    }

    @Test
    public void testTIPS() {
        TIPSBond bond = new TIPSBond(UUID.randomUUID(), "Issuer", ZonedDateTime.now(),
                CashSecurity.USD);
        setBondFields(bond);

        SecuritySerializer serializer = SecuritySerializer.getInstance();
        SecurityProto proto = serializer.serialize(bond);
        String json = serializer.serializeToJson(proto);
        SecurityProto protoCopy = serializer.deserializeFromJson(json);
        TIPSBond securityCopy = (TIPSBond) serializer.deserialize(protoCopy);

        Assertions.assertEquals(bond, securityCopy);
        Assertions.assertEquals(bond.getCouponFrequency(), securityCopy.getCouponFrequency());
        Assertions.assertEquals(bond.getCouponType(), securityCopy.getCouponType());
        Assertions.assertEquals(bond.getCouponRate(), securityCopy.getCouponRate());
        Assertions.assertEquals(bond.getCouponCurrency(), securityCopy.getCouponCurrency());

        Assertions.assertEquals(bond.getIssueDate(), securityCopy.getIssueDate());
        Assertions.assertEquals(bond.getMaturityDate(), securityCopy.getMaturityDate());
        Assertions.assertEquals(bond.getTenor().getTenor(), securityCopy.getTenor().getTenor());
    }
}