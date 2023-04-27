
from fintekkers.models.position.field_pb2 import FieldProto
from fintekkers.wrappers.models.util.serialization import ProtoEnum



def test_transaction_position():
    ''' 
        Given a descriptor and an enum value we should be able to generate a ProtoEnum wrapper
        that provides a convenience wrapper to get the value of the enum as a string, rather than 
        an int.
    '''
    descriptor = FieldProto.DESCRIPTOR.values_by_number[FieldProto.TRANSACTION_TYPE]

    enum = ProtoEnum(descriptor, 1)

    enum_value_name:str = enum.get_enum_value_name()
    assert enum_value_name == "BUY"

# class ProtoEnum:
#     def __init__(self, enum_descriptor:EnumValueDescriptor, enum_value:int):
#         self.enum_value:int = enum_value
#         self.get_enum_descriptor = enum_descriptor
#         # Will be the proto
#         self.enum:obj = ProtoEnum.get_field_descriptor(enum_descriptor) 

#     @staticmethod
#     def get_field_descriptor(self, enum_descriptor:str):
#         if enum_descriptor.name == "TRANSACTION_TYPE":
#             return TransactionTypeProto
        
#     def get_enum_name(self):
#         return self.enum_descriptor.name
    
#     def get_enum_value(self):
#         return self.enum_value
    
#     def get_enum_value_name(self):
#         return self.enum.DESCRIPTOR.values_by_number[self.enum_value]