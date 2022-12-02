# Rust Types Derived from Proto Files

## Building

from within /rust-type run ```make rust-types``

this will run ```copy_proto_defs.sh``` to temporarily pull the proto files into the directory (this is necessary for the rust proto library to play nicely) and then run ```cargo build``` to build the types. They will be auto-exported under the mod ledger_models