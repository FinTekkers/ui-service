# Rust Types Derived from Proto Files

Context

This project contains protobuf models of financial objects & request/response formats for APIs; as well as language specific bindings.

## Generating Types

To generate the types run ```cargo run --bin gen```. This will overwrite the files in ledger-models-rust. Any new file must be exported in lib.rs.