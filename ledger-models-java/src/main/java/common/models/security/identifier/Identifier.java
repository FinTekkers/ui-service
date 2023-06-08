package common.models.security.identifier;

import common.models.IRawDataModelObject;

import java.io.Serializable;
import java.time.ZonedDateTime;
import java.util.UUID;

public class Identifier implements Serializable, IRawDataModelObject, Comparable {
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

    @Override
    public int compareTo(Object o) {
        if(o == null)
            return -1;

        if(o instanceof  Identifier) {
            Identifier other = (Identifier) o;

            if(getIdentifierType() == other.getIdentifierType() && getIdentifier().equals(other.getIdentifier()))
                return 0;
        }

        return -1;
    }
}
