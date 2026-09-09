import React from 'react';
import { View, Text, Image, ScrollView, Pressable, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'VehicleDetail'>;

export default function VehicleDetailScreen({ route, navigation }: Props) {
  const { vehicle } = route.params;
  const price = vehicle.price_poa || !vehicle.price_gbp ? 'POA' : `£${vehicle.price_gbp.toLocaleString('en-GB')}`;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {vehicle.photos?.[0] ? (
        <Image source={{ uri: vehicle.photos[0] }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Text style={styles.placeholderText}>Photo to be added</Text>
        </View>
      )}

      <View style={styles.body}>
        <Text style={styles.title}>{vehicle.make} {vehicle.model}</Text>
        <Text style={styles.meta}>
          {[vehicle.year, vehicle.mileage ? `${vehicle.mileage.toLocaleString('en-GB')} miles` : null, vehicle.spec]
            .filter(Boolean)
            .join(' · ')}
        </Text>
        <Text style={styles.price}>{price}</Text>

        {vehicle.description ? <Text style={styles.description}>{vehicle.description}</Text> : null}

        <Pressable
          style={styles.button}
          onPress={() => navigation.navigate('Enquire', { vehicle })}
        >
          <Text style={styles.buttonText}>Enquire about this car</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: spacing(16) },
  image: { width: '100%', height: 260 },
  imagePlaceholder: { backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: colors.ivoryMuted, fontFamily: 'Manrope_400Regular', fontSize: 13 },
  body: { padding: spacing(6) },
  title: { color: colors.ivory, fontFamily: 'BodoniModa_600SemiBold', fontSize: 26 },
  meta: { color: colors.ivoryMuted, fontFamily: 'Manrope_400Regular', fontSize: 14, marginTop: spacing(1) },
  price: { color: colors.goldBright, fontFamily: 'Manrope_700Bold', fontSize: 22, marginTop: spacing(3) },
  description: { color: colors.ivory, fontFamily: 'Manrope_400Regular', fontSize: 15, lineHeight: 22, marginTop: spacing(5) },
  button: {
    backgroundColor: colors.gold,
    borderRadius: radius.sm,
    paddingVertical: spacing(3.5),
    alignItems: 'center',
    marginTop: spacing(7),
  },
  buttonText: { color: colors.bg, fontFamily: 'Manrope_700Bold', fontSize: 15 },
});
