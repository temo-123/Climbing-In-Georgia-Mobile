import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import React, { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import api, { corsUrl, imgUri } from '../../utils/api';
import { countSectorsAndRoutes } from '../../utils/sectorCount';
import { loadSectorsData, saveSectorsData } from '../../utils/offlineStorage';

export default function OutdoorCard({ cardData }) {
  const navigation = useNavigation();
  const gd = cardData.global_data;
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    if (!gd.id) return;
    api.get(corsUrl(`https://climbing.ge/api/get_sector/get_sector_and_routes/${gd.id}`))
      .then(({ data }) => {
        saveSectorsData(gd.id, data);
        setCounts(countSectorsAndRoutes(data));
      })
      .catch(async () => {
        const cached = await loadSectorsData(gd.id);
        if (cached) setCounts(countSectorsAndRoutes(cached));
      });
  }, [gd.id]);

  const hasCounts = counts && (counts.sectors > 0 || counts.routes > 0 || counts.mtps > 0);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('outdoor_page', gd.url_title)}
    >
      <View style={styles.imageView}>
        <Image
          style={styles.image}
          source={{ uri: imgUri("https://climbing.ge/public/images/outdoor_img/", gd.image) }}
          contentFit="cover"
        />
      </View>
      <View style={styles.textView}>
        <Text style={styles.title}>{cardData.locale_data.title}</Text>
        {hasCounts && (
          <View style={styles.statsRow}>
            {counts.sectors > 0 && (
              <Text style={styles.statChip}>{counts.sectors} sectors</Text>
            )}
            {counts.routes > 0 && (
              <Text style={styles.statChip}>{counts.routes} routes</Text>
            )}
            {counts.mtps > 0 && (
              <Text style={styles.statChip}>{counts.mtps} mtp</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    width: '100%',
    minHeight: 100,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderRadius: 10,
    borderColor: '#279fbb',
    flexDirection: 'row',
  },
  imageView: {
    width: '45%',
    height: 100,
  },
  image: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  textView: {
    flex: 1,
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    gap: 4,
  },
  statChip: {
    fontSize: 11,
    color: '#279fbb',
    backgroundColor: '#e8f6fb',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
});
