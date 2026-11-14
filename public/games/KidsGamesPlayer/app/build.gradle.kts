import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
}

// Release signing material lives outside the packaged source, in .local-signing/
// (git-ignored, excluded from the source ZIP). See docs/SIGNING.md.
val signingPropsFile = rootProject.file(".local-signing/keystore.properties")
val signingProps = Properties().apply {
    if (signingPropsFile.isFile) signingPropsFile.inputStream().use { load(it) }
}
val hasReleaseSigning = signingProps.getProperty("storeFile") != null

android {
    namespace = "vn.family.kidsgamesplayer"
    compileSdk = 37

    defaultConfig {
        applicationId = "vn.family.kidsgamesplayer"
        minSdk = 26
        targetSdk = 37
        versionCode = 2
        versionName = "1.1.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    signingConfigs {
        if (hasReleaseSigning) {
            create("release") {
                storeFile = rootProject.file(".local-signing/" + signingProps.getProperty("storeFile"))
                storePassword = signingProps.getProperty("storePassword")
                keyAlias = signingProps.getProperty("keyAlias")
                keyPassword = signingProps.getProperty("keyPassword")
                enableV1Signing = true
                enableV2Signing = true
                enableV3Signing = true
            }
        }
    }

    buildTypes {
        getByName("debug") {
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
        }
        getByName("release") {
            isDebuggable = false
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            if (hasReleaseSigning) {
                signingConfig = signingConfigs.getByName("release")
            }
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildFeatures {
        buildConfig = true
    }

    testOptions {
        unitTests.isReturnDefaultValues = false
    }

    // Malicious/broken fixtures are packaged only into the instrumentation test APK.
    sourceSets {
        getByName("androidTest") {
            assets.srcDir("../test-fixtures")
        }
    }

    lint {
        abortOnError = true
        checkReleaseBuilds = true
    }

    packaging {
        resources {
            excludes += setOf("META-INF/*.kotlin_module", "META-INF/LICENSE*", "META-INF/NOTICE*", "DebugProbesKt.bin")
        }
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.activity.ktx)
    implementation(libs.androidx.appcompat)
    implementation(libs.androidx.recyclerview)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.webkit)
    implementation(libs.kotlinx.coroutines.android)

    testImplementation(libs.junit)
    testImplementation(libs.org.json)
    testImplementation(libs.kotlinx.coroutines.test)

    androidTestImplementation(libs.androidx.test.ext.junit)
    androidTestImplementation(libs.androidx.test.runner)
    androidTestImplementation(libs.androidx.test.rules)
    androidTestImplementation(libs.androidx.test.core)
}
