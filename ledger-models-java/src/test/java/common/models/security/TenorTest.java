package common.models.security;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.Period;

class TenorTest {
    @Test
    public void testDescriptionIsReversible() {
        LocalDate today = LocalDate.now();
        LocalDate moreThanOneYear = today.minusYears(1).minusMonths(1);
        Period period = Period.between(moreThanOneYear, today);

        Tenor tenor = new Tenor(TenorType.TERM, period);

        Assertions.assertEquals("1Y1M", tenor.getTenorDescription());
    }
}