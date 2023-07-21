use std::fmt;

use crate::fintekkers::wrappers::models::utils::errors::Error;
use crate::fintekkers::models::util::UuidProto;
use uuid::Uuid;

pub struct UUIDWrapper {
    proto: UuidProto,
}

impl UUIDWrapper {
    pub fn new(proto: UuidProto) -> Self {
        UUIDWrapper { proto }
    }

    pub fn new_random() -> Self {
        let tmp_uuid = Uuid::new_v4();

        UUIDWrapper {
            proto: UuidProto {
                raw_uuid: tmp_uuid.into_bytes().into(),
            },
        }
    }

    pub fn as_uuid(&self) -> Uuid {
        Uuid::try_from(self).unwrap()
    }
}


impl TryFrom<&str> for UUIDWrapper {
    type Error = Error;
    fn try_from(value: &str) -> Result<UUIDWrapper, Error> {
        let tmp_uuid = Uuid::parse_str(value)
            .map_err(|_| Error::UuidError)?;

        Ok(UUIDWrapper {
            proto: UuidProto {
                raw_uuid: tmp_uuid.into_bytes().into(),
            },
        })
    }
}

impl From<UUIDWrapper> for UuidProto {
    fn from(wrapper:UUIDWrapper) -> UuidProto {
        wrapper.proto
    }
}

impl From<Vec<u8>> for UUIDWrapper {
    fn from(value: Vec<u8>) -> Self {
        UUIDWrapper {
            proto: UuidProto { raw_uuid: value },
        }
    }
}

impl TryFrom<&UUIDWrapper> for Uuid {
    type Error = Error;
    fn try_from(wrapper: &UUIDWrapper) -> Result<Uuid, Error> {
        Uuid::from_slice(&wrapper.proto.raw_uuid).map_err(|_| Error::UuidError)
    }
}

impl fmt::Display for UUIDWrapper {
    fn fmt(&self, fmt: &mut fmt::Formatter) -> fmt::Result {
        let tmp_uuid: Uuid = self.try_into().map_err(|_| fmt::Error)?;

        fmt.write_str(&tmp_uuid.to_string())?;

        Ok(())
    }
}

#[cfg(test)]
mod test {
    use std::str::FromStr;
    use super::*;
    use uuid::Uuid;

    #[test]
    fn test_uuid_to_proto_and_back() {
        let input_array = [217, 98, 253, 240, 51, 225, 77, 157, 153, 155, 126, 195, 80, 240, 203, 119];
        let input = Vec::from(input_array);

        let uuid = Uuid::from_slice(&input).unwrap();
        let uuid_str = uuid.to_string();
        println!("{}", uuid_str);

        let uuid2 = Uuid::from_str(&"d962fdf0-33e1-4d9d-999b-7ec350f0cb77").unwrap();
        let uuid2_str = uuid2.to_string();
        println!("{}", uuid2_str);

        let output_bytes = uuid2.into_bytes().to_vec();
        assert_eq!(input, output_bytes);

        let random = UUIDWrapper::new_random();
        let random_str = random.to_string();

        let copy_of_random: Uuid = Uuid::try_from(&random).expect("failed conversion");

        assert_eq!(random_str, copy_of_random.to_string())
    }
}
