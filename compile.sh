echo "generating rust protos"
cargo run --bin gen

echo "generating java protos"
cd ledger-models-java
gradle clean
gradle build

cd ../ledger-models-protos

echo "generating javascript protos"
protoc \
    --js_out=import_style=commonjs:../ledger-models-javascript/ \
    --grpc-web_out=import_style=commonjs+dts,mode=grpcwebtext:../ledger-models-javascript/ $(find . -iname "*.proto")


echo "generating python protos"
#pip3 install grpcio
#pip3 install grpcio-tools
python3 -m grpc_tools.protoc -I=. --python_out=../ledger-models-python/generated-src --pyi_out=../ledger-models-python/generated-src --grpc_python_out=../ledger-models-python/generated-src $(find . -iname "*.proto")