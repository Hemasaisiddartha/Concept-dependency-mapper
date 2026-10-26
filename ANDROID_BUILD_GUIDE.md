# Smart AI Concept Dependency Mapper — Android Build & Release Guide

This guide provides complete instructions for running, building, testing, and releasing the **Smart AI Concept Dependency Mapper** Android mobile application (`com.aiconceptmapper.app`).

---

## 1. Project Configuration Summary

* **Application Name**: `AI Concept Dependency Mapper`
* **Package Identifier**: `com.aiconceptmapper.app`
* **Version**: `1.0.0` (Version Code: `1`)
* **Expo SDK**: `51.0.39`
* **React Native**: `0.74.5`
* **Target Android SDK**: `34` (Android 14)
* **Minimum Android SDK**: `23` (Android 6.0+)
* **Permissions Configured**:
  * `android.permission.INTERNET`
  * `android.permission.ACCESS_NETWORK_STATE`
* **Network Security Configuration**:
  * `android:usesCleartextTraffic="true"` configured in `mobile/android/app/src/main/AndroidManifest.xml` to allow communication with local development servers and Wi-Fi LAN IPs (`http://<LAN_IP>:8000`).

---

## 2. Testing on a Physical Android Phone via Expo Go

This is the fastest method to interact with the full app on an actual Android device without compiling an APK first:

### Step 1: Ensure Backend Server is Running
```bash
# In repository root or backend/
cd backend
python run.py
```
> The server will listen on `0.0.0.0:8000` so external devices on the same Wi-Fi network can connect.

### Step 2: Identify Your Computer's LAN IP Address
In PowerShell:
```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.*" } | Select-Object IPAddress, InterfaceAlias
```
*(Example: `192.168.1.100` or `10.52.246.21`)*

### Step 3: Start the Expo Development Server
In a second terminal:
```bash
cd mobile
npm.cmd start
```
or
```bash
npx.cmd expo start --tunnel
```

### Step 4: Scan and Test on Phone
1. Install **Expo Go** from the Google Play Store on your Android device.
2. Ensure your phone is connected to the same Wi-Fi network as your computer.
3. Open Expo Go and scan the QR code displayed in the terminal.
4. Once loaded, tap the **⚙️** icon in the app header or navigate to **Profile $\rightarrow$ Configure Server**.
5. Select **Wi-Fi LAN** or enter: `http://<YOUR_COMPUTER_LAN_IP>:8000/api`.
6. Tap **Test Ping** to confirm the green `🟢 Online` indicator.

---

## 3. Building a Standalone Debug APK

A standalone `.apk` file can be installed directly on any Android device without needing Expo Go or development servers.

### Option A: EAS Cloud Build (Recommended — No Local Android SDK Required)

Expo Application Services (EAS) builds the APK in the cloud with zero local setup requirements:

1. **Install EAS CLI**:
   ```bash
   npm.cmd install -g eas-cli
   ```
2. **Log into Expo**:
   ```bash
   eas login
   ```
3. **Build the Debug APK**:
   ```bash
   cd mobile
   eas build -p android --profile preview
   ```
4. **Download and Install**:
   - EAS will generate a standalone `.apk` file and provide a direct download link and QR code.
   - Download the APK directly onto your phone and tap to install.

### Option B: Local Android Gradle Build (Requires Local Android SDK)

If you have Android Studio and Android SDK installed on your workstation:

1. Ensure `ANDROID_HOME` is set:
   ```powershell
   $env:ANDROID_HOME = "C:\Users\<YOUR_USER>\AppData\Local\Android\Sdk"
   ```
2. Navigate to `mobile/android`:
   ```bash
   cd mobile/android
   cmd.exe /c "gradlew.bat assembleDebug"
   ```
3. The generated APK will be output at:
   ```
   mobile/android/app/build/outputs/apk/debug/app-debug.apk
   ```
4. Install directly to a USB-connected Android phone with USB Debugging enabled:
   ```bash
   adb install -r app/build/outputs/apk/debug/app-debug.apk
   ```

---

## 4. Building a Production Signed AAB (Google Play Store)

To publish the application on Google Play Console, Google requires an Android App Bundle (`.aab`):

### Step 1: Generate Release Keystore
```bash
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

### Step 2: Configure EAS Build Profile
`mobile/eas.json` is pre-configured with the production profile:
```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

### Step 3: Trigger Production Cloud Build
```bash
cd mobile
eas build -p android --profile production
```
EAS handles the secure signing and outputs the signed `.aab` file.

### Step 4: Upload to Google Play Console
1. Go to [Google Play Console](https://play.google.com/console).
2. Create an application with package identifier `com.aiconceptmapper.app`.
3. Go to **Release $\rightarrow$ Production** or **Internal Testing**.
4. Upload the generated `.aab` bundle.
5. Complete the store listing, privacy policy, and submit for review.
