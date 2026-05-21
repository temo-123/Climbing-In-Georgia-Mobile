export function countSectorsAndRoutes(data) {
  let sectors = 0, routes = 0, mtps = 0;
  if (!Array.isArray(data)) return { sectors: 0, routes: 0, mtps: 0 };

  data.forEach(item => {
    if (item.local_images) {
      // Type B: sub-area grouping
      (item.sectors || []).forEach(sub => {
        sectors++;
        routes += (sub.sport_routes || []).length;
        if (Array.isArray(sub.boulder_route)) routes += sub.boulder_route.length;
        mtps += (sub.mtps || []).length;
      });
    } else {
      // Type A: direct sector
      if (item.sector) sectors++;
      routes += (item.sport_routes || []).length;
      if (Array.isArray(item.boulder_route)) routes += item.boulder_route.length;
      mtps += (item.mtps || []).length;
    }
  });

  return { sectors, routes, mtps };
}
