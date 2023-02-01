package common.models.security;

import common.models.security.bonds.FloatingRateNote;
import common.models.security.bonds.TIPSBond;
import fintekkers.models.security.SecurityTypeProto;

/**
 * The type of security, as modelled in code. This should not be used for business purposes
 * as code might be refactored.
 */
public enum SecurityType {
    CASH_SECURITY(CashSecurity.class, SecurityTypeProto.CASH_SECURITY),
    EQUITY_SECURITY(EquitySecurity.class, SecurityTypeProto.EQUITY_SECURITY),
    BOND_SECURITY(BondSecurity.class, SecurityTypeProto.BOND_SECURITY),
    FRN(FloatingRateNote.class, SecurityTypeProto.FRN),
    TIPS(TIPSBond.class, SecurityTypeProto.TIPS),
    SECURITY(Security.class, SecurityTypeProto.UNKNOWN_SECURITY_TYPE);

    private final Class clazz;
    private final SecurityTypeProto securityProtoValue;

    SecurityType(Class clazz, SecurityTypeProto securityProtoValue) {
        this.clazz = clazz;
        this.securityProtoValue = securityProtoValue;
    }

    public Class getSecurityTypeClass() {
        return clazz;
    }

    public SecurityTypeProto getSecurityProtoValue() {
        return securityProtoValue;
    }

    public static SecurityType from(SecurityTypeProto proto) {
        switch (proto) {
            case CASH_SECURITY:
                return SecurityType.CASH_SECURITY;
            case BOND_SECURITY:
                return SecurityType.BOND_SECURITY;
            case FRN:
                return SecurityType.FRN;
            case TIPS:
                return SecurityType.TIPS;
            case EQUITY_SECURITY:
                return SecurityType.EQUITY_SECURITY;
            case UNKNOWN_SECURITY_TYPE:
                return SecurityType.SECURITY;
            default:
                throw new RuntimeException("No SecurityType found for "+ proto.name());
        }
    }

    public static SecurityType from(String securityType) {
        return SecurityType.valueOf(securityType);
    }
}
