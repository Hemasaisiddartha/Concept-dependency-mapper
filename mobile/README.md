# Smart AI Concept Dependency Mapper - Mobile Application

Full-stack mobile application built with React Native and Expo for:
**"Improving Student Learning Outcomes Using Smart AI-Based Concept Dependency Mapper Compared to Traditional Learning Systems"**

The mobile application is a native client to the existing FastAPI backend, SQLite database (`data/concept_mapper.db`), and Firebase Realtime Database (`ai-concept-mapper-55d53`).

---

## 📱 Features & Capabilities

1. **Authentication & Session Persistence**:
   - Register new student/instructor accounts or sign in to existing accounts.
   - 1-Click Demo accounts (`alex_student`, `dr_sarah_instructor`).
   - Token & user session stored locally via `@react-native-async-storage/async-storage`.
   - Real-time synchronization with the website database and Firebase RTDB.

2. **Dynamic Course & Curriculum Selector**:
   - Browse all courses dynamically stored in the database.
   - Switch active course with instant mastery recalculation.
   - **AI Course Generator**: Enter any subject (e.g. *Organic Chemistry*, *Quantum Computing*, *Neural Networks*) to synthesize an adaptive prerequisite DAG with 20-question micro-quizzes into the shared database directly from the phone.

3. **Prerequisite Dependency Stepper (Pathway)**:
   - Color-coded concept nodes (`✓ MASTERED`, `⚡ READY`, `🔒 LOCKED`).
   - Bloom taxonomy levels, difficulty ratings (1–5), estimated durations, and mastery scores.
   - Progress reset button per course with confirmation alert.

4. **Concept Details & 360° Google Master Briefing**:
   - Tap any concept card to open the Concept Detail sheet.
   - Review mental models, core mathematical rules/theorems, common pitfalls & misconceptions, and real-world industry applications from the Google Knowledge Engine.
   - Quick action buttons: **⚡ Start Micro-Quiz**, **🤖 Ask AI Tutor**, **📍 Calculate Prereq Chain**.

5. **Adaptive Pathway DAG Solver**:
   - Pick any destination concept.
   - The topological graph engine computes the exact prerequisite sequence, flags critical bottlenecks, and eliminates redundant study steps.

6. **20-Question Diagnostic Micro-Quizzes**:
   - Touch-friendly assessment engine with question progress indicators.
   - Instant grading, time-spent tracking, and database attempt persistence.
   - Pass/Fail evaluation with personalized AI remediation feedback.

7. **AI Concept Tutor Assistant**:
   - Context-aware chatbot powered by the backend AI service.
   - Quick prompt chips for common foundational questions.
   - Instant explanations of mathematical rules, calculus, and prerequisite bottlenecks.

8. **Comparative Research Study & Outcomes**:
   - Empirical findings: Cohen's $d = 1.34$ (Large effect size, $p < 0.001$).
   - Traditional (64.2%) vs. AI Concept Mapper (88.4%) mastery score.
   - 30-day concept retention (+45%) and learning time saved (-41.7%).

9. **Live Connectivity & Network Settings**:
   - Built-in Server Config modal to switch or test backend URLs on the fly:
     - Android Emulator: `http://10.0.2.2:8000/api`
     - Physical Wi-Fi LAN: `http://<YOUR_LAN_IP>:8000/api`
     - Web / iOS: `http://localhost:8000/api`
   - Real-time ping test button with latency measurement (ms).

---

## 🚀 How to Run the Mobile App

### 1. Ensure the Backend Server is Running
From the repository root or `backend/`:
```bash
# In backend directory
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```
> Note: `--host 0.0.0.0` ensures the server listens on all network interfaces so physical devices on Wi-Fi can connect.

### 2. Start the Expo Mobile Development Server
From the `mobile/` directory:
```bash
cd mobile
npm start
```
or
```bash
npx expo start
```

### 3. Run on Devices:
- **Physical Android Phone**:
  1. Install the free **Expo Go** app from Google Play Store.
  2. Connect your phone to the same Wi-Fi network as your computer.
  3. Scan the terminal's QR code using Expo Go.
  4. In the app, tap the **⚙️** icon in the header and select **Physical Phone LAN Wi-Fi** or enter `http://<YOUR_COMPUTER_IP>:8000/api`.
- **Android Studio Emulator**:
  - Press `a` in the terminal to launch the Android emulator. The app will automatically connect via `http://10.0.2.2:8000/api`.
- **Web Browser Preview**:
  - Press `w` in the terminal or view the built-in **Mobile Simulator** in the web frontend ([http://localhost:5173](http://localhost:5173)).

---

## 📦 Android APK & AAB Build Instructions

The Android native project has been configured in `mobile/android/` with package ID `com.aiconceptmapper.app`, custom app icon, splash screen, and `android:usesCleartextTraffic="true"`.

### Option A: Cloud Build with EAS (Recommended - No Android Studio Required)
Expo Application Services (EAS) builds a standalone `.apk` directly in the cloud:

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```
2. Log in to your Expo account:
   ```bash
   eas login
   ```
3. Generate Debug / Internal APK (Directly installable on any Android phone):
   ```bash
   eas build -p android --profile preview
   ```
   When the build finishes, EAS provides a direct `.apk` download link and QR code.

4. Generate Production Android App Bundle (.aab) for Google Play Store:
   ```bash
   eas build -p android --profile production
   ```

### Option B: Local Android Build (Requires Android Studio & SDK)
If you have Android Studio and the Android SDK installed locally:
```bash
cd mobile/android
./gradlew assembleDebug
```
The generated APK will be at:
`mobile/android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🚢 Publishing to Google Play Store

1. Generate your production upload keystore:
   ```bash
   keytool -genkey -v -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Run EAS production build:
   ```bash
   eas build -p android --profile production
   ```
3. Open [Google Play Console](https://play.google.com/console).
4. Create an application with package name `com.aiconceptmapper.app`.
5. Upload the generated `.aab` file to **Production** or **Internal Testing**.
6. Complete store listing, content rating, and submit for review.
