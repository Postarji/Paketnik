plugins {
    id("java-library")
    id("org.jetbrains.kotlin.jvm")
    id("org.jetbrains.compose") version "1.9.3"
    id("org.jetbrains.kotlin.plugin.compose") version "2.0.21"
}

java {
    sourceCompatibility = JavaVersion.VERSION_21
    targetCompatibility = JavaVersion.VERSION_21
}

val copy by tasks.registering(Sync::class) {
    from("../app/src/main/java/dev/postarji/tsp")

    into(layout.buildDirectory.dir("shared/dev/postarji/tsp"))

    exclude("BenchmarkRunner.kt", "RealWorldRunner.kt")
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_21
    }

    sourceSets {
        val main by getting {
            kotlin.srcDir(layout.buildDirectory.dir("shared"))
            resources.srcDir("../app/src/main/assets")
        }
    }
}

tasks.named("compileKotlin") {
    dependsOn(copy)
}

dependencies {
    implementation(compose.desktop.currentOs)
}