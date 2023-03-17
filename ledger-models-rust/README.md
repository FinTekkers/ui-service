# Rust Types Derived from Proto Files

Context

This project contains protobuf models of financial objects & request/response formats for APIs; as well as language specific bindings.

## Generating Types

To generate the types run ```cargo run --bin gen```. This will overwrite the files in ledger-models-rust. Any new file must be exported in lib.rs.

This is included in the compile.sh script which creates types across all languages.

## Project structure

Tonic/Prost is used to generate language bindings in Rust. Auto-generated files 
are created in the format fintekkers.<folder>.<file>.rs. 

Hand-written wrappers are included in the folder fintekkers/wrappers/file.rs. The purpose
of this code is to make it easier to use the Rust implementation of fintekkers without having
gitto understand all the nuance of protobufs, or nuances of performance optimizations made in the proto schema.

