package common.model.security.bonds;

import common.model.security.BondSecurity;
import common.model.security.CashSecurity;
import common.model.security.Security;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.UUID;

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
