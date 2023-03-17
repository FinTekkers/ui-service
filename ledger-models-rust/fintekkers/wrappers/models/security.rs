use chrono::DateTime;
use chrono_tz::Tz;
use prost_types::Timestamp;
use uuid::Uuid;

use crate::fintekkers::models::security::{SecurityProto, SecurityTypeProto};
use crate::fintekkers::models::util::UuidProto;
use crate::fintekkers::wrappers::models::utils::datetime::LocalTimestampWrapper;
use crate::fintekkers::wrappers::models::utils::errors::Error;
use crate::fintekkers::wrappers::models::utils::uuid_wrapper::UUIDWrapper;

struct SecurityProtoBuilder {
    as_of: LocalTimestampWrapper,
    object_class: String,
    version: String,
    is_link: bool,
    uuid: UUIDWrapper,
    security_type: SecurityTypeProto,
    asset_class: String,
    issuer_name: String,
    settlement_currency: String,
}

impl SecurityProtoBuilder {
    fn new() -> Self {
        Self {
            as_of: LocalTimestampWrapper::now(),
            //This is currently hardcoded, this will change in future versions
            object_class: "Security".to_string(),
            //The version is hardcoded, this will change in future versions
            version: "0.0.1".to_string(),
            is_link: false,
            uuid: UUIDWrapper::new_random(),
            security_type: SecurityTypeProto::UnknownSecurityType,
            asset_class: "Unknown".to_string(),
            issuer_name: "Unknown Issue".to_string(),
            settlement_currency: "Unknown settlement currency".to_string(),
        }
    }

    fn as_of(mut self, as_of: LocalTimestampWrapper) -> Self {
        self.as_of = as_of.into();
        self
    }

    fn object_class(mut self, object_class: String) -> Self {
        self.object_class = object_class;
        self
    }

    fn version(mut self, version: String) -> Self {
        self.version = version;
        self
    }

    fn is_link(mut self, is_link: bool) -> Self {
        self.is_link = is_link;
        self
    }

    fn uuid(mut self, uuid: UUIDWrapper) -> Self {
        self.uuid = uuid;
        self
    }

    fn security_type(mut self, security_type: SecurityTypeProto) -> Self {
        self.security_type = security_type;
        self
    }

    fn asset_class(mut self, asset_class: String) -> Self {
        self.asset_class = asset_class;
        self
    }

    fn issuer_name(mut self, issuer_name: String) -> Self {
        self.issuer_name = issuer_name;
        self
    }

    fn settlement_currency(mut self, settlement_currency: String) -> Self {
        self.settlement_currency = settlement_currency;
        self
    }

    fn build(self) -> Result<SecurityProto, Error> {
        Ok(SecurityProto {
            as_of: Some(self.as_of.into()), // When other PR merged can do a into
            object_class: self.object_class,
            version: self.version,
            is_link: self.is_link,
            uuid: Some(self.uuid.into()), // When other PR merged can do a into
            security_type: self.security_type.into(),
            asset_class: self.asset_class,
            issuer_name: self.issuer_name,
            settlement_currency: None,
            cash_id: "".to_string(),

            quantity_type: 0,
            identifier: None,
            description: "".to_string(),

            //Bond specific
            face_value: None,
            coupon_rate: None,
            coupon_frequency: 0,
            coupon_type: 0,
            maturity_date: None,
            dated_date: None,
            issue_date: None,
        })
    }
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_proto_to_date() {
        let result = SecurityProtoBuilder::new()
            .settlement_currency("CAD".to_string())
            .asset_class("Asset Class".to_string())
            .build().unwrap();//.expect("Could not build security");

        assert!(result.asset_class.contains("Asset"));
        // assert_eq!(result.settlement_currency.unwrap(), "CAD".to_string());
    }
}