#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct CreatePriceRequestProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    #[prost(message, optional, tag = "20")]
    pub create_price_input: ::core::option::Option<
        super::super::models::price::PriceProto,
    >,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct QueryPriceRequestProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    #[prost(message, repeated, tag = "21")]
    pub uu_ids: ::prost::alloc::vec::Vec<super::super::models::util::UuidProto>,
    #[prost(message, optional, tag = "22")]
    pub search_price_input: ::core::option::Option<
        super::super::models::position::PositionFilterProto,
    >,
    #[prost(message, optional, tag = "23")]
    pub as_of: ::core::option::Option<super::super::models::util::LocalTimestampProto>,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct QueryPriceResponseProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    #[prost(message, optional, tag = "20")]
    pub query_price_request: ::core::option::Option<QueryPriceRequestProto>,
    #[prost(message, repeated, tag = "30")]
    pub price_response: ::prost::alloc::vec::Vec<
        super::super::models::price::PriceProto,
    >,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct CreatePriceResponseProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    #[prost(message, optional, tag = "20")]
    pub create_price_request: ::core::option::Option<CreatePriceRequestProto>,
    #[prost(message, repeated, tag = "30")]
    pub price_response: ::prost::alloc::vec::Vec<
        super::super::models::price::PriceProto,
    >,
}
