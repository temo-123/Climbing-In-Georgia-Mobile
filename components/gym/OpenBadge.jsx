import React from 'react';
import { useTranslation } from 'react-i18next';
import { faCircle } from '@fortawesome/free-solid-svg-icons';
import Chip from '../ui/Chip';
import { openState, hasHours } from '../../utils/gymHours';

const TONES = { open: 'success', soon: 'hold', closed: 'danger' };

// Live "Open now / Closes in N min / Opens in N min / Closed now" badge.
// Nothing when a work status is set or the gym has no hours.
export default function OpenBadge({ gym, now, small }) {
  const { t } = useTranslation();
  if (!gym || gym.work_status || !hasHours(gym)) return null;
  const s = openState(gym, now);
  return <Chip small={small} icon={faCircle} tone={TONES[s.state]} label={t(s.key, { min: s.min })} />;
}
