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
