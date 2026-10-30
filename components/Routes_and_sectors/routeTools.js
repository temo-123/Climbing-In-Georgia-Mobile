import { createContext, useContext } from 'react';

// The area route finder's state, provided once per area page and read by
// every sector table (the website's provide/inject of `route_tools`).
// null = no finder on this page → tables show every row.
export const RouteToolsContext = createContext(null);

export function useRouteTools() {
  return useContext(RouteToolsContext);
}
