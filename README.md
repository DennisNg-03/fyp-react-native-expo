# Patient Record Management Mobile App

This is a mobile application developed for digitising and managing patient records, built with **React Native** and **Expo**.

## Features
- Scan and digitise patient medical records by taking pictures, uploading images or documents
- Search patient medical records
- Make appointment booking and rescheduling
- Send automated appointment reminders
- Grant doctor permissions to access past medical records

## User Roles
- Patient, Doctor, Nurse

## Prerequisites
- Node.js v18+
- npm or yarn
- Expo CLI
- Android Studio / Xcode simulator (optional, for emulators)

## Project Structure
- `app/` - Main app source code

## Setup and Running the App

1. **Clone the repository**
   ```bash
   git clone https://github.com/DennisNg-03/fyp-react-native-expo.git
   cd fyp-react-native-expo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```
   This will open the **Expo Dev Tools** in your browser.

4. **Run on your device or emulator**

   - **Expo Go on a physical device**  
     1. Install **Expo Go** from the App Store (iOS) or Play Store (Android)  
     2. Scan the QR code shown in Expo Dev Tools  
     3. The app will open on your device

   - **Android emulator**  
     1. Open **Android Studio** and start an emulator  
     2. In Expo Dev Tools, click **Run on Android device/emulator** or press `a` in the terminal  

   - **iOS simulator (Mac only)**  
     1. Open **Xcode** and start a simulator  
     2. In Expo Dev Tools, click **Run on iOS simulator** or press `i` in the terminal  

   **Note:** Make sure your computer and device are on the **same network** if using Expo Go.
