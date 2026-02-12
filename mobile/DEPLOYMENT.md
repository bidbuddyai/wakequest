# WakeQuest Deployment Guide

This guide covers building and deploying WakeQuest for Android and Web platforms.

## Prerequisites

- **Node.js 20.x** or later
- **EAS CLI**: `npm install -g eas-cli`
- **Expo Account**: Sign up at [expo.dev](https://expo.dev)
- **EXPO_TOKEN**: Set as environment variable for CI/CD (get from Expo dashboard → Account Settings → Access Tokens)

## Android Builds

### Build Profiles

| Profile | Output | Distribution | Use Case |
|---------|--------|--------------|----------|
| `preview` | APK | Internal | Testing, direct install on devices |
| `production` | AAB | Store | Google Play Store submission |

### Building Android APK (Preview)

```bash
# Authenticate (if not using EXPO_TOKEN)
eas login

# Build APK for internal testing
eas build --platform android --profile preview
```

The APK will be available for download from the Expo dashboard once the build completes.

### Building Android AAB (Production)

```bash
# Build AAB for Play Store
eas build --platform android --profile production
```

### Automated Builds (CI/CD)

For CI/CD pipelines, use `--non-interactive` flag and set `EXPO_TOKEN`:

```bash
export EXPO_TOKEN=your_token_here
eas build --platform android --profile production --non-interactive
```

## Web Deployment

### Building Web Assets

```bash
# Build static web assets
npm run export:web
```

This generates static files in the `dist/` directory:
- `index.html` - Entry point
- `_expo/` - Bundled JavaScript and CSS
- `assets/` - Images and fonts

### Web Limitations

The web build has limited functionality compared to native:
- **RevenueCat subscriptions**: Not supported on web
- **Native sensors**: Shake detection, accelerometer not available
- **Push notifications**: Limited support
- **Camera**: Browser-based only

### Deploying Web App

The `dist/` folder can be deployed to any static hosting:

**Vercel:**
```bash
npx vercel dist/
```

**Netlify:**
```bash
npx netlify deploy --dir=dist --prod
```

**Firebase Hosting:**
```bash
firebase deploy --only hosting
```

## Google Play Store Submission

### Option 1: Automated via EAS Submit

1. **Create Google Service Account:**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing
   - Enable Google Play Android Developer API
   - Create Service Account with "Service Account User" role
   - Download JSON key file

2. **Link Service Account to Play Console:**
   - Go to [Google Play Console](https://play.google.com/console)
   - Settings → API access → Link your Google Cloud project
   - Grant access to the service account

3. **Configure EAS Submit:**
   Place the service account JSON at `mobile/google-service-account.json` (already configured in `eas.json`)

4. **Submit to Play Store:**
   ```bash
   # Submit most recent production build
   eas submit --platform android --latest

   # Or submit specific build
   eas submit --platform android --id BUILD_ID
   ```

### Option 2: Manual Upload

1. Download the AAB from Expo dashboard after production build completes
2. Go to [Google Play Console](https://play.google.com/console)
3. Select your app → Release → Production (or Internal testing)
4. Create new release → Upload the AAB file
5. Complete release notes and roll out

### Play Store Requirements

Before first submission:
- [ ] App name and description
- [ ] App icon (512x512 PNG)
- [ ] Feature graphic (1024x500 PNG)
- [ ] Screenshots (phone and tablet)
- [ ] Privacy policy URL
- [ ] Content rating questionnaire
- [ ] Target audience and content
- [ ] Data safety form

## Environment Variables

For builds requiring API keys, set them in EAS:

```bash
# Set secret for all builds
eas secret:create --name EXPO_PUBLIC_OPENAI_API_KEY --value "sk-..." --scope project

# Set for specific environment
eas env:create --name EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY --value "..." --environment production
```

## Troubleshooting

### Build Fails at "Install dependencies"

- Ensure all packages are public or configure npm authentication
- Check that `node` version in `eas.json` matches your local environment
- Verify no private registries are required
- If using `@vibecodeapp/sdk`, ensure EAS environment has proper access

**Known Issue**: Builds may fail due to `@vibecodeapp/sdk` metro configuration. Try:
```bash
# Build locally instead of on EAS servers
eas build --local --platform android --profile production
```

Local builds require Android SDK and Java installed on your machine.

### Build Queue Times

Free tier builds may have long queue times. Options:
- Upgrade to paid EAS plan for priority queue
- Use local builds: `eas build --local --platform android`

### Version Code Conflicts

If Play Store rejects AAB due to version code:
1. Update `versionCode` in `app.json` → `expo.android.versionCode`
2. Rebuild with new version

## Useful Commands

```bash
# Check EAS authentication
eas whoami

# List recent builds
eas build:list

# View specific build
eas build:view BUILD_ID

# Cancel running build
eas build:cancel BUILD_ID

# Configure build credentials
eas credentials
```

## Links

- [Expo EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [Google Play Console](https://play.google.com/console)
- [App Store Connect](https://appstoreconnect.apple.com) (for iOS)
