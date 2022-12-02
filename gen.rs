use walkdir::WalkDir;

fn main() {
    println!("dir: {:?}", std::env::current_dir().unwrap());
    // find paths of all proto files
    // must run copy_proto_defs.sh first
    // let proto_files: Vec<String> = WalkDir::new("proto")
    //     .into_iter()
    //     .filter_map(|e| e.ok())
    //     .filter(|e| {
    //         if let Some(ext) = e.path().extension() {
    //             if ext == "proto" {
    //                 return true;
    //             }
    //             return false;
    //         }
    //         return false;
    //     })
    //     .filter_map(|e| {
    //         e.into_path()
    //             .to_owned()
    //             .into_os_string()
    //             .into_string()
    //             .ok()
    //     })
    //     .collect();
    // println!("Files: {:?}", proto_files);
    print!("current dir: {:?}", std::env::current_dir().unwrap());
    tonic_build::configure()
        .build_client(true)
        .build_server(true)
        .out_dir("rust")
        .compile(
            &[
                // portoflio
                "protos/models/portfolio/portfolio.proto",
                //posistion
                "protos/models/position/field.proto",
                "protos/models/position/measure.proto",
                "protos/models/position/position_filter.proto",
                "protos/models/position/position_status.proto",
                "protos/models/position/position_util.proto",
                "protos/models/position/position.proto",
                //price
                "protos/models/price/price.proto",
                //security
                "protos/models/security/coupon_frequency.proto",
                "protos/models/security/coupon_type.proto",
                "protos/models/security/identifier_type.proto",
                "protos/models/security/identifier.proto",
                "protos/models/security/security_quantity_type.proto",
                "protos/models/security/security_type.proto",
                "protos/models/security/security.proto",
                "protos/models/security/tenor_type.proto",
                "protos/models/security/tenor.proto",
                //strategy
                "protos/models/strategy/strategy_allocation.proto",
                "protos/models/strategy/strategy.proto",
                //transaction
                "protos/models/transaction/transaction_type.proto",
                "protos/models/transaction/transaction.proto",
            ],
            &["."],
        )
        .unwrap()
}
