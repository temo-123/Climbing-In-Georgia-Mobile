import { useMemo } from 'react';
import { useMyAscents } from '../../utils/myAscents';
import { routeMatches } from '../../utils/routeFilters';
import { useRouteTools } from './routeTools';

// Rows of one sector table after the area route finder's filter, plus the
// climber's ticks for the ✓ marks.
export function useRouteRows(routes) {
  const tools = useRouteTools();
  const { ticked } = useMyAscents();
  const rows = useMemo(
    () => (routes || []).filter((r) => routeMatches(r, tools?.tools, ticked)),
    [routes, tools?.tools, ticked],
  );
  return { rows, ticked };
}
