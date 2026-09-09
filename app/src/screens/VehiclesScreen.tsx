import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, Image, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation';
import type { Vehicle } from '../types';
import { getSupabase } from '../backend';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Vehicles'>;

function formatPrice(v: Vehicle) {
  if (v.price_poa || !v.price_gbp) return 'POA';
  return `£${v.price_gbp.toLocaleString('en-GB')}`;
}

export default function VehiclesScreen({ navigation }: Props) {
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const supabase = await getSupabase();
    if (!supabase) {
      navigation.replace('Setup');
      return;
    }
    const { data, error: err } = await supabase
      .from('vehicles')
      .select('*')
      .eq('status', 'available')
      .order('created_at', { ascending: false });
    if (err) {
      setError(err.message);
    } else {
      setError('');
      setVehicles(data as Vehicle[]);
    }
  }, [navigation]);

  useEffect(() => {
    load();
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  if (vehicles === null && !error) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Sourced London</Text>
        <Text style={styles.title}>Current stock</Text>
      </View>

      {error ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Couldn’t load vehicles</Text>
          <Text style={styles.emptyBody}>{error}</Text>
        </View>
      ) : vehicles && vehicles.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Nothing listed yet</Text>
          <Text style={styles.emptyBody}>
            Vehicles added in Admin → Vehicles on the website appear here automatically.
          </Text>
        </View>
      ) : (
        <FlatList
          data={vehicles || []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl tintColor={colors.gold} refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => navigation.navigate('VehicleDetail', { vehicle: item })}>
              {item.photos?.[0] ? (
                <Image source={{ uri: item.photos[0] }} style={styles.cardImage} />
              ) : (
                <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
                  <Text style={styles.placeholderText}>Photo to be added</Text>
                </View>
              )}
              <View style={styles.cardBody}>
                <Text style={styles.cardMake}>{item.make} {item.model}</Text>
                <Text style={styles.cardMeta}>
                  {[item.year, item.mileage ? `${item.mileage.toLocaleString('en-GB')} mi` : null, item.spec]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
                <Text style={styles.cardPrice}>{formatPrice(item)}</Text>
              </View>
            </Pressable>
          )}
        />
      )}

      <Pressable style={styles.enquireFloat} onPress={() => navigation.navigate('Enquire', undefined)}>
        <Text style={styles.enquireFloatText}>Enquire</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: spacing(6), paddingTop: spacing(16), paddingBottom: spacing(4) },
  eyebrow: { color: colors.gold, fontFamily: 'Manrope_700Bold', fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase' },
  title: { color: colors.ivory, fontFamily: 'BodoniModa_600SemiBold', fontSize: 28, marginTop: spacing(1) },
  list: { paddingHorizontal: spacing(6), paddingBottom: spacing(24), gap: spacing(4) },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardImage: { width: '100%', height: 170 },
  cardImagePlaceholder: { backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: colors.ivoryMuted, fontFamily: 'Manrope_400Regular', fontSize: 12 },
  cardBody: { padding: spacing(4) },
  cardMake: { color: colors.ivory, fontFamily: 'BodoniModa_600SemiBold', fontSize: 19 },
  cardMeta: { color: colors.ivoryMuted, fontFamily: 'Manrope_400Regular', fontSize: 13, marginTop: spacing(1) },
  cardPrice: { color: colors.goldBright, fontFamily: 'Manrope_700Bold', fontSize: 16, marginTop: spacing(2) },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing(8) },
  emptyTitle: { color: colors.ivory, fontFamily: 'BodoniModa_600SemiBold', fontSize: 20, marginBottom: spacing(2) },
  emptyBody: { color: colors.ivoryMuted, fontFamily: 'Manrope_400Regular', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  enquireFloat: {
    position: 'absolute',
    right: spacing(6),
    bottom: spacing(8),
    backgroundColor: colors.gold,
    borderRadius: 999,
    paddingVertical: spacing(3.5),
    paddingHorizontal: spacing(6),
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  enquireFloatText: { color: colors.bg, fontFamily: 'Manrope_700Bold', fontSize: 14 },
});
