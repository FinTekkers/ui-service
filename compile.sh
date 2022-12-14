echo "generating rust protos"
cargo run --bin gen

echo "generating java protos"
rm -rf ledger-models-java/generated-src
mkdir  ledger-models-java/generated-src

echo "Following command won't work when run as script, need to research that"
echo $PWD
protoc --java_out=ledger-models-java/generated-src --proto_path=ledger-models-protos **/*.proto
