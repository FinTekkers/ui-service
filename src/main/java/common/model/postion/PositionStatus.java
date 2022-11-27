package common.model.postion;

public enum PositionStatus {
    HYPOTHETICAL("Hypothetical status means a transaction, tax lot or position that may " +
            "never occur. This can be used to understand how potential actions could impact a portfolio"),
    INTENDED("Intended status means a transaction, tax lot or position that is expected to occur" +
            " if nothing changes. For example a fixed income bond that is expected to pay a coupon, or a " +
            "security that is expected to mature in a specific point in the future"),
    EXECUTED("Executed status means a transaction, tax lot or position that is the result of a " +
            "legally binding transaction. ");

    private final String description;

    PositionStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
