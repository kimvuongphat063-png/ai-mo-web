# Toolchain lock (kiểm tra ngày 11/10/2026)

| Thành phần | Phiên bản | Nguồn xác nhận |
| --- | --- | --- |
| Gradle wrapper | 9.6.0 (bin), `distributionSha256Sum=bbaeb2fef8710818cf0e261201dab964c572f92b942812df0c3620d62a529a01` | https://services.gradle.org/distributions/gradle-9.6.0-bin.zip.sha256 |
| Android Gradle Plugin | 9.4.0 | `dl.google.com/dl/android/maven2/com/android/tools/build/gradle/maven-metadata.xml` (stable), release notes AGP 9.4: API tối đa 37, Gradle tối thiểu 9.6.0, build-tools 36.0.0, JDK 17 |
| Kotlin | 2.2.10 (KGP tích hợp, phụ thuộc runtime của AGP 9.4.0 POM) | `gradle-9.4.0.pom` |
| compileSdk / targetSdk | 37 (`platforms;android-37.0` r02) | Android CLI `android sdk list` |
| minSdk | 26 | bible §1.1 |
| Build-tools | 36.0.0 (mặc định của AGP 9.4) | release notes AGP 9.4 |
| JDK | Temurin 21.0.12.1 (đủ yêu cầu ≥ 17), target 17 | `java -version` |
| androidx.core:core-ktx | 1.19.1 | Google Maven metadata |
| androidx.activity:activity-ktx | 1.13.0 | Google Maven metadata |
| androidx.appcompat:appcompat | 1.8.0 | Google Maven metadata |
| androidx.recyclerview | 1.4.0 | Google Maven metadata |
| androidx.lifecycle:lifecycle-runtime-ktx | 2.11.0 | Google Maven metadata |
| androidx.webkit:webkit | 1.17.1 | Google Maven metadata (stable mới nhất; 1.18.0 còn rc) |
| kotlinx-coroutines | 1.10.2 | Maven Central (giữ thấp hơn 1.11.0 để khớp Kotlin 2.2.10) |
| Test: junit 4.13.2, org.json 20260814, androidx.test ext-junit 1.3.0 / runner 1.7.0 / rules 1.7.0 / core 1.7.0 | | Maven Central / Google Maven |
| Python (công cụ) | 3.x, chỉ thư viện chuẩn (`pack_game.py`, `preview_game.py`, `package_delivery.py`); Pillow/numpy + ffmpeg chỉ cho script tạo asset | |

Tất cả version nằm trong `gradle/libs.versions.toml`; không dùng `+`/`latest`.

## Lệnh kiểm tra lại

```powershell
.\scripts\bootstrap.ps1          # JDK, SDK, platform 37, build-tools 36.0.0, Python
.\gradlew.bat --version
.\gradlew.bat :app:dependencies --configuration releaseRuntimeClasspath
```

## Emulator dùng để kiểm thử

| AVD | System image | WebView |
| --- | --- | --- |
| `kgp_api37` (medium_phone, 2400×1080) | `system-images;android-37.0;google_apis;x86_64` r06 | com.google.android.webview 145.0.7632.218 |
| `kgp_api26` (pixel_2) | `system-images;android-26;google_apis;x86_64` r16 | com.android.webview 69.0.3497.100 |
