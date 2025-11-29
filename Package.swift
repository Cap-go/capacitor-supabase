// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "CapgoCapacitorSupabase",
    platforms: [.iOS(.v14), .macOS(.v10_15)],
    products: [
        .library(
            name: "CapgoCapacitorSupabase",
            targets: ["CapacitorSupabasePlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "7.0.0"),
        .package(url: "https://github.com/supabase/supabase-swift.git", from: "2.0.0")
    ],
    targets: [
        .target(
            name: "CapacitorSupabasePlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                .product(name: "Supabase", package: "supabase-swift")
            ],
            path: "ios/Sources/CapacitorSupabasePlugin"),
        .testTarget(
            name: "CapacitorSupabasePluginTests",
            dependencies: ["CapacitorSupabasePlugin"],
            path: "ios/Tests/CapacitorSupabasePluginTests")
    ]
)
