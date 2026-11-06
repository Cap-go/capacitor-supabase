# Shipped to consuming apps via consumerProguardFiles. Required when the app enables R8 (Capacitor 9 default for release).

# Capacitor invokes @PluginMethod entry points through reflection; keep the plugin class and methods.
-keep class ee.forgr.plugin.capacitor_supabase.CapacitorSupabasePlugin { *; }

# Supabase Kotlin on Android builds the client with Ktor and JSON; those stacks keep names via reflection and sealed wiring.
-keep class io.github.jan.supabase.** { *; }
-keep class io.ktor.** { *; }

# Ktor references java.lang.management for IDE debug detection on the JVM; those types are not on Android, so R8 needs a narrow dontwarn.
-dontwarn java.lang.management.ManagementFactory
-dontwarn java.lang.management.RuntimeMXBean

# kotlinx.serialization json facades and compiler generated $serializer stubs (used for UserInfo metadata and request bodies).
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.AnnotationsKt
-keepclassmembers class kotlinx.serialization.json.** {
    *** Companion;
}
-keepclasseswithmembers class kotlinx.serialization.json.** {
    kotlinx.serialization.KSerializer serializer(...);
}
