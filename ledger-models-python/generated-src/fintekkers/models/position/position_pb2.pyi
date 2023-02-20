from fintekkers.models.util import decimal_value_pb2 as _decimal_value_pb2
from fintekkers.models.position import measure_pb2 as _measure_pb2
from fintekkers.models.position import position_util_pb2 as _position_util_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import ClassVar as _ClassVar, Iterable as _Iterable, Mapping as _Mapping, Optional as _Optional, Union as _Union

DEFAULT_VIEW: PositionViewProto
DESCRIPTOR: _descriptor.FileDescriptor
STRATEGY_VIEW: PositionViewProto
TAX_LOT: PositionTypeProto
TRANSACTION: PositionTypeProto
UNKNOWN_POSITION_TYPE: PositionTypeProto
UNKNOWN_POSITION_VIEW: PositionViewProto

class MeasureMapFieldEntry(_message.Message):
    __slots__ = ["measure", "measure_decimal_value"]
    MEASURE_DECIMAL_VALUE_FIELD_NUMBER: _ClassVar[int]
    MEASURE_FIELD_NUMBER: _ClassVar[int]
    measure: _measure_pb2.MeasureProto
    measure_decimal_value: _decimal_value_pb2.DecimalValueProto
    def __init__(self, measure: _Optional[_Union[_measure_pb2.MeasureProto, str]] = ..., measure_decimal_value: _Optional[_Union[_decimal_value_pb2.DecimalValueProto, _Mapping]] = ...) -> None: ...

class PositionProto(_message.Message):
    __slots__ = ["fields", "measures", "object_class", "position_type", "position_view", "version"]
    FIELDS_FIELD_NUMBER: _ClassVar[int]
    MEASURES_FIELD_NUMBER: _ClassVar[int]
    OBJECT_CLASS_FIELD_NUMBER: _ClassVar[int]
    POSITION_TYPE_FIELD_NUMBER: _ClassVar[int]
    POSITION_VIEW_FIELD_NUMBER: _ClassVar[int]
    VERSION_FIELD_NUMBER: _ClassVar[int]
    fields: _containers.RepeatedCompositeFieldContainer[_position_util_pb2.FieldMapEntry]
    measures: _containers.RepeatedCompositeFieldContainer[MeasureMapFieldEntry]
    object_class: str
    position_type: PositionTypeProto
    position_view: PositionViewProto
    version: str
    def __init__(self, object_class: _Optional[str] = ..., version: _Optional[str] = ..., position_view: _Optional[_Union[PositionViewProto, str]] = ..., position_type: _Optional[_Union[PositionTypeProto, str]] = ..., measures: _Optional[_Iterable[_Union[MeasureMapFieldEntry, _Mapping]]] = ..., fields: _Optional[_Iterable[_Union[_position_util_pb2.FieldMapEntry, _Mapping]]] = ...) -> None: ...

class PositionViewProto(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = []

class PositionTypeProto(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = []
