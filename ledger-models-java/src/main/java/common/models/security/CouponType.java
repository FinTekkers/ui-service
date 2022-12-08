package common.models.security;

public enum CouponType {
    FIXED("A fixed payment (generally a % of face/nominal value)"),
    FLOAT("A floating payment tied to a third-party index"),
    ZERO("No coupons are paid (generally interest is embedded in the difference between current price and " +
            "redemption price");

    private final String description;

    CouponType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
