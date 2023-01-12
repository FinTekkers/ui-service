#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct NodeStateProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    /// Placeholder, will change
    #[prost(string, tag = "3")]
    pub partition: ::prost::alloc::string::String,
    /// Currently a URL, will change
    #[prost(string, tag = "4")]
    pub end_point: ::prost::alloc::string::String,
    /// The last time a node was seen
    #[prost(message, optional, tag = "5")]
    pub last_seen: ::core::option::Option<super::LocalTimestampProto>,
    /// Whether the lock is expired or not (owned by the lock-service)
    #[prost(bool, tag = "6")]
    pub is_expired: bool,
}
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
    pub node_state: ::core::option::Option<NodeStateProto>,
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
    pub lock_response: ::core::option::Option<NodeStateProto>,
}
