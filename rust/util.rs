#[derive(Clone, PartialEq, ::prost::Message)]
pub struct DecimalValueProto {
    #[prost(uint32, tag = "1")]
    pub scale: u32,
    #[prost(uint32, tag = "2")]
    pub precision: u32,
    #[prost(bytes = "vec", tag = "3")]
    pub value: ::prost::alloc::vec::Vec<u8>,
}
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct LocalDateProto {
    #[prost(uint32, tag = "1")]
    pub year: u32,
    #[prost(uint32, tag = "2")]
    pub month: u32,
    #[prost(uint32, tag = "3")]
    pub day: u32,
}
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct LocalTimestampProto {
    #[prost(message, optional, tag = "1")]
    pub timestamp: ::core::option::Option<::prost_types::Timestamp>,
    /// TODO: Need to decide how to model this: <https://en.wikipedia.org/wiki/List_of_time_zone_abbreviations>
    /// <https://docs.oracle.com/javase/8/docs/api/java/time/ZoneId.html>
    #[prost(string, tag = "2")]
    pub time_zone: ::prost::alloc::string::String,
}
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct UuidProto {
    #[prost(bytes = "vec", tag = "1")]
    pub raw_uuid: ::prost::alloc::vec::Vec<u8>,
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum RequestOperationTypeProto {
    UnknownOperation = 0,
    Validate = 1,
    Create = 2,
    Get = 3,
    Search = 4,
}
impl RequestOperationTypeProto {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            RequestOperationTypeProto::UnknownOperation => "UNKNOWN_OPERATION",
            RequestOperationTypeProto::Validate => "VALIDATE",
            RequestOperationTypeProto::Create => "CREATE",
            RequestOperationTypeProto::Get => "GET",
            RequestOperationTypeProto::Search => "SEARCH",
        }
    }
}
