import React, { useCallback, useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts as useBodoniModa,
  BodoniModa_400Regular,
  BodoniModa_600SemiBold,
} from '@expo-google-fonts/bodoni-moda';
import {
  useFonts as useManrope,
  Manrope_400Regular,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';

import type { RootStackParamList } from './src/navigation';
import { getBackendConfig } from './src/backend';
import { colors } from './src/theme';
import SetupScreen from './src/screens/SetupScreen';
import VehiclesScreen from './src/screens/VehiclesScreen';
import VehicleDetailScreen from './src/screens/VehicleDetailScreen';
import EnquireScreen from './src/screens/EnquireScreen';

SplashScreen.preventAutoHideAsync().catch(() => {});

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.bg, card: colors.bg, text: colors.ivory, border: colors.border, primary: colors.gold },
};

export default function App() {
  const [bodoniLoaded] = useBodoniModa({ BodoniModa_400Regular, BodoniModa_600SemiBold });
  const [manropeLoaded] = useManrope({ Manrope_400Regular, Manrope_600SemiBold, Manrope_700Bold });
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);

  useEffect(() => {
    getBackendConfig().then((config) => setInitialRoute(config ? 'Vehicles' : 'Setup'));
  }, []);

  const fontsReady = bodoniLoaded && manropeLoaded;
  const ready = fontsReady && initialRoute !== null;

  const onLayout = useCallback(async () => {
    if (ready) await SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayout}>
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator
          initialRouteName={initialRoute!}
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.ivory,
            headerTitleStyle: { fontFamily: 'BodoniModa_600SemiBold' },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="Setup" component={SetupScreen} options={{ title: 'Set Up' }} />
          <Stack.Screen name="Vehicles" component={VehiclesScreen} options={{ title: 'Sourced London', headerShown: false }} />
          <Stack.Screen name="VehicleDetail" component={VehicleDetailScreen} options={{ title: '' }} />
          <Stack.Screen name="Enquire" component={EnquireScreen} options={{ title: 'Enquire' }} />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
    </View>
  );
}
