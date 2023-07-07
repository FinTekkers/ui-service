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
    use super::*;
    use uuid::Uuid;

    #[test]
    fn test_uuid_to_proto_and_back() {
        let random = UUIDWrapper::new_random();
        let random_str = random.to_string();

        let copy_of_random: Uuid = Uuid::try_from(&random).expect("failed conversion");

        assert_eq!(random_str, copy_of_random.to_string())
    }
}
