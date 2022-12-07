package common.models;

import java.time.ZonedDateTime;
import java.util.UUID;

/***
 * The core of this object is to define how bi-temporal timestamps are managed. See method definitions for details.
 *
 * An example of an object that is later backdated:
 *
 * TXN 1. V1
 *     validFrom = 14:01:00.000
 *     validTo = NULL
 *     asOf = 14:01:00.000
 *
 * After the edit:
 *
 * TXN 1. V2
 *     validFrom = 14:01:00.000
 *     validTo = 14:02:00.000
 *     asOf = 14:01:00.000
 *
 * TXN 2. V1
 *     validFrom = 14:02:00.000
 *     validTo = NULL
 *     asOf = 14:02:00.000
 */
public abstract class RawDataModelObject implements IRawDataModelObject {
    /**
     * These fields represent what is required for a record to be considered
     * unique. A UUID by itself identifies a unique business record, but not
     * a specific version of that record.
     */
    protected UUID id;
    private final ZonedDateTime validFrom;
    private ZonedDateTime validTo;
    private ZonedDateTime asOf;

    /**
     * Defines whether this record has been persisted.
     */
    boolean isPersisted;

    public RawDataModelObject(UUID id, ZonedDateTime asOf) {
        this.id = id;
        this.validFrom = ZonedDateTime.now();
        this.validTo = null;
        this.asOf = asOf;
        this.isPersisted = false;
    }

    public void setIsPersisted(boolean isPersisted) {
        this.isPersisted = isPersisted;
    }

    public boolean isPersisted() {
        return isPersisted;
    }

    @Override
    public UUID getID() {
        return id;
    }

    /***
     * ZonedDateTime objects are essentially wrappers around the LocalDateTime which
     * store offsets based on the timezone.
     *
     * VALID FROM / VALID TO:
     *      * These are used to manage system timestamps. I.e. these are timestamps when
     *      data is received.
     */
    @Override
    public ZonedDateTime getValidFrom() {
        return this.validFrom;
    }
    @Override
    public ZonedDateTime getValidTo() {
        return this.validTo;
    }

    public void setValidTo(ZonedDateTime newValidTo) {
        this.validTo = newValidTo;
    }

    /***
     * AS OF:
     *      * This is the business timestamp that this data was created. For now just
     *      using a single timestamp.
     */
    @Override
    public ZonedDateTime getAsOf() {
        return this.asOf;
    }

    public void setAsOf(ZonedDateTime asOf) {
        this.asOf = asOf;
    }
}

