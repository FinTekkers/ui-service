package common.model.security;

import common.model.util.QuantityType;

import java.time.ZonedDateTime;
import java.util.UUID;

public class EquitySecurity extends Security {
    public final static String ASSET_CLASS = "Equity";

    public EquitySecurity(UUID id, String issuer,
                          ZonedDateTime asOf, CashSecurity settlementSecurity) {
        super(id, issuer, asOf, settlementSecurity);
    }

    @Override
    public String getAssetClass() {
        return ASSET_CLASS;
    }

    @Override
    public QuantityType getQuantityType() {
        return QuantityType.UNITS;
    }

    @Override
    public SecurityType getSecurityType() {
        return SecurityType.EQUITY_SECURITY;
    }

    @Override
    public ProductType getProductType() {
        return ProductType.EQUITY;
    }
}
