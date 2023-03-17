use crate::fintekkers::models::portfolio::PortfolioProto;

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
}