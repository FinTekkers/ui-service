echo "generating rust protos"
cargo run --bin gen

echo "generating java protos"
cd ledger-models-java
gradle clean
gradle build
