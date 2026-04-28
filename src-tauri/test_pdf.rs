use lopdf::Document;
use std::io::Write;

fn main() {
    let mut doc = Document::with_version("1.7");
    doc.add_blank_page(612.0, 792.0);
    let mut file = std::fs::File::create("/tmp/test-rs.pdf").unwrap();
    doc.save_to(&mut file).unwrap();
    println!("Created");
}
