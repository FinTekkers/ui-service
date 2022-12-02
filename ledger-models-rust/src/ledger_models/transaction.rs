#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum TransactionTypeProto {
    Unknown = 0,
    Buy = 1,
    Sell = 2,
    Deposit = 3,
    Withdrawal = 4,
    Maturation = 5,
    MaturationOffset = 6,
}
impl TransactionTypeProto {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            TransactionTypeProto::Unknown => "UNKNOWN",
            TransactionTypeProto::Buy => "BUY",
            TransactionTypeProto::Sell => "SELL",
            TransactionTypeProto::Deposit => "DEPOSIT",
            TransactionTypeProto::Withdrawal => "WITHDRAWAL",
            TransactionTypeProto::Maturation => "MATURATION",
            TransactionTypeProto::MaturationOffset => "MATURATION_OFFSET",
        }
    }
}
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct TransactionProto {
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
    /// Transaction details
    #[prost(message, optional, tag = "10")]
    pub portfolio: ::core::option::Option<super::portfolio::PortfolioProto>,
    #[prost(message, optional, tag = "11")]
    pub security: ::core::option::Option<super::security::SecurityProto>,
    #[prost(enumeration = "TransactionTypeProto", tag = "12")]
    pub transaction_type: i32,
    #[prost(message, optional, tag = "13")]
    pub quantity: ::core::option::Option<super::util::DecimalValueProto>,
    #[prost(message, optional, tag = "14")]
    pub price: ::core::option::Option<super::price::PriceProto>,
    /// NOTE: We're using timestamps for dates. The time portion will be ignored when parsing
    #[prost(message, optional, tag = "15")]
    pub trade_date: ::core::option::Option<super::util::LocalDateProto>,
    #[prost(message, optional, tag = "16")]
    pub settlement_date: ::core::option::Option<super::util::LocalDateProto>,
    /// Lineage
    ///   TransactionProto cashTransaction = 20;
    ///   TransactionProto parentTransaction = 21;
    #[prost(message, repeated, tag = "20")]
    pub child_transactions: ::prost::alloc::vec::Vec<TransactionProto>,
    /// Business metadata
    #[prost(enumeration = "super::position::PositionStatusProto", tag = "25")]
    pub position_status: i32,
    #[prost(string, tag = "26")]
    pub trade_name: ::prost::alloc::string::String,
    #[prost(message, optional, tag = "27")]
    pub strategy_allocation: ::core::option::Option<
        super::strategy::StrategyAllocationProto,
    >,
    /// System-based fields
    #[prost(bool, tag = "30")]
    pub is_cancelled: bool,
}
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct TransactionRequestProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    #[prost(enumeration = "super::util::RequestOperationTypeProto", tag = "10")]
    pub operation_type: i32,
    #[prost(message, optional, tag = "20")]
    pub create_transaction_input: ::core::option::Option<TransactionProto>,
    #[prost(message, repeated, tag = "21")]
    pub uuids: ::prost::alloc::vec::Vec<super::util::UuidProto>,
    #[prost(message, optional, tag = "22")]
    pub search_transaction_input: ::core::option::Option<
        super::position::PositionFilterProto,
    >,
}
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct TransactionResponseProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    #[prost(message, optional, tag = "20")]
    pub create_transaction_request: ::core::option::Option<TransactionRequestProto>,
    #[prost(message, repeated, tag = "30")]
    pub transaction_response: ::prost::alloc::vec::Vec<TransactionProto>,
}
