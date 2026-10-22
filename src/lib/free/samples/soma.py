from fintekkers.models.position.field_pb2 import FieldProto
from fintekkers.wrappers.requests.portfolio import QueryPortfolioRequest
from fintekkers.wrappers.services.portfolio import PortfolioService

request = QueryPortfolioRequest.create_query_request(
    {FieldProto.PORTFOLIO_NAME: "Federal Reserve SOMA Holdings"}
)
for portfolio in PortfolioService().search(request):
    print(portfolio.get_name())
