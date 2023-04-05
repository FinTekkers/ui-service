from datetime import date, datetime
from fintekkers.models.transaction.transaction_pb2 import TransactionProto
from fintekkers.models.transaction.transaction_type_pb2 import TransactionTypeProto
from fintekkers.models.portfolio.portfolio_pb2 import PortfolioProto
from fintekkers.models.position.position_status_pb2 import PositionStatusProto
from fintekkers.models.price.price_pb2 import PriceProto
from fintekkers.models.security.security_pb2 import SecurityProto

# from fintekkers.wrappers.models.util.serialization import ProtoSerializationUtil
from fintekkers.wrappers.models.util.fintekkers_uuid import FintekkersUuid

# class Transaction():
#     @staticmethod
#     def create_transaction(
#         security:SecurityProto=None, portfolio:PortfolioProto=None, \
#         trade_date:date=date.today(), settlement_date:date=date.today(), \
#         position_status:PositionStatusProto=PositionStatusProto.INTENDED, \
#         transaction_type:TransactionTypeProto=TransactionTypeProto.BUY, \
#         price:float=-100.00, quantity=100, 
#     ):
#         now_proto = ProtoSerializationUtil.serialize(datetime.now())
#         return TransactionProto(
#             as_of=now_proto,
#             is_cancelled=False,
#             is_link=False,
#             object_class="Transaction",
#             portfolio=portfolio,
#             security=security,
#             position_status=position_status,
#             price=PriceProto(
#                 uuid=ProtoSerializationUtil.serialize(FintekkersUuid.new_uuid()),
#                 as_of=now_proto,
#                 price=ProtoSerializationUtil.serialize(price),
#                 security=security
#             ),
#             transaction_type=transaction_type,
#             # quantity=DecimalValueProto(arbitrary_precision_value=f"{quantity}"),
#             # trade_date=LocalDateProto(year=trade_date.year, month=trade_date.month, day=trade_date.day),
#             # settlement_date=LocalDateProto(year=settlement_date.year, month=settlement_date.month, day=settlement_date.day),
#             # uuid=UUIDProto(raw_uuid=uuid4().bytes),
#             # trade_name="Fed Reserve SOMA",
#             # strategy_allocation=None
#         )
#         return None

class TransactionType():
    def __init__(self, proto: TransactionTypeProto):
        self.proto = proto

    def __str__(self) -> str:
        return TransactionTypeProto.Name(self.proto)
