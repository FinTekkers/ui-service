///   uint32 scale = 1;
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct DecimalValueProto {
    /// This is a string representation of a float number.
    /// This will be deprecated in the future for a more space efficient approach
    #[prost(string, tag = "10")]
    pub arbitrary_precision_value: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct LocalDateProto {
    #[prost(uint32, tag = "1")]
    pub year: u32,
    #[prost(uint32, tag = "2")]
    pub month: u32,
    #[prost(uint32, tag = "3")]
    pub day: u32,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct LocalTimestampProto {
    #[prost(message, optional, tag = "1")]
    pub timestamp: ::core::option::Option<::prost_types::Timestamp>,
    /// TODO: Need to decide how to model this: <https://en.wikipedia.org/wiki/List_of_time_zone_abbreviations>
    /// <https://docs.oracle.com/javase/8/docs/api/java/time/ZoneId.html>
    #[prost(string, tag = "2")]
    pub time_zone: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct UuidProto {
    #[prost(bytes = "vec", tag = "1")]
    pub raw_uuid: ::prost::alloc::vec::Vec<u8>,
}
