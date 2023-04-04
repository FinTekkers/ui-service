from fintekkers.wrappers.models.position import Position
from fintekkers.models.position.position_pb2 import PositionProto
from fintekkers.models.position.field_pb2 import FieldProto
from fintekkers.models.position.measure_pb2 import MeasureProto

import unittest

class Testing(unittest.TestCase):
    def test_load_version_44(self):
        """ 
        Tests a position proto can be loaded from version 0.1.44 of ledger-models
        which was loaded by the broker. 

        The purpose is to check the cross-language compatibility. If this test fails
        it is an indication that there is a breaking change in the proto definition
        """
        positionProto:PositionProto = PositionProto.FromString(b'\n\x08Position\x12\x050.0.1P\x01X\x01\xa2\x01\x16\x08\x01\x12\x12R\x10-115992994900.00\xaa\x01H\x08\x1e"D\n9type.googleapis.com/fintekkers.models.util.LocalDateProto\x12\x07\x08\xdc\x0f\x10\x06\x18\x14\xaa\x01\x04\x08 (\x04\xaa\x01N\x08\x0f"J\n4type.googleapis.com/fintekkers.models.util.UUIDProto\x12\x12\n\x10\x9f\xd1\x03\xecb[B\r\xb6\xfd.+\xa1S\x17\xbf')
        position:Position = Position(positionProto=positionProto)

        portfolio_id = position.get_field(FieldProto.PORTFOLIO_ID)
        trade_date = position.get_field(FieldProto.TRADE_DATE)
        transaction_type = position.get_field(FieldProto.TRANSACTION_TYPE)
        directed_quantity = position.get_measure(MeasureProto.DIRECTED_QUANTITY)
        
        #Will throw an error if they don't exist
        
if __name__ == '__main__':
    unittest.main()

