from fintekkers.models.util.lock import node_state_pb2 as _node_state_pb2
from fintekkers.requests.util import operation_pb2 as _operation_pb2
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import ClassVar as _ClassVar, Mapping as _Mapping, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class LockRequestProto(_message.Message):
    __slots__ = ["node_state", "object_class", "operation_type", "version"]
    NODE_STATE_FIELD_NUMBER: _ClassVar[int]
    OBJECT_CLASS_FIELD_NUMBER: _ClassVar[int]
    OPERATION_TYPE_FIELD_NUMBER: _ClassVar[int]
    VERSION_FIELD_NUMBER: _ClassVar[int]
    node_state: _node_state_pb2.NodeStateProto
    object_class: str
    operation_type: _operation_pb2.RequestOperationTypeProto
    version: str
    def __init__(self, object_class: _Optional[str] = ..., version: _Optional[str] = ..., operation_type: _Optional[_Union[_operation_pb2.RequestOperationTypeProto, str]] = ..., node_state: _Optional[_Union[_node_state_pb2.NodeStateProto, _Mapping]] = ...) -> None: ...
