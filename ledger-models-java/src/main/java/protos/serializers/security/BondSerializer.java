package protos.serializers.security;

import common.models.security.*;
import common.models.security.bonds.FloatingRateNote;
import common.models.security.bonds.TIPSBond;
import fintekkers.models.security.CouponFrequencyProto;
import fintekkers.models.security.CouponTypeProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.security.SecurityTypeProto;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.time.ZonedDateTime;
import java.util.UUID;

public class BondSerializer {

    public Security deserializeBondSecurity(SecurityProto proto, UUID id, ZonedDateTime asOf, String issuer, CashSecurity settlementCurrency) {
        final BondSecurity bondSecurity = initiatlize(proto, id, asOf, issuer, settlementCurrency);

        if(proto.hasCouponRate())
            bondSecurity.setCouponRate(ProtoSerializationUtil.deserializeBigDecimal(proto.getCouponRate()));

        if(proto.hasFaceValue())
            bondSecurity.setFaceValue(ProtoSerializationUtil.deserializeBigDecimal(proto.getFaceValue()));

        if(proto.hasDatedDate())
            bondSecurity.setDatedDate(ProtoSerializationUtil.deserializeLocalDate(proto.getDatedDate()));

        if(proto.hasIssueDate())
            bondSecurity.setIssueDate(ProtoSerializationUtil.deserializeLocalDate(proto.getIssueDate()));

        if(proto.hasMaturityDate())
            bondSecurity.setMaturityDate(ProtoSerializationUtil.deserializeLocalDate(proto.getMaturityDate()));

        if(!CouponTypeProto.UNKNOWN_COUPON_TYPE.equals(proto.getCouponType()))
            bondSecurity.setCouponType(CouponType.valueOf(proto.getCouponType().name()));

        if(!CouponFrequencyProto.UNKNOWN_COUPON_FREQUENCY.equals(proto.getCouponFrequency()))
            bondSecurity.setCouponFrequency(CouponFrequency.valueOf(proto.getCouponFrequency().name()));

        return bondSecurity;
    }

    
    private BondSecurity initiatlize(SecurityProto proto, UUID id, ZonedDateTime asOf,
                                     String issuer, CashSecurity settlementCurrency) {
        SecurityTypeProto securityType = proto.getSecurityType();

        switch (securityType) {
            case BOND_SECURITY:
                return new BondSecurity(id, issuer, asOf, settlementCurrency);
            case TIPS:
                return new TIPSBond(id, issuer, asOf, settlementCurrency);
            case FRN:
                return new FloatingRateNote(id, issuer, asOf, settlementCurrency);
            default:
                throw new RuntimeException(String.format("The security type is not supported %s", securityType.name()));
        }
    }

}
