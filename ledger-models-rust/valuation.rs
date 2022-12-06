#[derive(Clone, PartialEq, ::prost::Message)]
pub struct ValuationRequestProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    /// Only supports GET, since there is no backing store, so CREATE isn't relevant. SEARCH isn't relevant either.
    /// VALIDATE could be implemented later, e.g. if the caller wants to check their inputs are correct.
    #[prost(enumeration = "super::util::RequestOperationTypeProto", tag = "10")]
    pub operation_type: i32,
    #[prost(message, optional, tag = "20")]
    pub security_input: ::core::option::Option<super::security::SecurityProto>,
    #[prost(message, optional, tag = "21")]
    pub position_input: ::core::option::Option<super::position::PositionFilterProto>,
    #[prost(message, optional, tag = "22")]
    pub price_input: ::core::option::Option<super::price::PriceProto>,
}
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct ValuationResponseProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    #[prost(message, optional, tag = "20")]
    pub valuation_request: ::core::option::Option<ValuationRequestProto>,
    #[prost(message, repeated, tag = "30")]
    pub measure_results: ::prost::alloc::vec::Vec<super::position::MeasureMapEntry>,
}
