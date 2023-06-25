use std::hash::{Hash, Hasher};
use uuid::Uuid;
use crate::fintekkers::models::price::{PriceProto};
use crate::fintekkers::models::security::{SecurityProto};
use crate::fintekkers::models::util::{DecimalValueProto};
use crate::fintekkers::wrappers::models::security::SecurityWrapper;

use crate::fintekkers::wrappers::models::utils::datetime::LocalTimestampWrapper;
use crate::fintekkers::wrappers::models::utils::decimal::DecimalWrapper;
use crate::fintekkers::wrappers::models::utils::errors::Error;
use crate::fintekkers::wrappers::models::utils::uuid_wrapper::UUIDWrapper;

pub struct PriceWrapper {
    pub proto: PriceProto,
}

///
/// When a PriceWrapper is created directly from the proto, we have to
/// synthesize the wrappers on demand. Ideally higher level wrappers
/// refer to lower level wrappers via a reference. For instance a SecurityWrapper
/// would be created and passed into the PriceWrapper as a reference. This would
/// avoid creation of additional memory in the case where we know that securities
/// will outlive the price. Example hierarchy.
///
/// PriceWrapper:
///     SecurityWrapper
///     UUIDWrapper
///     etc
///
/// For now we will just create wrappers when accessor methods are called. E.g.
/// 'uuid_wrapper(&self)' will create a UUIDWrapper when accessed by cloning the
/// uuid.
///
/// In the longer-term we could optimize for memory by providing price/portfolio/
/// security/etc caches. When a PriceWrapper is created a reference to a SecurityWrapper
/// would be passed in, rather than a full wrapper object. The reference to the security
/// would be owned by the cached, which could use reference counting to decide when to
/// free up the memory. That way when there is a security and a price on a security, only
/// one security is held in memory.
///
impl PriceWrapper {
    pub fn new(proto:PriceProto) -> Self {
        PriceWrapper {
            proto
        }
    }

    pub fn uuid_wrapper(&self) -> UUIDWrapper {
        UUIDWrapper::new(self.proto.uuid.as_ref().unwrap().clone())
    }

    pub fn security_wrapper(&self) -> SecurityWrapper {
        let security_proto = self.proto.security.clone().unwrap();
        SecurityWrapper {
            proto: security_proto
        }
    }
}

impl From<PriceWrapper> for PriceProto {
    fn from(wrapper:PriceWrapper) -> PriceProto {
        wrapper.proto
    }
}

impl Hash for PriceWrapper {
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.proto.uuid.as_ref().unwrap().raw_uuid.hash(state);
        // self.id.hash(state);
        // self.phone.hash(state);
    }
}

impl PartialEq for PriceWrapper {
    fn eq(&self, other: &Self) -> bool {
        self.proto.uuid.as_ref() == other.proto.uuid.as_ref()
    }
}
impl Eq for PriceWrapper {}

struct PriceProtoBuilder {
    as_of: LocalTimestampWrapper,
    object_class: String,
    version: String,
    is_link: bool,
    uuid: UUIDWrapper,
    security: Option<SecurityProto>,
    price: Option<DecimalWrapper>
}

impl PriceProtoBuilder {
    fn new() -> Self {
        Self {
            as_of: LocalTimestampWrapper::now(),
            //This is currently hardcoded, this will change in future versions
            object_class: "Security".to_string(),
            //The version is hardcoded, this will change in future versions
            version: "0.0.1".to_string(),
            is_link: false,
            uuid: UUIDWrapper::new_random(),
            security: None,
            price: None,
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

    fn security(mut self, security: SecurityProto) -> Self {
        self.security = security.into();
        self
    }

    fn price(mut self, price: DecimalWrapper) -> Self {
        self.price = price.into();
        self
    }

    fn build(self) -> Result<PriceProto, Error> {
        Ok(PriceProto {
            as_of: Some(self.as_of.into()), // When other PR merged can do a into
            object_class: self.object_class,
            version: self.version,
            is_link: self.is_link,
            uuid: Some(self.uuid.into()), // When other PR merged can do a into
            price: Some(DecimalValueProto {
                arbitrary_precision_value: self.price.unwrap().to_string()
            }),
            security: Some(
                self.security.unwrap()
            ),
        })
    }
}

#[cfg(test)]
mod test {
    use rust_decimal_macros::dec;
    use crate::fintekkers::wrappers::models::security::SecurityProtoBuilder;
    use super::*;

    #[test]
    fn test_proto_to_date() {
        let number = dec!(-1.23);

        let security_proto = SecurityProtoBuilder::new()
            .settlement_currency("CAD".to_string())
            .asset_class("Asset Class".to_string())
            .build().unwrap();//.expect("Could not build security");

        let result = PriceProtoBuilder::new()
            .price(DecimalWrapper::from(&number))
            .security(
                security_proto
            )
            .build().unwrap();//.expect("Could not build security");

        let price = result.price.unwrap();
        let price_str = price.arbitrary_precision_value;

        assert_eq!(price_str, number.to_string());
    }
}