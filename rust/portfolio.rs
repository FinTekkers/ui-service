#[derive(Clone, PartialEq, ::prost::Message)]
pub struct PortfolioProto {
    /// 1-4 reserved
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
    #[prost(string, tag = "10")]
    pub portfolio_name: ::prost::alloc::string::String,
}
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct PortfolioRequestProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    #[prost(enumeration = "super::util::RequestOperationTypeProto", tag = "10")]
    pub operation_type: i32,
    #[prost(message, optional, tag = "20")]
    pub create_portfolio_input: ::core::option::Option<PortfolioProto>,
    #[prost(message, repeated, tag = "21")]
    pub uuids: ::prost::alloc::vec::Vec<super::util::UuidProto>,
    #[prost(message, optional, tag = "22")]
    pub search_portfolio_input: ::core::option::Option<
        super::position::PositionFilterProto,
    >,
}
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct PortfolioResponseProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    #[prost(message, optional, tag = "20")]
    pub create_portfolio_request: ::core::option::Option<PortfolioRequestProto>,
    #[prost(message, repeated, tag = "30")]
    pub portfolio_response: ::prost::alloc::vec::Vec<PortfolioProto>,
}
