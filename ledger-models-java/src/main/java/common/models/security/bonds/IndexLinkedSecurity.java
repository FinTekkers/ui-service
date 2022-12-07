package common.models.security.bonds;

import common.models.security.Security;

/**
 * An interface to indicate a security has a reference index. Examples are:
 *  * Floating Rate Notes
 *  * TIPS Bonds
 *
 *  Eventually may also be leveraged for things like Credit Default Swaps, Interest Rate Swaps, and so on. Will
 *  likely need to refactor.
 */
public interface IndexLinkedSecurity {
    Security getIndex();
    void setIndex(Security index);
}
