import { WebView } from 'react-native-webview';
import { StyleProp, ViewStyle } from 'react-native';

interface Marker {
  lat: number;
  lng: number;
  color?: string;
  title?: string;
}

interface Props {
  lat: number;
  lng: number;
  zoom?: number;
  markers?: Marker[];
  style?: StyleProp<ViewStyle>;
  interactive?: boolean;
}

export default function LeafletMap({
  lat, lng, zoom = 15, markers = [], style, interactive = true,
}: Props) {
  const markersJson = JSON.stringify(markers);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #e8f4f8; }
    #status { 
      position: absolute; top: 8px; left: 8px; right: 8px; z-index: 9999;
      background: rgba(0,0,0,0.7); color: white; padding: 6px 10px;
      border-radius: 6px; font-size: 12px; font-family: monospace;
    }
  </style>
</head>
<body>
  <div id="status">⏳ Chargement...</div>
  <div id="map"></div>

  <script>
    var statusEl = document.getElementById('status');
    function log(msg) {
      statusEl.innerText = msg;
      console.log(msg);
    }

    // Charge Leaflet dynamiquement
    function loadLeaflet(callback) {
      var css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(css);

      var script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = function() {
        log('✅ Leaflet chargé');
        callback();
      };
      script.onerror = function() {
        log('❌ Echec chargement Leaflet (pas de réseau ?)');
      };
      document.head.appendChild(script);
    }

    loadLeaflet(function() {
      try {
        var map = L.map('map', {
          zoomControl: ${interactive},
          dragging: ${interactive},
          touchZoom: ${interactive},
          scrollWheelZoom: false,
          doubleClickZoom: ${interactive},
        }).setView([${lat}, ${lng}], ${zoom});

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OSM',
        }).addTo(map);

        map.on('load', function() { log('✅ Carte chargée'); });
        map.on('tileerror', function(e) { log('❌ Erreur tuile: ' + e.tile.src); });
        map.on('tileload', function() { log('✅ Tuiles OK'); });

        var markers = ${markersJson};
        var colors = { blue: '#0066FF', green: '#34C759', red: '#FF3B30' };

        markers.forEach(function(m) {
          var color = colors[m.color] || '#0066FF';
          var icon = L.divIcon({
            className: '',
            html: '<div style="width:16px;height:16px;border-radius:50%;background:' + color + ';border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.4);"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });
          var marker = L.marker([m.lat, m.lng], { icon: icon }).addTo(map);
          if (m.title) marker.bindPopup(m.title);
        });

        log('');  // Cache le status si tout va bien
      } catch(e) {
        log('❌ Erreur: ' + e.message);
      }
    });
  </script>
</body>
</html>`;

  return (
    <WebView
      source={{ html }}
      style={style}
      scrollEnabled={false}
      originWhitelist={['*']}
      mixedContentMode="always"
      javaScriptEnabled={true}
      domStorageEnabled={true}
      onError={(e) => console.error('WebView error:', e.nativeEvent)}
      onHttpError={(e) => console.error('WebView HTTP error:', e.nativeEvent.statusCode)}
    />
  );
}