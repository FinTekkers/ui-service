package common.model.security;

import common.model.IRawDataModelObject;

import java.time.Period;
import java.time.ZonedDateTime;
import java.util.UUID;

public class Tenor implements IRawDataModelObject {
    public static Tenor UNKNOWN_TENOR = new Tenor(TenorType.UNKNOWN);
    public static Tenor PERPETUAL_TENOR = new Tenor(TenorType.PERPETUAL);

    private TenorType type;
    private Period tenor;

    public Tenor(TenorType type) {
        this.type = type;
    }

    public Tenor(TenorType type, Period tenor) {
        if(!TenorType.TERM.equals(type)) {
            throw new RuntimeException("Cannot instantiate a tenor with a term unless the TenorType is TERM");
        }

        this.type = type;
        this.tenor = tenor;
    }

    public TenorType getType() {
        return type;
    }

    public Period getTenor() {
        return tenor;
    }

    
    public String getTenorDescription() {
        Period tenor = getTenor();

        return tenor.getYears() > 0 ? tenor.getYears() + "Y"
                : tenor.getMonths() > 0 ? tenor.getMonths() + "M"
                : tenor.getDays() + "D";
    }

    public static Tenor fromTenorDescription(String tenorDescription) {
        return null;
    }

    @Override
    public UUID getID() {
        throw new UnsupportedOperationException();
    }

    @Override
    public ZonedDateTime getValidFrom() {
        throw new UnsupportedOperationException();
    }

    @Override
    public ZonedDateTime getValidTo() {
        throw new UnsupportedOperationException();
    }

    @Override
    public ZonedDateTime getAsOf() {
        throw new UnsupportedOperationException();
    }
}
