
import unittest

from fintekkers.models.security.tenor_type_pb2 import TenorTypeProto

from fintekkers.wrappers.models.tenor import Tenor

class Testing(unittest.TestCase):
    def test_tenor(self):
        tenor:Tenor = Tenor(TenorTypeProto.TERM, "1Y")
        
        print(tenor.get_tenor_description())
        
