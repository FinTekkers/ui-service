echo "generating rust protos"
cargo run --bin gen

echo "generating java protos"
cd ledger-models-java
gradle clean
gradle build

echo "generating python protos"
cd ../ledger-models-protos
#pip3 install grpcio
#pip3 install grpcio-tools
python3 -m grpc_tools.protoc -I=. --python_out=../ledger-models-python/src --pyi_out=../ledger-models-python/src --grpc_python_out=../ledger-models-python/src $(find . -iname "*.proto")