from fintekkers.models.util import uuid_pb2 as _uuid_pb2
from fintekkers.models.position import position_filter_pb2 as _position_filter_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import ClassVar as _ClassVar, Iterable as _Iterable, Mapping as _Mapping, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class QueryTransactionRequestProto(_message.Message):
    __slots__ = ["object_class", "search_transaction_input", "uuids", "version"]
    OBJECT_CLASS_FIELD_NUMBER: _ClassVar[int]
    SEARCH_TRANSACTION_INPUT_FIELD_NUMBER: _ClassVar[int]
    UUIDS_FIELD_NUMBER: _ClassVar[int]
    VERSION_FIELD_NUMBER: _ClassVar[int]
    object_class: str
    search_transaction_input: _position_filter_pb2.PositionFilterProto
    uuids: _containers.RepeatedCompositeFieldContainer[_uuid_pb2.UUIDProto]
    version: str
    def __init__(self, object_class: _Optional[str] = ..., version: _Optional[str] = ..., uuids: _Optional[_Iterable[_Union[_uuid_pb2.UUIDProto, _Mapping]]] = ..., search_transaction_input: _Optional[_Union[_position_filter_pb2.PositionFilterProto, _Mapping]] = ...) -> None: ...