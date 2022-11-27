package common.model.security.identifier;

import common.model.IRawDataModelObject;

import java.io.Serializable;
import java.time.ZonedDateTime;
import java.util.UUID;

public class Identifier implements Serializable, IRawDataModelObject {
    private final IdentifierType identifierType;
    private final String identifier;

    public Identifier(IdentifierType identifierType, String id) {
        this.identifierType = identifierType;
        this.identifier = id;
    }

    public IdentifierType getIdentifierType() {
        return identifierType;
    }

    public String getIdentifier() {
        return identifier;
    }

    @Override
    public int hashCode() {
        return identifier.hashCode();
    }

    @Override
    public boolean equals(Object other) {
        if(other instanceof Identifier) {
            return getIdentifier().equals(((Identifier)other).getIdentifier()) &&
                    getIdentifierType().equals(((Identifier)other).getIdentifierType());
        } else {
            return false;
        }
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

    @Override
    public String toString() {
        return identifierType + ":"+ identifier;
    }
}
