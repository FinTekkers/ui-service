use crate::fintekkers::models::portfolio::PortfolioProto;
use crate::fintekkers::models::util::{LocalTimestampProto, UuidProto};
use crate::fintekkers::wrappers::models::utils::datetime::LocalTimestampWrapper;
use crate::fintekkers::wrappers::models::utils::uuid_wrapper::UUIDWrapper;

pub struct PortfolioWrapper {
    proto: PortfolioProto
}

impl AsRef<PortfolioProto> for PortfolioWrapper {
    fn as_ref(&self) -> &PortfolioProto {
        &self.proto
    }
}

impl PortfolioWrapper {
    pub fn new(proto:PortfolioProto) -> Self {
        PortfolioWrapper {
            proto
        }
    }

    pub fn portfolio_name(&self) -> &str {
        &self.proto.portfolio_name
    }
}

pub struct PortfolioProtoBuilder {
    object_class: String,
    version: String,
    uuid: UuidProto,
    as_of: LocalTimestampProto,
    is_link: bool,
    portfolio_name: String,
}

impl PortfolioProtoBuilder {
    pub fn new() -> PortfolioProtoBuilder {
        let uuid = UUIDWrapper::new_random();
        let uuid_str = uuid.to_string();

        PortfolioProtoBuilder {
            object_class: "Portfolio".to_string(),
            version: "0.0.1".to_string(),
            uuid: uuid.into(),
            as_of: LocalTimestampWrapper::now().into(),
            is_link: false,
            portfolio_name: uuid_str,
        }
    }

    pub fn object_class(mut self, object_class: String) -> PortfolioProtoBuilder {
        self.object_class = object_class;
        self
    }

    pub fn version(mut self, version: String) -> PortfolioProtoBuilder {
        self.version = version;
        self
    }

    pub fn uuid(mut self, uuid: UuidProto) -> PortfolioProtoBuilder {
        self.uuid = uuid;
        self
    }

    pub fn as_of(mut self, as_of: LocalTimestampProto) -> PortfolioProtoBuilder {
        self.as_of = as_of;
        self
    }

    pub fn is_link(mut self, is_link: bool) -> PortfolioProtoBuilder {
        self.is_link = is_link;
        self
    }

    pub fn portfolio_name(mut self, portfolio_name: String) -> PortfolioProtoBuilder {
        self.portfolio_name = portfolio_name;
        self
    }

    pub fn build(self) -> PortfolioProto {
        PortfolioProto {
            object_class: self.object_class,
            version: self.version,
            uuid: Some(self.uuid),
            as_of: Some(self.as_of),
            is_link: self.is_link,
            portfolio_name: self.portfolio_name,
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_portfolio_name() {
        let portfolio = PortfolioWrapper {
            proto: PortfolioProto {
                object_class: "Portfolio".to_string(),
                version: "0.01".to_string(),
                uuid: None,
                as_of: None,
                is_link: false,
                portfolio_name: "Dummy Name".to_string(),
            }
        };

        assert_eq!(portfolio.portfolio_name(), "Dummy Name");
    }

    #[test]
    fn test_portfolio_builder() {
        let proto = PortfolioProtoBuilder::new()
            .portfolio_name("Portfolio".to_string())
            .build();

        assert!(proto.portfolio_name.contains("Portfolio"));

        let proto2 = PortfolioProtoBuilder::new()
            .build();

        //Check it's 36 chars long and has a hyphen (i.e. its the UUID)
        assert!(proto2.portfolio_name.contains("-"));
        assert_eq!(36, proto2.portfolio_name.len())
    }
}