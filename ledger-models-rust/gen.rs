use std::path::PathBuf;

use walkdir::WalkDir;

fn main() {
    print!("{}", "Generating Rust code from ledger-models-protos to ledger-models-rust");

    //find paths of all proto files
    let proto_files: Vec<String> = WalkDir::new("../ledger-models-protos")
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

    // for (name, value) in env::vars() {
    //     println!("{} {}", name, value);
    // }

    let descriptor_path = PathBuf::from("ledger_models_file_descriptor_set_v_todo.bin");

    tonic_build::configure()
        .build_client(true)
        .build_server(true)
        .out_dir("")
        .file_descriptor_set_path(descriptor_path)
        .compile(&proto_files,
            &["../ledger-models-protos"],
        )
        .unwrap()
}

