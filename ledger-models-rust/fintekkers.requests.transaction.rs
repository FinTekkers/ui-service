#[derive(Clone, PartialEq, ::prost::Message)]
pub struct QueryTransactionRequestProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    /// The list of UUIDs to return
    #[prost(message, repeated, tag = "21")]
    pub uuids: ::prost::alloc::vec::Vec<super::super::models::util::UuidProto>,
    /// A list of position filters that will filter securities that match.
    #[prost(message, optional, tag = "22")]
    pub search_transaction_input: ::core::option::Option<
        super::super::models::position::PositionFilterProto,
    >,
}
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct QueryTransactionResponseProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    #[prost(message, optional, tag = "20")]
    pub create_transaction_request: ::core::option::Option<QueryTransactionRequestProto>,
    #[prost(message, repeated, tag = "30")]
    pub transaction_response: ::prost::alloc::vec::Vec<
        super::super::models::transaction::TransactionProto,
    >,
}
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct CreateTransactionRequestProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    #[prost(message, optional, tag = "20")]
    pub create_transaction_input: ::core::option::Option<
        super::super::models::transaction::TransactionProto,
    >,
}
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct CreateTransactionResponseProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    #[prost(message, optional, tag = "20")]
    pub create_transaction_request: ::core::option::Option<
        CreateTransactionRequestProto,
    >,
    #[prost(message, optional, tag = "30")]
    pub transaction_response: ::core::option::Option<
        super::super::models::transaction::TransactionProto,
    >,
}
