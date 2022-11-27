# Overview

See the contents of the TransactionModel.pdf file for mental models on the below.

# Linking 

The link concept has some specific fields:
* ID (UUID)
* AsOf timestamp (ZonedDateTime)
* ValidFrom
* ValidTo

# Semantic Meaning

## ID & AsOf

This means the link is for a specific ID which is unique in the system.

The AsOf date refers to the state of that object at a specific 
business timestamp. 

Initially that timestamp must be exact. Over time, it may be allowed
for range queries.

## ID & AsOf & ValidX

When including validto/validfrom it refers to a very specific version.

Again it may allow range queries in the future.

# Examples

Let's assume, in the example below, that this is a US Treasury bond with face value
of $1000 and price of $100.


When you buy 100 bond, you need a transaction ID that corresponds to the trade that the
user will recognize. Imagine this was a voice-executed trade and the trader says '100, Done at $100'.
At that point they are thinking about purchasing bonds, and there is an implicit understanding that
cash will be taken from them in return. Additionally, there are other implicit assumptions like:

* The bond will pay me a coupon of 3% per year
* The bond will return 100x$1000 at maturity
* The bond will disappear from my balance sheet at that future moment in time.

There are also other more nuanced assumptions about probabilistic outcomes. If this were a credit bond
there might be an implicit assumption that the coupon might not be paid, or that the
principal may not be returned at the end because of default. The difficult thing in financial systems
is to decide which items to model explicitly, vs. implicitly.

We'll assume it's a 10Y credit bond

## Buy 100 bond, as of today

| TransactionID | Security | Amount       | AsOfDate   | ValidFrom  | ValidTo |
|---------------|----------|--------------|------------|------------|---------|
| 123           | Bond     | 100 x $1000  | 10/10/2022 | 10/10/2022 | MAX     |
| 234           | Cash     | -100,000     | 10/10/2022 | 10/10/2022 | MAX    |
| 345           | Bond     | -100 x $1000 | 10/10/2032 | 10/10/2022 | MAX    |
| 456           | Cash     | +100,000     | 10/10/2032 | 10/10/2022 | MAX    |

Note that the last 2 transactions are future-dated to the maturity date of the trade.

Each of these 4 transactions will be written to the database. The tree hierarchy will look like this:

* 123
  * 234
  * 345
    * 456

Do we need to separate cash impact transactions from non-cash impact transactions? For now, let's assume not. We 
can get the same query speed by looking at the transaction type. That hints at needing an index for transaction type too.

Option 1:
* Transaction has child transactions that can be nested. 
* E.g. the 123 transaction has 2 direct transactions. One of those 
children (345) as another child, its cash impact (456)
* Pros: simple data model; easier to implement the link concept
* Cons: cash impacts could become very numerous 

Option 2:
* Separate the cash impact from non-cash impact.
* E.g. 123 has 2 links, one to the cash, one to the mature transaction
* Pros: ?
* Cons: More complex implementation

Let's go with option 1. That means reversing some of the work we did to make parent/child relationships
separate to cash impacts. So therefore the links would be:

Transaction123 serialized object:
* Can serialize the full tree structure, larger objects
* Can serialize using links

Links mean that objects are inherently tied to a 'sink' of some kind. 

Sinks are well known and can be grabbed from anywhere from static classes. This will require more stringent unit vs. 
integration test separation as unit tests will not have an external sink, but integration tests would (e.g. local database). 
Starting to get industrial with these decisions!

### Loading the links

When loading links, one will have to provide the asOf date. In stage one we could force
this to be exact. 

In later stages the asof date can be inferred to be the record with the timestamp closest (but less)
than the asOf date. This would require range lookups in the database. 

Transaction 123
* child transactions
  * IFinancialObject - islink(?)
    * <link> 234 ; asOf 10/10/2022
    * <link> 345 ; asOf 10/10/2032
        * <link> 456 ; asOf 10/10/2032
    
Does this turn into a recursive lookup pattern in the database for deeply nested transactions?    


## Buy 100 bond, as of maturity date

The data would look exactly the same as above. Except only the firs

## Buy 100 bond, bond defaults

# Immutability, And Edits

When making edits, the client has to create new versions, meaning everything is immutable. An 'edit'
is inferred by re-using the same UUID

![](../../../../../../../../../Desktop/Screen Shot 2022-10-11 at 7.58.37 AM.png)