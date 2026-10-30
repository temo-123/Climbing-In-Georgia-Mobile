import React from 'react';
import SectorsList from '../SectorsList';

// Ice / mixed sectors — same endpoint and structure as sport sectors.
export default function IceSectors(props) {
  return <SectorsList {...props} isIce />;
}
