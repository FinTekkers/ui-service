rm -rf ledger-models-java/generated-src
mkdir  ledger-models-java/generated-src
cd ledger-models-protos
echo "Following command won't work when run as script, need to research that"
protoc -I . --java_out=../ledger-models-java/generated-src **/*proto

echo "TODO put rust protoc gen in here"