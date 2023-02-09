from fintekkers.models.util import local_timestamp_pb2 as _local_timestamp_pb2
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import ClassVar as _ClassVar, Mapping as _Mapping, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class NodeStateProto(_message.Message):
    __slots__ = ["end_point", "is_expired", "last_seen", "object_class", "partition", "version"]
    END_POINT_FIELD_NUMBER: _ClassVar[int]
    IS_EXPIRED_FIELD_NUMBER: _ClassVar[int]
    LAST_SEEN_FIELD_NUMBER: _ClassVar[int]
    OBJECT_CLASS_FIELD_NUMBER: _ClassVar[int]
    PARTITION_FIELD_NUMBER: _ClassVar[int]
    VERSION_FIELD_NUMBER: _ClassVar[int]
    end_point: str
    is_expired: bool
    last_seen: _local_timestamp_pb2.LocalTimestampProto
    object_class: str
    partition: str
    version: str
    def __init__(self, object_class: _Optional[str] = ..., version: _Optional[str] = ..., partition: _Optional[str] = ..., end_point: _Optional[str] = ..., last_seen: _Optional[_Union[_local_timestamp_pb2.LocalTimestampProto, _Mapping]] = ..., is_expired: bool = ...) -> None: ...
