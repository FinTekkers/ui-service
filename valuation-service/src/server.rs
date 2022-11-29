use rust_types::ledger_models::{
    security::{SecurityRequestProto, SecurityResponseProto},
    valuation::valuation_server::{Valuation, ValuationServer},
};
use tonic::{transport::Server, Request, Response, Status};

#[derive(Default)]
pub struct ValuationServiceServer {}

#[tonic::async_trait]
impl Valuation for ValuationServiceServer {
    async fn echo_security(
        &self,
        request: Request<SecurityRequestProto>,
    ) -> Result<Response<SecurityResponseProto>, Status> {
        let security_request = request.into_inner();
        println!("Recieved Object Class: {}", security_request.object_class);
        println!(
            "Recieved Operation Type: {}",
            security_request.operation_type
        );
        println!("Recieved Request UUID: {:?}", security_request.uuids);

        let reply = SecurityResponseProto {
            object_class: security_request.object_class,
            version: security_request.version,
            create_security_request: None,
            security_response: Vec::new(),
        };

        return Ok(Response::new(reply));
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let addr = "[::1]:50051".parse()?;
    let valuation_service = ValuationServiceServer::default();

    Server::builder()
        .add_service(ValuationServer::new(valuation_service))
        .serve(addr)
        .await?;

    Ok(())
}
