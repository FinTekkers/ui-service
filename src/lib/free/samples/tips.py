from fintekkers.models.position.field_pb2 import FieldProto
from fintekkers.wrappers.requests.security import QuerySecurityRequest
from fintekkers.wrappers.services.security import SecurityService

request = QuerySecurityRequest.create_query_request(
    {FieldProto.IDENTIFIER: "91282CPU9"}
)
for bond in SecurityService().search(request):
    print(bond.get_description(), bond.get_maturity_date())
