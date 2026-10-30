import React from 'react';
import { View, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { StarsShow } from '../ui/Stars';
import { routeStars } from '../../utils/routeFilters';
import { COLORS } from '../../assets/styles/styles';

// Marks after a route name in sector tables, as on the website: a green ✓
// when the logged-in climber has logged it, then ★ rating (ascent count).
export default function RouteMarks({ route, ticked }) {
  const stars = routeStars(route);
  const count = route.ascents_count || 0;
  if (!ticked && !stars && !count) return null;
  return (
    <View style={styles.row}>
      {!!ticked && (
        <View style={styles.tick}>
          <FontAwesomeIcon icon={faCheck} size={9} color="#fff" />
        </View>
      )}
      <StarsShow stars={stars} count={count} size={10} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginTop: 3 },
  tick: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
