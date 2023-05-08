from fintekkers.models.security.identifier.identifier_pb2 import IdentifierProto
from fintekkers.models.security.security_pb2 import SecurityProto

from fintekkers.models.position.field_pb2 import *
from fintekkers.models.position.measure_pb2 import MeasureProto

from uuid import UUID
from datetime import datetime
from fintekkers.wrappers.models.security_identifier import Identifier

from fintekkers.wrappers.models.util.fintekkers_uuid import FintekkersUuid
from fintekkers.wrappers.models.util.serialization import ProtoSerializationUtil

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
    def __init__(self, id: UUID, as_of: datetime):
        self.id = id
        self.as_of = as_of

class Security():
    def __init__(self, proto:SecurityProto):
        self.proto:SecurityProto = proto

    def __str__(self) -> str:
        return f"ID[{str(self.get_id())}], {self.get_security_id()}[{self.proto.issuer_name}]"

    def get_fields(self) -> list[FieldProto]:
        return [
            ID, SECURITY_ID, AS_OF, ASSET_CLASS, IDENTIFIER
        ]

    def get_field(self, field:FieldProto) -> object:
        if field in (ID, SECURITY_ID):
            return self.get_id()
        elif field == AS_OF:
            return self.get_as_of()
        elif field == ASSET_CLASS:
            return self.get_asset_class()
        elif field == PRODUCT_CLASS:
            return self.get_product_class()
        elif field == PRODUCT_TYPE:
            return self.get_product_type()
        elif field == IDENTIFIER:
            return self.get_security_id()
        elif field in (TENOR, ADJUSTED_TENOR):
            raise ValueError("Not implemented yet")
        elif field == MATURITY_DATE:
            raise ValueError("Not implemented yet")
        else:
            raise ValueError(f"Field not mapped in Security wrapper: {field}")

    def get_id(self) -> UUID:
        uuid:FintekkersUuid = ProtoSerializationUtil.deserialize(self.proto.uuid)
        return uuid.uuid
    
    def get_as_of(self) -> datetime:
        as_of:datetime = ProtoSerializationUtil.deserialize(self.proto.as_of)
        return as_of
        
    def get_asset_class(self) -> str:
        return self.proto.asset_class
    
    def get_product_class(self) -> str:
        raise ValueError("Not implemented yet. See Java implementation for reference")
    
    def get_product_type(self) -> object:
        raise ValueError("Not implemented yet. See Java implementation for reference")
    
    def get_security_id(self) -> Identifier:
        id:IdentifierProto = self.proto.identifier
        return Identifier(id)

    def __str__(self):
        return f'ID[{str(self.get_security_id())}], {type(self).__name__}[{self.proto.issuer_name}]'

    def __eq__(self, other):
        if isinstance(other, Security):
            return self.get_id() == other.get_id()
        else:
            return False

    def __lt__(self, other):
        if isinstance(other, Security):
            return self.get_id() < other.get_id()
        else:
            return False

    def __hash__(self):
        return hash(self.get_id())

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



# class CashSecurity(Security):
#     pass
