use crate::fintekkers::models::util::DecimalValueProto;
use crate::fintekkers::wrappers::models::utils::errors::Error;

use rust_decimal::Decimal;
use std::fmt;

pub struct DecimalWrapper {
    proto: DecimalValueProto,
}

impl AsRef<DecimalValueProto> for DecimalWrapper {
    fn as_ref(&self) -> &DecimalValueProto {
        &self.proto
    }
}

impl DecimalWrapper {
    pub fn new(proto: DecimalValueProto) -> Self {
        DecimalWrapper { proto }
    }
}

impl From<&str> for DecimalWrapper {
    fn from(value: &str) -> Self {
        DecimalWrapper {
            proto: DecimalValueProto {
                arbitrary_precision_value: value.to_owned(),
            },
        }
    }
}
impl From<&Decimal> for DecimalWrapper {
    fn from(value: &Decimal) -> Self {
        DecimalWrapper {
            proto: DecimalValueProto {
                arbitrary_precision_value: value.to_string(),
            },
        }
    }
}


impl TryFrom<DecimalWrapper> for Decimal {
    type Error = Error;

    fn try_from(value: DecimalWrapper) -> Result<Self, Error> {
        let str:&str = &value.proto.arbitrary_precision_value;

        match Decimal::try_from(str) {
                Ok(v) => Ok(v),
                Err(_result) => Err(Error::DecimalConversion)
        }
    }
}


impl fmt::Display for DecimalWrapper {
    fn fmt(&self, fmt: &mut fmt::Formatter) -> fmt::Result {
        fmt.write_str(&self.proto.arbitrary_precision_value.to_string())?;
        Ok(())
    }
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_proto_to_decimal() {
        let input = DecimalWrapper {
            proto: DecimalValueProto {
                arbitrary_precision_value: String::from("1234567.89"),
            },
        };

        let output: Decimal = input.try_into().unwrap();

        assert_eq!(output.to_string(), "1234567.89");
    }

    #[test]
    fn test_decimal_to_proto() {
        let input = Decimal::from_i128_with_scale(123456789, 2);
        let output = DecimalWrapper::from(&input);

        assert_eq!(output.proto.arbitrary_precision_value, "1234567.89");
    }
}
