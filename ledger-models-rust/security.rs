#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum IdentifierTypeProto {
    UnknownIdentifierType = 0,
    ExchTicker = 1,
    Isin = 2,
    Cusip = 3,
    Osi = 4,
    Figi = 5,
    Cash = 50,
}
impl IdentifierTypeProto {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            IdentifierTypeProto::UnknownIdentifierType => "UNKNOWN_IDENTIFIER_TYPE",
            IdentifierTypeProto::ExchTicker => "EXCH_TICKER",
            IdentifierTypeProto::Isin => "ISIN",
            IdentifierTypeProto::Cusip => "CUSIP",
            IdentifierTypeProto::Osi => "OSI",
            IdentifierTypeProto::Figi => "FIGI",
            IdentifierTypeProto::Cash => "CASH",
        }
    }
}
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct IdentifierProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    /// Primary Key
    #[prost(string, tag = "5")]
    pub identifier_value: ::prost::alloc::string::String,
    #[prost(enumeration = "IdentifierTypeProto", tag = "6")]
    pub identifier_type: i32,
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum SecurityTypeProto {
    /// Maps to Security
    UnknownSecurityType = 0,
    CashSecurity = 1,
    EquitySecurity = 2,
    BondSecurity = 3,
    Tips = 4,
    Frn = 5,
}
impl SecurityTypeProto {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            SecurityTypeProto::UnknownSecurityType => "UNKNOWN_SECURITY_TYPE",
            SecurityTypeProto::CashSecurity => "CASH_SECURITY",
            SecurityTypeProto::EquitySecurity => "EQUITY_SECURITY",
            SecurityTypeProto::BondSecurity => "BOND_SECURITY",
            SecurityTypeProto::Tips => "TIPS",
            SecurityTypeProto::Frn => "FRN",
        }
    }
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum SecurityQuantityTypeProto {
    /// Maps to Security
    UnknownQuantityType = 0,
    OriginalFaceValue = 1,
    Notional = 2,
    Units = 3,
}
impl SecurityQuantityTypeProto {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            SecurityQuantityTypeProto::UnknownQuantityType => "UNKNOWN_QUANTITY_TYPE",
            SecurityQuantityTypeProto::OriginalFaceValue => "ORIGINAL_FACE_VALUE",
            SecurityQuantityTypeProto::Notional => "NOTIONAL",
            SecurityQuantityTypeProto::Units => "UNITS",
        }
    }
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum CouponFrequencyProto {
    /// Maps to Security
    UnknownCouponFrequency = 0,
    Annually = 1,
    Semiannually = 2,
    Quarterly = 3,
    Monthly = 4,
    NoCoupon = 5,
}
impl CouponFrequencyProto {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            CouponFrequencyProto::UnknownCouponFrequency => "UNKNOWN_COUPON_FREQUENCY",
            CouponFrequencyProto::Annually => "ANNUALLY",
            CouponFrequencyProto::Semiannually => "SEMIANNUALLY",
            CouponFrequencyProto::Quarterly => "QUARTERLY",
            CouponFrequencyProto::Monthly => "MONTHLY",
            CouponFrequencyProto::NoCoupon => "NO_COUPON",
        }
    }
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum CouponTypeProto {
    /// Maps to Security
    UnknownCouponType = 0,
    Fixed = 1,
    Float = 2,
    Zero = 3,
}
impl CouponTypeProto {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            CouponTypeProto::UnknownCouponType => "UNKNOWN_COUPON_TYPE",
            CouponTypeProto::Fixed => "FIXED",
            CouponTypeProto::Float => "FLOAT",
            CouponTypeProto::Zero => "ZERO",
        }
    }
}
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct SecurityProto {
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
    #[prost(enumeration = "SecurityTypeProto", tag = "10")]
    pub security_type: i32,
    /// Biz fields
    #[prost(string, tag = "11")]
    pub asset_class: ::prost::alloc::string::String,
    #[prost(string, tag = "12")]
    pub issuer_name: ::prost::alloc::string::String,
    #[prost(message, optional, boxed, tag = "13")]
    pub settlement_currency: ::core::option::Option<
        ::prost::alloc::boxed::Box<SecurityProto>,
    >,
    #[prost(enumeration = "SecurityQuantityTypeProto", tag = "14")]
    pub quantity_type: i32,
    #[prost(message, optional, tag = "40")]
    pub identifier: ::core::option::Option<IdentifierProto>,
    #[prost(string, tag = "41")]
    pub description: ::prost::alloc::string::String,
    /// Cash Security fields
    #[prost(string, tag = "50")]
    pub cash_id: ::prost::alloc::string::String,
    /// Bond Security fields
    #[prost(message, optional, tag = "60")]
    pub coupon_rate: ::core::option::Option<super::util::DecimalValueProto>,
    #[prost(enumeration = "CouponTypeProto", tag = "61")]
    pub coupon_type: i32,
    #[prost(enumeration = "CouponFrequencyProto", tag = "62")]
    pub coupon_frequency: i32,
    #[prost(message, optional, tag = "63")]
    pub dated_date: ::core::option::Option<super::util::LocalDateProto>,
    #[prost(message, optional, tag = "64")]
    pub face_value: ::core::option::Option<super::util::DecimalValueProto>,
    #[prost(message, optional, tag = "65")]
    pub issue_date: ::core::option::Option<super::util::LocalDateProto>,
    #[prost(message, optional, tag = "66")]
    pub maturity_date: ::core::option::Option<super::util::LocalDateProto>,
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum TenorTypeProto {
    UnknownTenorType = 0,
    Perpetual = 1,
    Term = 2,
}
impl TenorTypeProto {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            TenorTypeProto::UnknownTenorType => "UNKNOWN_TENOR_TYPE",
            TenorTypeProto::Perpetual => "PERPETUAL",
            TenorTypeProto::Term => "TERM",
        }
    }
}
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct TenorProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    #[prost(string, tag = "5")]
    pub term_value: ::prost::alloc::string::String,
    #[prost(enumeration = "TenorTypeProto", tag = "6")]
    pub tenor_type: i32,
}
/// A request to allow clients to find existing securities.
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct QuerySecurityRequestProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    /// The list of UUIDs to return
    #[prost(message, repeated, tag = "21")]
    pub uuids: ::prost::alloc::vec::Vec<super::util::UuidProto>,
    /// A list of position filters that will filter securities that match.
    #[prost(message, optional, tag = "22")]
    pub search_security_input: ::core::option::Option<
        super::position::PositionFilterProto,
    >,
}
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct QuerySecurityResponseProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    /// The input that was provided for this request.
    #[prost(message, optional, tag = "20")]
    pub query_security_input: ::core::option::Option<QuerySecurityRequestProto>,
    /// The security (or securities) that was matched by this request.
    #[prost(message, repeated, tag = "30")]
    pub security_response: ::prost::alloc::vec::Vec<SecurityProto>,
}
/// Use this request to create or update securities. Uniqueness is guaranteed via the UUID.
/// Security identifiers do not guarantee uniqueness. As an example a bond ISIN or stock ticker
/// may be re-used over time. Therefore if you send 2 requests with the same security identifier
/// you will create two securities. In order to avoid duplication you should either re-use the UUID
/// when calling the API, in which case an update will be applied. If you do not know the UUID, you
/// should first do a search operation.
///
/// It is preferred that the client generates the UUID. This will avoid issues in the network leading
/// to duplicate securities.
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct CreateSecurityRequestProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    /// A fully formed security object to be created or updated. Validations may be applied
    /// before creating. For example creating an equity security with bond fields may be invalid and
    /// therefore rejected.
    #[prost(message, optional, tag = "20")]
    pub security_input: ::core::option::Option<SecurityProto>,
}
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct CreateSecurityResponseProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    /// The input that was provided for this request.
    #[prost(message, repeated, tag = "20")]
    pub security_request: ::prost::alloc::vec::Vec<CreateSecurityRequestProto>,
    /// The security (or securities) that were created in response to this request
    #[prost(message, repeated, tag = "30")]
    pub security_response: ::prost::alloc::vec::Vec<SecurityProto>,
}
