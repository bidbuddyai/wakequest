# WakeQuest - AI-Powered Alarm Clock App

An advanced alarm clock application with AI-powered missions, voice assistant, and premium subscription features. Wake up with challenging missions that ensure you're fully alert!

## 🌟 Key Features

- **9 Mission Types**: Math, Memory, Shake, Photo, Barcode, Walk Steps, Object Find (AI), Sing (AI), Riddle (AI)
- **AI Voice Assistant**: Natural language alarm control powered by GPT-5.2
- **Premium Subscriptions**: RevenueCat integration with 7-day free trial
- **Weather Integration**: Real-time weather data on wake-up
- **Text-to-Speech**: Personalized wake-up greetings with ElevenLabs
- **18 Alarm Sounds**: From gentle melodies to loud sirens
- **Advanced Customization**: Gradual volume, unlimited snooze (premium), reminder notifications

## 📱 Tech Stack

### Mobile App
- **Framework**: React Native with Expo
- **UI**: NativeWind (Tailwind CSS for React Native)
- **State Management**: Zustand with AsyncStorage persistence
- **Navigation**: Expo Router
- **Subscriptions**: RevenueCat (iOS & Android)
- **AI Integration**: OpenAI GPT-5.2, Whisper transcription
- **APIs**: OpenWeather, ElevenLabs TTS

### Backend
- **Runtime**: Bun
- **Framework**: Hono
- **Type Safety**: TypeScript, Zod

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Bun
- Expo CLI
- iOS Simulator (Mac) or Android Studio

### Installation

#### Mobile App
```bash
cd mobile
bun install
bun run start
```

#### Backend
```bash
cd backend
bun install
bun run dev
```

## 🔑 Environment Variables

Both mobile and backend require environment configuration. See `.env.example` files in each directory.

## 📦 Project Structure

```
wakequest/
├── mobile/          # React Native/Expo mobile app
│   ├── src/
│   │   ├── app/    # Expo Router screens
│   │   ├── components/  # Mission components
│   │   └── lib/    # Services and utilities
│   └── package.json
├── backend/         # Bun/Hono API server
│   ├── src/
│   └── package.json
└── README.md
```

## 💰 Premium Features

WakeQuest offers affordable premium subscriptions:
- **Weekly**: $1.99/week
- **Monthly**: $4.99/month
- **7-day free trial** for all new users

Premium unlocks:
- All mission types (including AI-powered)
- Voice assistant
- Unlimited snooze
- Premium alarm sounds
- Weather integration
- Ad-free experience

## 📄 License

Private - All rights reserved

## 👤 Author

Built with ❤️ for better mornings

---

Co-Authored-By: Warp <agent@warp.dev>
