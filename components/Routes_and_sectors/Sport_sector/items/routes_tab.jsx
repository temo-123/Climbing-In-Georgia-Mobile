import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import RouteTable from '../../RouteTable';
import ClimbSheet from '../../../climbing/ClimbSheet';
import RouteMarks from '../../../climbing/RouteMarks';
import { useRouteRows } from '../../useRouteRows';
import { boulderToFont, withAlt } from '../../../../utils/grades';
import { COLORS } from '../../../../assets/styles/styles';

// Bolts column as on the website: trad / top-rope routes say so instead
// of a bolt count; unknown → "?".
function boltsLabel(route, t) {
  if (route.category === 'tred') return t('site.guide.route.tred');
  if (route.category === 'top') return t('site.guide.route.top rope');
  if (route.category === 'sport climbing') return route.bolts || '?';
  return '?';
}

const tickedName = { color: COLORS.success };

function TableWithSheet({ routes, columns }) {
  const [selected, setSelected] = useState(null);
  const { rows, ticked } = useRouteRows(routes);
  if (rows.length === 0) return null;
  return (
    <>
      <RouteTable
        columns={columns}
        rows={rows}
        renderName={(r) => <RouteMarks route={r} ticked={ticked[r.id]} />}
        nameStyle={(r) => (ticked[r.id] ? tickedName : null)}
        onRowPress={setSelected}
      />
      {!!selected && <ClimbSheet kind="route" item={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

// Sport routes table (sector `sport_routes`).
export default function RoutesTable({ routes }) {
  const { t } = useTranslation();
  const columns = [
    { key: 'num', label: 'N', flex: 0.45, value: (r, i) => r.num ?? i + 1 },
    { key: 'name', label: t('site.common.name'), flex: 2.3, value: (r) => r.name },
    { key: 'height', label: t('site.common.height'), flex: 0.9, value: (r) => r.height },
    { key: 'bolts', label: t('site.guide.route.bolts'), flex: 0.9, value: (r) => boltsLabel(r, t) },
    { key: 'grade', label: t('site.guide.route.grade fr'), flex: 1.25, value: (r) => withAlt(r.grade, r.or_grade) },
    { key: 'info', label: 'Info', flex: 0.65 },
  ];
  return <TableWithSheet routes={routes} columns={columns} />;
}

// Boulder problems (sector `boulder_route`): grades are stored in V-scale;
// the main column shows the Font equivalent like the website does.
export function BoulderTable({ routes }) {
  const { t } = useTranslation();
  const columns = [
    { key: 'num', label: 'N', flex: 0.45, value: (r, i) => r.num ?? i + 1 },
    { key: 'name', label: t('site.common.name'), flex: 2.4, value: (r) => r.name },
    { key: 'height', label: t('site.common.height'), flex: 0.9, value: (r) => r.height },
    { key: 'grade', label: t('site.guide.route.grade'), flex: 1.5, value: (r) => `${withAlt(r.grade, r.or_grade, boulderToFont)} · ${withAlt(r.grade, r.or_grade)}` },
    { key: 'info', label: 'Info', flex: 0.65 },
  ];
  return <TableWithSheet routes={routes} columns={columns} />;
}

// Ice / mixed routes (WI / M grades) — same sheet and marks.
export function IceTable({ routes }) {
  const { t } = useTranslation();
  const columns = [
    { key: 'num', label: 'N', flex: 0.45, value: (r, i) => r.num ?? i + 1 },
    { key: 'name', label: t('site.common.name'), flex: 2.5, value: (r) => r.name },
    { key: 'height', label: t('site.common.height'), flex: 0.9, value: (r) => r.height },
    { key: 'grade', label: t('site.guide.route.grade'), flex: 1.4, value: (r) => withAlt(r.grade, r.or_grade) },
    { key: 'info', label: 'Info', flex: 0.65 },
  ];
  return <TableWithSheet routes={routes} columns={columns} />;
}
