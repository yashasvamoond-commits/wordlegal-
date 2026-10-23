import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'in.wordlegal.app',
  appName: 'वर्डलीगल',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
    backgroundColor: '#0b1220',
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0b1220',
      overlaysWebView: false,
    },
  },
}

export default config
