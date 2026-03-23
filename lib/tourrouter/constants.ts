// ============================================================
// CITY COORDINATES (~170 cities)
// ============================================================

export const CITY_COORDS: Record<string, [number, number]> = {
  // USA
  'new york': [40.7128, -74.0060], 'los angeles': [34.0522, -118.2437], 'chicago': [41.8781, -87.6298],
  'houston': [29.7604, -95.3698], 'phoenix': [33.4484, -112.0740], 'philadelphia': [39.9526, -75.1652],
  'san antonio': [29.4241, -98.4936], 'san diego': [32.7157, -117.1611], 'dallas': [32.7767, -96.7970],
  'san jose': [37.3382, -121.8863], 'austin': [30.2672, -97.7431], 'jacksonville': [30.3322, -81.6557],
  'fort worth': [32.7555, -97.3308], 'columbus': [39.9612, -82.9988], 'charlotte': [35.2271, -80.8431],
  'indianapolis': [39.7684, -86.1581], 'san francisco': [37.7749, -122.4194], 'seattle': [47.6062, -122.3321],
  'denver': [39.7392, -104.9903], 'nashville': [36.1627, -86.7816], 'oklahoma city': [35.4676, -97.5164],
  'el paso': [31.7619, -106.4850], 'boston': [42.3601, -71.0589], 'portland': [45.5051, -122.6750],
  'las vegas': [36.1699, -115.1398], 'louisville': [38.2527, -85.7585], 'memphis': [35.1495, -90.0490],
  'baltimore': [39.2904, -76.6122], 'milwaukee': [43.0389, -87.9065], 'albuquerque': [35.0853, -106.6056],
  'tucson': [32.2226, -110.9747], 'fresno': [36.7378, -119.7871], 'sacramento': [38.5816, -121.4944],
  'mesa': [33.4152, -111.8315], 'kansas city': [39.0997, -94.5786], 'atlanta': [33.7490, -84.3880],
  'omaha': [41.2565, -95.9345], 'colorado springs': [38.8339, -104.8214], 'raleigh': [35.7796, -78.6382],
  'long beach': [33.7701, -118.1937], 'virginia beach': [36.8529, -75.9780], 'minneapolis': [44.9778, -93.2650],
  'tampa': [27.9506, -82.4572], 'new orleans': [29.9511, -90.0715], 'orlando': [28.5383, -81.3792],
  'miami': [25.7617, -80.1918], 'cleveland': [41.4993, -81.6944], 'pittsburgh': [40.4406, -79.9959],
  'cincinnati': [39.1031, -84.5120], 'st. louis': [38.6270, -90.1994], 'st louis': [38.6270, -90.1994],
  'richmond': [37.5407, -77.4360], 'buffalo': [42.8864, -78.8784], 'salt lake city': [40.7608, -111.8910],
  'detroit': [42.3314, -83.0458], 'boise': [43.6150, -116.2023], 'spokane': [47.6588, -117.4260],
  'chattanooga': [35.0456, -85.3097], 'knoxville': [35.9606, -83.9207], 'birmingham': [33.5207, -86.8025],
  'montgomery': [32.3668, -86.3000], 'jackson': [32.2988, -90.1848], 'little rock': [34.7465, -92.2896],
  'tulsa': [36.1540, -95.9928], 'wichita': [37.6872, -97.3301], 'madison': [43.0731, -89.4012],
  'grand rapids': [42.9634, -85.6681], 'fargo': [46.8772, -96.7898], 'sioux falls': [43.5446, -96.7311],
  'lincoln': [40.8136, -96.7026], 'des moines': [41.5868, -93.6250], 'columbia': [38.9517, -92.3341],
  'charleston': [32.7765, -79.9311], 'savannah': [32.0835, -81.0998], 'asheville': [35.5951, -82.5515],
  'greenville': [34.8526, -82.3940], 'lexington': [38.0406, -84.5037],
  'dayton': [39.7589, -84.1916], 'akron': [41.0814, -81.5190], 'toledo': [41.6528, -83.5379],
  'anchorage': [61.2181, -149.9003], 'honolulu': [21.3069, -157.8583],
  'brooklyn': [40.6782, -73.9442], 'queens': [40.7282, -73.7949], 'bronx': [40.8448, -73.8648],
  // Canada
  'toronto': [43.6532, -79.3832], 'montreal': [45.5017, -73.5673], 'vancouver': [49.2827, -123.1207],
  'calgary': [51.0447, -114.0719], 'edmonton': [53.5461, -113.4938], 'ottawa': [45.4215, -75.6972],
  'winnipeg': [49.8951, -97.1384], 'quebec city': [46.8139, -71.2082], 'hamilton': [43.2557, -79.8711],
  'victoria': [48.4284, -123.3656], 'halifax': [44.6488, -63.5752], 'london': [51.5074, -0.1278],
  // UK
  'manchester': [53.4808, -2.2426], 'birmingham uk': [52.4862, -1.8904], 'glasgow': [55.8642, -4.2518],
  'edinburgh': [55.9533, -3.1883], 'leeds': [53.8008, -1.5491], 'bristol': [51.4545, -2.5879],
  'liverpool': [53.4084, -2.9916], 'sheffield': [53.3811, -1.4701], 'cardiff': [51.4816, -3.1791],
  'belfast': [54.5973, -5.9301], 'brighton': [50.8225, -0.1372], 'nottingham': [52.9548, -1.1581],
  'leicester': [52.6369, -1.1398], 'exeter': [50.7184, -3.5339],
  // Europe
  'paris': [48.8566, 2.3522], 'berlin': [52.5200, 13.4050], 'amsterdam': [52.3676, 4.9041],
  'madrid': [40.4168, -3.7038], 'barcelona': [41.3851, 2.1734], 'rome': [41.9028, 12.4964],
  'milan': [45.4654, 9.1859], 'vienna': [48.2082, 16.3738], 'brussels': [50.8503, 4.3517],
  'stockholm': [59.3293, 18.0686], 'oslo': [59.9139, 10.7522], 'copenhagen': [55.6761, 12.5683],
  'helsinki': [60.1699, 24.9384], 'zurich': [47.3769, 8.5417], 'geneva': [46.2044, 6.1432],
  'prague': [50.0755, 14.4378], 'budapest': [47.4979, 19.0402], 'warsaw': [52.2297, 21.0122],
  'krakow': [50.0647, 19.9450], 'lisbon': [38.7223, -9.1393], 'porto': [41.1579, -8.6291],
  'athens': [37.9838, 23.7275], 'bucharest': [44.4268, 26.1025], 'sofia': [42.6977, 23.3219],
  'zagreb': [45.8150, 15.9819], 'belgrade': [44.7866, 20.4489], 'ljubljana': [46.0569, 14.5058],
  'bratislava': [48.1486, 17.1077], 'riga': [56.9496, 24.1052], 'tallinn': [59.4370, 24.7536],
  'vilnius': [54.6872, 25.2797], 'hamburg': [53.5753, 10.0153], 'munich': [48.1351, 11.5820],
  'cologne': [50.9333, 6.9500], 'frankfurt': [50.1109, 8.6821], 'dusseldorf': [51.2217, 6.7762],
  'stuttgart': [48.7758, 9.1829], 'leipzig': [51.3397, 12.3731], 'dresden': [51.0504, 13.7373],
  'rotterdam': [51.9244, 4.4777], 'utrecht': [52.0907, 5.1214], 'antwerp': [51.2213, 4.3999],
  'ghent': [51.0543, 3.7174], 'lyon': [45.7640, 4.8357], 'marseille': [43.2965, 5.3698],
  'bordeaux': [44.8378, -0.5792], 'toulouse': [43.6047, 1.4442], 'nantes': [47.2184, -1.5536],
  'strasbourg': [48.5734, 7.7521], 'bern': [46.9480, 7.4474],
  'basel': [47.5596, 7.5886], 'seville': [37.3891, -5.9845], 'valencia': [39.4699, -0.3763],
  'bilbao': [43.2630, -2.9350], 'san sebastian': [43.3183, -1.9812], 'florence': [43.7696, 11.2558],
  'naples': [40.8518, 14.2681], 'turin': [45.0703, 7.6869], 'bologna': [44.4949, 11.3426],
  'venice': [45.4408, 12.3155], 'reykjavik': [64.1265, -21.8174], 'dublin': [53.3498, -6.2603],
  'cork': [51.8985, -8.4756], 'galway': [53.2707, -9.0568],
  // Australia
  'sydney': [-33.8688, 151.2093], 'melbourne': [-37.8136, 144.9631], 'brisbane': [-27.4705, 153.0260],
  'perth': [-31.9505, 115.8605], 'adelaide': [-34.9285, 138.6007],
  // Other
  'tokyo': [35.6762, 139.6503], 'mexico city': [19.4326, -99.1332], 'sao paulo': [-23.5505, -46.6333],
  'buenos aires': [-34.6037, -58.3816], 'bogota': [4.7110, -74.0721],
};

