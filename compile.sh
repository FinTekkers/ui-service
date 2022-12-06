rm -rf ledger-models-java
mkdir  ledger-models-java
cd ledger-models-protos
echo "Following command won't work when run as script, need to research that"
protoc -I . --java_out=../ledger-models-java **/*proto
