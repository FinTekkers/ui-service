use walkdir::WalkDir;

fn main() {
    //find paths of all proto files
    let proto_files: Vec<String> = WalkDir::new("protos")
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
        .out_dir("rust")
        .compile(&proto_files,
            &["."],
        )
        .unwrap()
}

