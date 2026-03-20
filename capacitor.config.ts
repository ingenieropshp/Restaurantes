import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Cambiamos el ID de ejemplo por uno real para tu proyecto
  appId: 'com.restaurantesturbo.app', 
  appName: 'Restaurantes Turbo',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  // Esto ayuda a que Capacitor encuentre los plugins de Android correctamente
  android: {
    buildOptions: {
      releaseType: 'release-full'
    }
  }
};

export default config;