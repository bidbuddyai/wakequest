# GitHub Secrets Setup for Android Builds

This guide explains how to set up GitHub secrets for automated Android builds.

## Required Secrets

Go to your GitHub repo: `https://github.com/bidbuddyai/wakequest/settings/secrets/actions`

Add these secrets:

### 1. EXPO_TOKEN (Required for builds)
Get your Expo token:
```bash
npx expo login
npx eas whoami
npx eas build:configure
```

Then get your token from:
- Expo Dashboard: https://expo.dev/accounts/[your-account]/settings/access-tokens
- Create a new token with "Read and write" permissions

### 2. API Keys

| Secret Name | Where to Get | Required For |
|-------------|--------------|--------------|
| `OPENWEATHER_API_KEY` | https://openweathermap.org/api | Weather on wake-up |
| `OPENAI_API_KEY` | https://platform.openai.com/api-keys | AI missions (GPT-5.2) |
| `ANTHROPIC_API_KEY` | https://console.anthropic.com | Claude AI |
| `GOOGLE_API_KEY` | https://console.cloud.google.com | Gemini AI missions |
| `ELEVENLABS_API_KEY` | https://elevenlabs.io/app/settings/api-keys | Text-to-speech |
| `GROK_API_KEY` | https://console.x.ai | Grok AI (optional) |
| `REVENUECAT_GOOGLE_KEY` | https://app.revenuecat.com | Android subscriptions |
| `REVENUECAT_TEST_KEY` | https://app.revenuecat.com | Testing subscriptions |
| `REVENUECAT_APPLE_KEY` | https://app.revenuecat.com | iOS subscriptions |
| `BACKEND_URL` | Your backend deployment | Backend API endpoint |

## How to Add Secrets

1. Go to: `https://github.com/bidbuddyai/wakequest/settings/secrets/actions`
2. Click "New repository secret"
3. Enter name (e.g., `OPENAI_API_KEY`)
4. Paste the value
5. Click "Add secret"
6. Repeat for all secrets

## Testing the Build

Once secrets are added:

### Automatic Build (on push)
Just push to master:
```bash
git add .
git commit -m "trigger android build"
git push
```

### Manual Build
1. Go to: `https://github.com/bidbuddyai/wakequest/actions`
2. Click "Build Android" workflow
3. Click "Run workflow"
4. Choose "preview" or "production"
5. Click "Run workflow"

## Build Outputs

- **Preview**: Generates `.apk` file (install on phone for testing)
- **Production**: Generates `.aab` file (upload to Google Play Store)

Download builds from:
- Expo Dashboard: https://expo.dev
- Or from GitHub Actions artifacts (if configured)

## Troubleshooting

### Build fails with "unauthorized"
- Make sure `EXPO_TOKEN` is set correctly
- Token needs "Read and write" permissions

### Build succeeds but app crashes
- Check if all API keys are set
- Some features require specific keys (AI missions need OPENAI_API_KEY)

### Can't find build output
- Go to https://expo.dev/accounts/[your-account]/projects/wakequest-alarms/builds
- Look for the latest Android build
