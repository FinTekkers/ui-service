#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct PriceProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    /// Primary Key
    #[prost(message, optional, tag = "5")]
    pub uuid: ::core::option::Option<super::util::UuidProto>,
    #[prost(message, optional, tag = "6")]
    pub as_of: ::core::option::Option<super::util::LocalTimestampProto>,
    #[prost(bool, tag = "7")]
    pub is_link: bool,
    #[prost(message, optional, tag = "10")]
    pub price: ::core::option::Option<super::util::DecimalValueProto>,
    #[prost(message, optional, tag = "11")]
    pub security: ::core::option::Option<super::security::SecurityProto>,
}
