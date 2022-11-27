package common.model.security;

import common.model.security.identifier.Identifier;
import common.model.security.identifier.IdentifierType;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.UUID;

/***
 * Generally shouldn't be used except for tests, or absolute emergencies.
 */
public class CashSecurity extends Security {
    public final static CashSecurity USD = new CashSecurity(
            new UUID(1, 1),
            "USD",
            ZonedDateTime.of(1000, 1, 1, 0, 0, 0, 0, ZoneId.of("America/New_York"))
    );

    public final static String ASSET_CLASS = "Cash";
    private final String cashId;

    public CashSecurity(UUID id, String cashId, ZonedDateTime asOf) {
        super(id, cashId, asOf, null);
        this.cashId = cashId;
        this.identifier = new Identifier(IdentifierType.CASH, cashId);
    }

    @Override
    public String getAssetClass() {
        return ASSET_CLASS;
    }

    @Override
    public boolean isCash() {
        return true;
    }

    public String getCashId() {
        return "CASH"+cashId;
    }

    @Override
    public SecurityType getSecurityType() {
        return SecurityType.CASH_SECURITY;
    }

    @Override
    public String getDescription() {
        return this.identifier.getIdentifier();
    }

    @Override
    public ProductType getProductType() {
        return ProductType.CASH;
    }
}
