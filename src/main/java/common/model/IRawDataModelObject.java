package common.model;

import java.io.Serializable;
import java.time.ZonedDateTime;
import java.util.UUID;

public interface IRawDataModelObject extends Serializable {
    UUID getID();

    ZonedDateTime getValidFrom();

    ZonedDateTime getValidTo();

    ZonedDateTime getAsOf();
}