// ============================================================
// AIRPORT DATA
// ============================================================

export const CITY_AIRPORTS: Record<string, string> = {
  'new york': 'JFK', 'los angeles': 'LAX', 'chicago': 'ORD', 'houston': 'IAH',
  'dallas': 'DFW', 'san francisco': 'SFO', 'miami': 'MIA', 'boston': 'BOS',
  'seattle': 'SEA', 'denver': 'DEN', 'atlanta': 'ATL', 'phoenix': 'PHX',
  'minneapolis': 'MSP', 'detroit': 'DTW', 'philadelphia': 'PHL', 'san diego': 'SAN',
  'portland': 'PDX', 'las vegas': 'LAS', 'salt lake city': 'SLC', 'nashville': 'BNA',
  'new orleans': 'MSY', 'austin': 'AUS', 'kansas city': 'MCI', 'cleveland': 'CLE',
  'pittsburgh': 'PIT', 'cincinnati': 'CVG', 'columbus': 'CMH', 'charlotte': 'CLT',
  'raleigh': 'RDU', 'indianapolis': 'IND', 'st. louis': 'STL', 'st louis': 'STL',
  'memphis': 'MEM', 'tampa': 'TPA', 'orlando': 'MCO', 'baltimore': 'BWI',
  'buffalo': 'BUF', 'louisville': 'SDF', 'richmond': 'RIC', 'milwaukee': 'MKE',
  'omaha': 'OMA', 'sacramento': 'SMF', 'san jose': 'SJC', 'oklahoma city': 'OKC',
  'albuquerque': 'ABQ', 'el paso': 'ELP', 'boise': 'BOI', 'spokane': 'GEG',
  'anchorage': 'ANC', 'honolulu': 'HNL',
  // Canada
  'toronto': 'YYZ', 'montreal': 'YUL', 'vancouver': 'YVR', 'calgary': 'YYC',
  'edmonton': 'YEG', 'ottawa': 'YOW', 'winnipeg': 'YWG', 'halifax': 'YHZ',
  // Europe
  'london': 'LHR', 'paris': 'CDG', 'amsterdam': 'AMS', 'frankfurt': 'FRA',
  'madrid': 'MAD', 'barcelona': 'BCN', 'rome': 'FCO', 'milan': 'MXP',
  'berlin': 'BER', 'munich': 'MUC', 'hamburg': 'HAM', 'vienna': 'VIE',
  'brussels': 'BRU', 'copenhagen': 'CPH', 'stockholm': 'ARN', 'oslo': 'OSL',
  'helsinki': 'HEL', 'zurich': 'ZRH', 'lisbon': 'LIS', 'athens': 'ATH',
  'dublin': 'DUB', 'manchester': 'MAN', 'edinburgh': 'EDI', 'glasgow': 'GLA',
  'prague': 'PRG', 'budapest': 'BUD', 'warsaw': 'WAW', 'bucharest': 'OTP',
  'reykjavik': 'KEF',
  // Other
  'sydney': 'SYD', 'melbourne': 'MEL', 'tokyo': 'NRT', 'mexico city': 'MEX',
};

