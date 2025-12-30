# Patient Record Management Mobile App

A mobile application for digitising and managing patient records, built with **React Native** and **Expo**.  
This app supports features such as OCR-based document scanning, digital appointment management, and secure storage of patient information.

## Features
- Scan and digitise patient medical records
- Search patient medical records
- Make appointment booking and rescheduling
- Send automated appointment reminders
- Grant doctor permissions to access past medical records

## Prerequisites
- Node.js v18+ installed
- npm or yarn
- Expo CLI installed globally (optional, `npm install -g expo-cli`)
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
