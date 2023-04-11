from fintekkers.models.security.identifier.identifier_pb2 import IdentifierProto
from fintekkers.models.security.identifier.identifier_type_pb2 import IdentifierTypeProto

from fintekkers.models.security.security_pb2 import SecurityProto
from fintekkers.models.security.security_type_pb2 import SecurityTypeProto
from fintekkers.models.security.security_quantity_type_pb2 import SecurityQuantityTypeProto

from fintekkers.models.position.field_pb2 import FieldProto
from fintekkers.models.position.measure_pb2 import MeasureProto


import uuid
from datetime import datetime
from enum import Enum
from typing import Set

class Identifier():
    def __init__(self, identifier:IdentifierProto):
        self.proto = identifier

    def __str__(self):
        identifier_type_name = IdentifierTypeProto.DESCRIPTOR.values_by_number[self.proto.identifier_type].name
        return f"{identifier_type_name}:{self.proto.identifier_value}"

class IFinancialModelObject:
    def get_field(field:FieldProto) -> object:
        pass

    def get_measure(measure:MeasureProto) -> object:
        pass

    def get_fields() -> set[FieldProto]:
        pass

    def get_measures() -> set[MeasureProto]:
        pass

    def get_as_of() -> datetime:
        pass

class RawDataModelObject:
    def __init__(self, id: uuid.UUID, as_of: datetime):
        self.id = id
        self.as_of = as_of

class Security():
    @staticmethod
    def create_from():
        pass
        # SecurityProto(
        #     object_class="Security"
        # )

    def __init__(self, proto:SecurityProto):
        self.proto:SecurityProto = proto


# class Security(RawDataModelObject, IFinancialModelObject):
#     def __init__(self, id: uuid.UUID, issuer: str, as_of: str, settlement_currency):
#         super().__init__(id, as_of)
#         self.issuer = issuer
#         self.settlement_currency = settlement_currency
#         self.identifier = None
#         self.product_type = None
#         self.description = None

#     def get_settlement_currency(self):
#         return self.settlement_currency

#     def is_cash(self):
#         return False

#     def get_issuer(self):
#         return self.issuer

#     def get_asset_class(self):
#         return 'Unclassified'

#     def get_quantity_type(self) -> SecurityQuantityTypeProto:
#         return SecurityQuantityTypeProto.UNKNOWN_QUANTITY_TYPE

#     def get_security_id(self):
#         return self.identifier

#     def set_security_id(self, identifier):
#         self.identifier = identifier

#     def get_product_class(self):
#         return type(self).__name__

#     def get_product_type(self):
#         return SecurityTypeProto.SecurityTypeProto

#     def set_product_type(self, product_type):
#         self.product_type = product_type

#     def get_fields(self) -> Set[FieldProto]:
#         return {FieldProto.ID, FieldProto.ASSET_CLASS, FieldProto.PRODUCT_CLASS}

#     def get_measure(self, measure: MeasureProto):
#         raise NotImplementedError

#     def get_measures(self) -> Set[MeasureProto]:
#         raise NotImplementedError

#     def get_security_type(self):
#         raise RuntimeError('Not supported. Need to code this in')

#     def get_display_description(self):
#         if self.description is not None:
#             return self.description
#         elif self.identifier is not None:
#             return str(self.identifier)
#         else:
#             return str(self)

#     def get_description(self):
#         return self.description

#     def set_description(self, description):
#         self.description = description

#     def __str__(self):
#         return f'ID[{self.get_id().hex}], {type(self).__name__}[{self.issuer}]'

#     def __eq__(self, other):
#         if isinstance(other, Security):
#             return self.get_id() == other.get_id()
#         else:
#             return False

#     def __lt__(self, other):
#         if isinstance(other, Security):
#             return self.get_id() < other.get_id()
#         else:
#             return False

#     def __hash__(self):
#         return hash(self.get_id())


# class CashSecurity(Security):
#     pass
