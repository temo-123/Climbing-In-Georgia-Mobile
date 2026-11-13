import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import WebView from 'react-native-webview';
import { COLORS, RADII } from '../../../assets/styles/styles';

// Small OpenStreetMap (Leaflet in a WebView — the app has no native map
// library) with one dot per summit, zoomed to fit; a popup tap opens the
// summit (`onOpenSummit(summit)`). Summits without coordinates are skipped;
// renders nothing when none are left. Like the website's
// MountMassifOsmMapComponent.vue.
const LEAFLET = 'https://unpkg.com/leaflet@1.9.4/dist';

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function summitsWithCoords(summits) {
  return (summits || []).filter((s) => {
    const lat = Number(s?.latitude);
    const lng = Number(s?.longitude);
    return s?.latitude != null && s?.longitude != null && Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);
  });
}

export default function SummitsMap({ summits, height = 220, onOpenSummit, openLabel = 'Open' }) {
  const pins = useMemo(() => summitsWithCoords(summits), [summits]);

  const html = useMemo(() => {
    const points = pins.map((s, i) => ({
      i,
      lat: Number(s.latitude),
      lng: Number(s.longitude),
      label: `${esc(s.title)}${s.height ? ` · ${esc(s.height)} m` : ''}`,
    }));
    return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<link rel="stylesheet" href="${LEAFLET}/leaflet.css">
<style>html,body,#m{margin:0;height:100%;background:#eef1f0}
.leaflet-popup-content{font:600 13px/1.4 sans-serif;margin:10px 12px}
.leaflet-popup-content a{display:inline-block;margin-top:4px;color:${COLORS.primaryDark};font-weight:800;text-decoration:none}</style>
</head><body><div id="m"></div>
<script src="${LEAFLET}/leaflet.js"></script>
<script>
var pts=${JSON.stringify(points)};
var map=L.map('m',{scrollWheelZoom:false,attributionControl:true,zoomControl:true});
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:17,attribution:'&copy; OpenStreetMap'}).addTo(map);
var b=[];
pts.forEach(function(p){
  var m=L.circleMarker([p.lat,p.lng],{radius:8,color:'#fff',weight:2,fillColor:'${COLORS.primary}',fillOpacity:1}).addTo(map);
  m.bindPopup(p.label+'<br><a href="#" onclick="window.ReactNativeWebView.postMessage(String('+p.i+'));return false;">${esc(openLabel)} ›</a>');
  b.push([p.lat,p.lng]);
});
if(b.length===1){map.setView(b[0],12);}else{map.fitBounds(b,{padding:[28,28],maxZoom:13});}
</script></body></html>`;
  }, [pins, openLabel]);

  if (!pins.length) return null;

  return (
    <View style={[styles.wrap, { height }]}>
      <WebView
        originWhitelist={['*']}
        source={{ html, baseUrl: 'https://climbing.ge/' }}
        onMessage={(e) => {
          const s = pins[Number(e.nativeEvent.data)];
          if (s) onOpenSummit?.(s);
        }}
        javaScriptEnabled
        scrollEnabled={false}
        nestedScrollEnabled
        setSupportMultipleWindows={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: RADII.md, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.chalk },
});
