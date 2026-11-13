// Region filter + "By region" grouping shared by the outdoor, ice and indoor
// lists (the website's list components), so all three behave the same:
// - chips: All + every region that has at least one item (shown when ≥ 2)
// - while All is selected and there's no search: By region (sections) / Flat
// - sections in the regions' own order (get_region/get_local_regions), with
//   items that have no known region last, under "Other region"
//
// `regionOf(item)` → the item's region id, or null.
export const OTHER_REGION = '__other__';

export function regionOrder(regions) {
  // useRegions() is { id: name }; integer keys keep ascending order.
  return Object.keys(regions).map(Number);
}

export function regionOptionsFor(items, regionOf, regions, allLabel, otherLabel) {
  const present = new Set(items.map((i) => regionOf(i) ?? OTHER_REGION));
  const opts = regionOrder(regions)
    .filter((id) => present.has(id))
    .map((id) => ({ key: id, label: regions[id] }));
  if (present.has(OTHER_REGION) && opts.length) opts.push({ key: OTHER_REGION, label: otherLabel });
  return [{ key: null, label: allLabel }, ...opts];
}

export function filterByRegion(items, regionOf, region) {
  if (region == null) return items;
  return items.filter((i) => (regionOf(i) ?? OTHER_REGION) === region);
}

// SectionList sections: one per region when `grouped`, else a single
// untitled section.
export function regionSections(items, regionOf, regions, grouped, otherLabel) {
  if (!items.length) return [];
  if (!grouped) return [{ key: 'all', title: null, data: items }];
  const by = new Map();
  items.forEach((i) => {
    const id = regionOf(i) ?? OTHER_REGION;
    if (!by.has(id)) by.set(id, []);
    by.get(id).push(i);
  });
  const order = [...regionOrder(regions), OTHER_REGION];
  return [...by.entries()]
    .sort(([a], [b]) => {
      const ia = order.indexOf(a); const ib = order.indexOf(b);
      return (ia < 0 ? order.length : ia) - (ib < 0 ? order.length : ib);
    })
    .map(([id, data]) => ({
      key: String(id),
      title: id === OTHER_REGION ? otherLabel : (regions[id] ?? otherLabel),
      count: data.length,
      data,
    }));
}
