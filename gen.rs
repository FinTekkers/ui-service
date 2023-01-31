use walkdir::WalkDir;

fn main() {
    print!("{}", "Generating Rust code from ledger-models-protos to ledger-models-rust");

    //find paths of all proto files
    let proto_files: Vec<String> = WalkDir::new("ledger-models-protos")
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


    tonic_build::configure()
        .build_client(true)
        .build_server(true)
        .out_dir("ledger-models-rust")
        .compile_well_known_types(true)
        .compile(&proto_files,
            &["ledger-models-protos"],
        )
        .unwrap()
}

