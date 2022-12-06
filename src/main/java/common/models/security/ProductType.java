package common.models.security;

/**
 * The type of security, as modelled in code. This should not be used for business purposes
 * as code might be refactored.
 */
public enum ProductType {
    FRN("FRN", "Floating Rate Note (FRN)"),
    TIPS("TIPS", "Treasury Inflation Protected Security (TIPS)"),
    BILL("Bill", "Treasury Bill"),
    NOTE("Note", "Treasury Note"),
    BOND("Bond", "Treasury Bond"),
    EQUITY("Equity", "Cash Equity"),
    CASH("Cash", "Cash"),
    UNCLASSIFIED("N/A", "Unclassified");

    private final String shortName;
    private final String longName;

    ProductType(String shortName, String longName) {
        this.shortName = shortName;
        this.longName = longName;
    }

    public String getShortName() {
        return shortName;
    }

    public String getLongName() {
        return longName;
    }

    //    public static ProductType from(SecurityTypeProto proto) {
//        switch (proto) {
//            case CASH_SECURITY:
//                return ProductType.CASH_SECURITY;
//            case BOND_SECURITY:
//                return ProductType.BOND_SECURITY;
//            case FLOATING_RATE_BOND_SECURITY:
//                return ProductType.FLOATING_RATE_BOND_SECURITY;
//            case TIPS_BOND_SECURITY:
//                return ProductType.TIPS_BOND_SECURITY;
//            case EQUITY_SECURITY:
//                return ProductType.EQUITY_SECURITY;
//            case UNKNOWN_SECURITY_TYPE:
//                return ProductType.SECURITY;
//            default:
//                throw new RuntimeException("No SecurityType found for "+ proto.name());
//        }
//    }
//
//    public static ProductType from(String securityType) {
//        return ProductType.valueOf(securityType);
//    }
}
