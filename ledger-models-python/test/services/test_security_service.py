import grpc

from fintekkers.models.security.identifier.identifier_type_pb2 import IdentifierTypeProto
from fintekkers.services.security_service.security_service_pb2_grpc import SecurityStub

from fintekkers.wrappers.models.util.environment import Environment, SECURITY_SERVICE
from fintekkers.wrappers.services.security import SecurityService

import os
print(os.getcwd())

import sys
print(sys.path)

from requests.test_security_request import CASH_USD_REQUEST

def test_get_usd_cash_security():

    channel2:grpc.Channel = Environment().get_service_insecure_channel(SECURITY_SERVICE)
    svc = SecurityService(SecurityStub(channel2))

    responses2 = svc.Search(CASH_USD_REQUEST)

    security = None
    for r in responses2:
        security = r
    
    assert security is not None
    assert "USD" == security.description
    assert IdentifierTypeProto.CASH == security.identifier.identifier_type

if __name__ == "__main__":
    test_get_usd_cash_security()