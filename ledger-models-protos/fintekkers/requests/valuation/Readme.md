# Valuation Request / Response documentation

Valuations are meant to be stateless in nature. In the near term, there is a big assumption that the caller provides
ALL the inputs for valuation. This is beneficial in that valuation services can be implemented in a stateless manner. 
In some future state we may support 'links' so that the valuation service can perform the resolution of UUIDs into 
fully fledged objects.

# Use Cases

## Metrics

See Measure.java for a full list. TODO: Expose this via a 'documentation-service'? Each metric should be associated 
with a service so that we know where to get it from. That information would be used by the broker service to route 
requests.

Following metrics would be from the ledger service: DIRECTED_QUANTITY, UNADJUSTED_COST_BASIS.

Following metrics are to be implemented by the valuation service:

MARKET_VALUE, ADJUSTED_COST_BASIS

### MARKET_VALUE

a.k.a. mark-to-market.

#### CashEquity

Price * Quantity

For now, assume that stock splits will be applied to security reference data and positions.

#### CashSecurity

1 * Quantity

#### BondSecurity

The logic in Java to calculate:

`private BigDecimal calculateMarketValue(Position position, Price price, BondSecurity bondSecurity) {
    //Need to scale the directed quantity to number of bond 'units'
    final BigDecimal directedQuantity = position.getMeasure(Measure.DIRECTED_QUANTITY)
            .divide(bondSecurity.getFaceValue(), RoundingMode.HALF_UP);

    //Scale the price (e.g. $100 price on $1000 face value, need to increase the price to $1000
    final BigDecimal scaledPrice = price.getPrice().multiply(bondSecurity.getPriceScaleFactor());

    return scaledPrice.multiply(directedQuantity);
}`

Inputs required:
* The security: Security.getFaceValue; Security.getPriceScaleFactor
* The price Price.getPrice
* The position: DIRECTED_QUANTITY

##### TIPSBond (FRN)

NOTE, the security's principal will be adjusted on resets of CPI. This service 
doesn't need to know whether it's receiving original principal or adjusted principal.

No action required.

### CURRENT_YIELD

#### BondSecurity
Given the price and coupon, calculate the current yield. 

Current Yield = Annual Coupon ÷ Bond Price
https://www.wallstreetprep.com/knowledge/current-yield/

Inputs required:
* The security: Security.getCouponRate; Security.getCouponFrequency
* The price Price.getPrice

#### CashEquity

Placeholder. Down the line we could approximate annual coupon as TTM dividends.

For now, would just return a NaN.

### YIELD_TO_MATURITY

NOTE: This will require implementation of discounting, and cashflow scheduling. 

Dave can create a unit test for this. Stage 1: Simple discounting. Stage 2: Integrate 
holiday calendars and day count conventions.

https://www.investopedia.com/terms/y/yieldtomaturity.asp
