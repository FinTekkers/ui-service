package common.model.util;

/***
 * Each type of security will have its own quantity type. E.g. bonds will have original face value, and securities
 * can use units.
 *
 */
public enum QuantityType {
    ORIGINAL_FACE_VALUE("Original face value would be used for vanilla bonds as well as reducing face " +
            "value bonds like MBS. When trading MBS you would need to express the traded quantity in the original " +
            "issue par value. Calculators would need to know to look up the security reference data for the " +
            "remaining face value (by leveraging the pool factor)."),

    NOTIONAL("Used for notional based derivatives such as total return swaps. In the case of variable " +
            "notional instruments, this will give the original notional of the instrument, and calculators need to " +
            "know how to adjust the notional based on the appropriate schedule (e.g. an amortizing swap schedule " +
            "vs. a resettable notional)."),

    UNITS("Anything where unit makes contextual sense, such as shares in cash equity.");

    private final String description;

    QuantityType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