export const AIRPORT_COORDS: Record<string, [number, number]> = {
  'JFK': [40.6413, -73.7781], 'LAX': [33.9425, -118.4081], 'ORD': [41.9742, -87.9073],
  'IAH': [29.9902, -95.3368], 'DFW': [32.8998, -97.0403], 'SFO': [37.6213, -122.3790],
  'MIA': [25.7959, -80.2870], 'BOS': [42.3656, -71.0096], 'SEA': [47.4502, -122.3088],
  'DEN': [39.8561, -104.6737], 'ATL': [33.6407, -84.4277], 'PHX': [33.4373, -112.0078],
  'MSP': [44.8848, -93.2223], 'DTW': [42.2162, -83.3554], 'PHL': [39.8729, -75.2437],
  'SAN': [32.7338, -117.1933], 'PDX': [45.5898, -122.5951], 'LAS': [36.0840, -115.1537],
  'SLC': [40.7899, -111.9791], 'BNA': [36.1245, -86.6782], 'MSY': [29.9934, -90.2580],
  'AUS': [30.1975, -97.6664], 'MCI': [39.2976, -94.7139], 'CLE': [41.4058, -81.8540],
  'PIT': [40.4915, -80.2329], 'CVG': [39.0488, -84.6678], 'CMH': [39.9980, -82.8919],
  'CLT': [35.2140, -80.9431], 'RDU': [35.8776, -78.7875], 'IND': [39.7173, -86.2944],
  'STL': [38.7487, -90.3700], 'MEM': [35.0421, -89.9792], 'TPA': [27.9755, -82.5332],
  'MCO': [28.4312, -81.3081], 'BWI': [39.1754, -76.6683], 'LHR': [51.4700, -0.4543],
  'CDG': [49.0097, 2.5479], 'AMS': [52.3086, 4.7639], 'FRA': [50.0379, 8.5622],
  'MAD': [40.4983, -3.5676], 'BCN': [41.2974, 2.0833], 'FCO': [41.8003, 12.2388],
  'MXP': [45.6306, 8.7281], 'BER': [52.3667, 13.5033], 'MUC': [48.3537, 11.7750],
  'VIE': [48.1103, 16.5697], 'BRU': [50.9010, 4.4844], 'CPH': [55.6180, 12.6508],
  'ARN': [59.6519, 17.9186], 'OSL': [60.1939, 11.1004], 'HEL': [60.3172, 24.9633],
  'ZRH': [47.4647, 8.5492], 'LIS': [38.7742, -9.1342], 'ATH': [37.9364, 23.9445],
  'DUB': [53.4213, -6.2701], 'MAN': [53.3537, -2.2750], 'EDI': [55.9500, -3.3725],
  'PRG': [50.1008, 14.2600], 'BUD': [47.4369, 19.2556], 'WAW': [52.1672, 20.9679],
  'YYZ': [43.6777, -79.6248], 'YUL': [45.4706, -73.7408], 'YVR': [49.1967, -123.1815],
  'SYD': [-33.9461, 151.1772], 'NRT': [35.7720, 140.3929],
  'BUF': [42.9405, -78.7322], 'SDF': [38.1744, -85.7360], 'RIC': [37.5052, -77.3197],
  'MKE': [42.9472, -87.8966], 'OMA': [41.3032, -95.8941], 'SMF': [38.6954, -121.5908],
  'SJC': [37.3626, -121.9291], 'OKC': [35.3931, -97.6007], 'ABQ': [35.0402, -106.6091],
  'ELP': [31.8072, -106.3778], 'BOI': [43.5644, -116.2228], 'GEG': [47.6199, -117.5338],
  'ANC': [61.1743, -149.9962], 'HNL': [21.3187, -157.9225],
  'YYC': [51.1215, -114.0076], 'YEG': [53.3097, -113.5800], 'YOW': [45.3225, -75.6692],
  'YWG': [49.9100, -97.2399], 'YHZ': [44.8808, -63.5086],
  'HAM': [53.6304, 9.9882], 'GLA': [55.8719, -4.4331], 'OTP': [44.5711, 26.0850],
  'KEF': [63.9850, -22.6056], 'MEL': [-37.6733, 144.8433], 'MEX': [19.4363, -99.0721],
};

// ============================================================
// VEHICLE FUEL EFFICIENCY
// ============================================================

export type VehicleType = 'van' | 'e350' | 'minibus' | 'bus' | 'truck' | 'car';

export const VEHICLE_MPG: Record<VehicleType, number> = {
  van: 20, e350: 14, minibus: 12, bus: 6, truck: 10, car: 28,
};

export const VEHICLE_L100: Record<VehicleType, number> = {
  van: 11.8, e350: 16.8, minibus: 19.6, bus: 39.2, truck: 23.5, car: 8.4,
};
