# Overview

A quick primer on timestamps in Fintekkers.

# Background

Many languages use a concept called epoch seconds in their languages. In languages 
like C++, Java and Rust this generally translates to the number of milliseconds passed 
since Jan 1st 1970. 

The reason for this approach is that a single number can be used to represent a 
time, rather than having to have many fields (year, month, day, hour, minute, etc). As 
timestamps needed to become more precise some number seconds since 1970, and a second field
for nanoseconds. 

# Timestamps, from a business perspective

Timestamps are local to a specific geography. Locale is an important concept in financial 
systems, as knowing when a price ticked is very important. Passing around timestamps without 
explicitly noting the timestamp can be dangerous. Most systems try to coerce everyone to use 
UTC or a single region. This strips away information which we do not want to do.

Therefore, we will use seconds, nanoseconds and timezone to convey times.

# Timestamps, serialized

When serializing, the seconds and nanos will represent the time IN UTC!!! As well as the timezone
to be able to offset the time appropriately.

Note, some languages/systems/versions may not support nanos. When they only support millis, that needs 
to be converted into nanos. Within the Java implementation you may see tructatedTo(MILLIS) to avoid version 
issues breaking tests.

# Timestamp approach per language

## Java

ZonedDateTime

## Rust

@Sam

## etc

?

