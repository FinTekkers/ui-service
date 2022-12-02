use std::{env, path::Path};

use walkdir::WalkDir;

fn main() {
    // let build_rust_proto = env::var("BUILD_RUST_PROTO")
    //     .map(|v| v == "1")
    //     .unwrap_or(false);
    let build_rust_proto = true;

    if build_rust_proto {

        // find paths of all proto files
        // must run copy_proto_defs.sh first
        let proto_files: Vec<String> = WalkDir::new("proto")
            .into_iter()
            .filter_map(|e| e.ok())
            .filter(|e| {
                if let Some(ext) = e.path().extension() {
                    if ext == "proto" {
                        return true;
                    }
                    return false;
                }
                return false;
            })
            .filter_map(|e| {
                e.into_path()
                    .to_owned()
                    .into_os_string()
                    .into_string()
                    .ok()
            })
            .collect();
        //panic!("files: {:?}", proto_files);
        tonic_build::configure()
            .build_client(true)
            .build_server(true)
            .out_dir("proto/rust")
            .compile(&proto_files, &["."])
            .unwrap()
    }
}
