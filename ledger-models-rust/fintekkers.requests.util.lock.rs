#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct LockRequestProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    /// Only supports GET
    #[prost(enumeration = "super::RequestOperationTypeProto", tag = "10")]
    pub operation_type: i32,
    #[prost(message, optional, tag = "11")]
    pub node_state: ::core::option::Option<
        super::super::super::models::util::lock::NodeStateProto,
    >,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct LockResponseProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    #[prost(message, optional, tag = "3")]
    pub create_lock_request: ::core::option::Option<LockRequestProto>,
    #[prost(message, optional, tag = "4")]
    pub lock_response: ::core::option::Option<
        super::super::super::models::util::lock::NodeStateProto,
    >,
}
