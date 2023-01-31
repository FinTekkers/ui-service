#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum RequestOperationTypeProto {
    UnknownOperation = 0,
    /// Validate whether an object is well-formed. The proto schema provides the syntax, but validation
    /// ensures semantic meaning is correct.
    Validate = 1,
    /// Create an object in the back-end
    Create = 2,
    /// Retrieve an object
    Get = 3,
    /// Search for an object
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
