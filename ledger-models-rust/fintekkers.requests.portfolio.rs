#[derive(Clone, PartialEq, ::prost::Message)]
pub struct QueryPortfolioRequestProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    #[prost(message, repeated, tag = "21")]
    pub uuids: ::prost::alloc::vec::Vec<super::super::models::util::UuidProto>,
    #[prost(message, optional, tag = "22")]
    pub search_portfolio_input: ::core::option::Option<
        super::super::models::position::PositionFilterProto,
    >,
}
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct CreatePortfolioRequestProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    #[prost(message, optional, tag = "20")]
    pub create_portfolio_input: ::core::option::Option<
        super::super::models::portfolio::PortfolioProto,
    >,
}
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct CreatePortfolioResponseProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    #[prost(message, optional, tag = "20")]
    pub create_portfolio_request: ::core::option::Option<CreatePortfolioRequestProto>,
    #[prost(message, repeated, tag = "30")]
    pub portfolio_response: ::prost::alloc::vec::Vec<
        super::super::models::portfolio::PortfolioProto,
    >,
}
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct QueryPortfolioResponseProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    #[prost(message, optional, tag = "20")]
    pub query_portfolio_request: ::core::option::Option<QueryPortfolioRequestProto>,
    #[prost(message, repeated, tag = "30")]
    pub portfolio_response: ::prost::alloc::vec::Vec<
        super::super::models::portfolio::PortfolioProto,
    >,
}
