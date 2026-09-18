/* ══════════════════════════════════════════
   PHC DATA LAYER
   Mock data for all screens
══════════════════════════════════════════ */

const PHC = {

  user: {
    name: 'Granth',
    lastName: 'Kumar',
    bloodGroup: 'B+',
    allergies: 'None',
    emergencyContact: 'None',
    emergencyPhone: 'None',
    age: 20,
    weight: '90 kg',
  },

  vitals: {
    hr:   { value: 78,   unit: 'BPM',  trend: +2,  status: 'ok',   label: 'Heart Rate',    icon: 'heart',  baseline: 74 },
    spo2: { value: 98,   unit: '%',    trend: 0,   status: 'ok',   label: 'Blood Oxygen',  icon: 'o2',     baseline: 98 },
    temp: { value: 34.2, unit: '°C',   trend: 0.4, status: 'warn', label: 'Skin Temp',     icon: 'temp',   baseline: 33.8 },
    resp: { value: 16,   unit: 'RPM',  trend: 0,   status: 'ok',   label: 'Respiration',   icon: 'resp',   baseline: 16 },
  },

  riskIndex: { score: 24, status: 'Normal', trend: -3, desc: 'All monitored signals are stable. No elevated physiological or environmental risks detected.' },

  environmental: [
    { id: 'heat',      label: 'Heat Exposure',  icon: '🌡',  value: 62, status: 'warn',  statusLabel: 'Moderate' },
    { id: 'air',       label: 'Air Quality',    icon: '💨',  value: 78, status: 'critical', statusLabel: 'Poor' },
    { id: 'hydration', label: 'Hydration',      icon: '💧',  value: 40, status: 'warn',  statusLabel: 'Low' },
    { id: 'activity',  label: 'Activity Load',  icon: '⚡',  value: 30, status: 'ok',    statusLabel: 'Normal' },
  ],

  actions: [
    { id: 'water', category: 'Hydration', title: 'Drink water before going outdoors', desc: 'Consume 400 ml to maintain safe hydration levels.', done: false, severity: 'warn' },
    { id: 'mask',  category: 'Air Quality', title: 'Wear a respirator mask', desc: 'AQI is 156. Extended outdoor exposure is not advised without protection.', done: false, severity: 'critical' },
  ],

  alerts: [
    {
      id: 'a1', severity: 'critical',
      title: 'Cardiac Anomaly',
      sub: '124 BPM sustained for 3 min',
      desc: 'Your heart rate is significantly above your resting baseline. This may indicate physical stress or heat-related strain. Stop exertion and rest.',
      chips: ['HR 124 BPM', 'SpO₂ 93%'],
      time: 'T−2 min',
      action: 'View details',
    },
    {
      id: 'a2', severity: 'warning',
      title: 'Heat Stress Elevated',
      sub: 'Ambient 38°C · Skin 37.8°C',
      desc: 'Ambient temperature has crossed the 38°C safety threshold. Your core temperature regulation may be compromised.',
      chips: ['Ambient 38°C', 'Skin 37.8°C'],
      time: 'T−15 min',
      action: 'View details',
    },
    {
      id: 'a3', severity: 'info',
      title: 'Particulate Matter High',
      sub: 'AQI 156 — Unhealthy',
      desc: 'Air quality is outside safe parameters. Minimise outdoor exposure and consider respiratory protection.',
      chips: ['AQI 156'],
      time: 'T−60 min',
      action: 'View details',
    },
  ],

  devices: [
    {
      id: 'd1', name: 'PHC Field Band',
      status: 'linked', battery: 91,
      lastSync: 'Just now', firmware: 'v2.4.1',
      signal: 4, icon: '⌚',
    },
    {
      id: 'd2', name: 'Mi Band 8',
      status: 'available', battery: 87,
      lastSync: '—', firmware: 'v1.9.0',
      signal: 3, icon: '⌚',
    },
  ],

  // Chart data per metric and range
  chartData: {
    hr: {
      '1H':  { points: [72,74,76,75,78,76,80,94,85,78,79,78], min:62, max:94, avg:78, baseline:74, label:'BPM', unit:'BPM', assessment:'Your heart rate stayed mostly within your resting range. The brief spike was noted but resolved quickly.' },
      '6H':  { points: [68,70,72,74,76,78,75,80,94,78,76,74], min:60, max:94, avg:76, baseline:74, label:'BPM', unit:'BPM', assessment:'Heart rate was slightly elevated mid-morning — consistent with your outdoor activity period.' },
      '24H': { points: [58,60,64,70,74,78,80,76,72,68,66,65], min:58, max:80, avg:70, baseline:74, label:'BPM', unit:'BPM', assessment:'Within expected daily range. Resting values overnight were excellent.' },
      '7D':  { points: [72,74,78,76,75,79,78,80,76,74,73,74], min:60, max:94, avg:76, baseline:74, label:'BPM', unit:'BPM', assessment:'Your 7-day average is stable. No concerning trends detected.' },
    },
    spo2: {
      '1H':  { points: [98,98,97,98,98,93,98,98,99,98,98,98], min:93, max:99, avg:98, baseline:98, label:'%', unit:'%', assessment:'Blood oxygen has been excellent. The brief dip to 93% coincided with elevated heart rate.' },
      '6H':  { points: [99,98,98,97,98,98,97,93,98,99,98,98], min:93, max:99, avg:98, baseline:98, label:'%', unit:'%', assessment:'Stable SpO₂ throughout the morning. Values above 95% are considered healthy.' },
      '24H': { points: [98,99,98,98,97,98,99,98,98,97,98,98], min:97, max:99, avg:98, baseline:98, label:'%', unit:'%', assessment:'Consistently healthy blood oxygen levels across the full day.' },
      '7D':  { points: [98,98,99,98,97,98,98,98,99,98,98,98], min:96, max:99, avg:98, baseline:98, label:'%', unit:'%', assessment:'Blood oxygen has been excellent all week. No concerning trends.' },
    },
    temp: {
      '1H':  { points: [33.8,33.9,34.0,34.1,34.2,34.3,34.4,34.5,34.4,34.3,34.2,34.2], min:33.8, max:34.5, avg:34.2, baseline:33.8, label:'°C', unit:'°C', assessment:'Skin temperature has been gradually rising — likely due to ambient heat exposure. Consider cooling down.' },
      '6H':  { points: [33.2,33.4,33.8,34.0,34.2,34.4,34.5,34.4,34.3,34.2,34.1,34.2], min:33.2, max:34.5, avg:34.0, baseline:33.8, label:'°C', unit:'°C', assessment:'Temperature has been rising since morning, tracking with outdoor conditions.' },
      '24H': { points: [33.0,33.2,33.5,33.8,34.2,34.4,34.3,34.0,33.8,33.5,33.3,33.2], min:33.0, max:34.4, avg:33.7, baseline:33.8, label:'°C', unit:'°C', assessment:'Natural circadian temperature variation observed. Peak at midday, cooling overnight.' },
      '7D':  { points: [33.5,33.7,33.8,34.0,34.2,34.1,33.9,33.8,34.0,34.2,34.1,34.2], min:33.2, max:34.5, avg:33.9, baseline:33.8, label:'°C', unit:'°C', assessment:'Temperature trending slightly higher over the week, consistent with recent heat conditions.' },
    },
    resp: {
      '1H':  { points: [15,16,15,16,17,18,17,16,16,15,16,16], min:14, max:18, avg:16, baseline:16, label:'RPM', unit:'RPM', assessment:'Respiration is normal and consistent with resting and light activity.' },
      '6H':  { points: [14,15,16,16,17,18,17,16,15,16,15,16], min:14, max:18, avg:16, baseline:16, label:'RPM', unit:'RPM', assessment:'Respiration has been calm and within healthy bounds throughout the morning.' },
      '24H': { points: [14,14,15,16,17,18,16,15,14,14,14,14], min:12, max:18, avg:15, baseline:16, label:'RPM', unit:'RPM', assessment:'Lower overnight respiration is completely normal during sleep.' },
      '7D':  { points: [15,16,15,16,16,17,16,15,16,16,15,16], min:13, max:18, avg:16, baseline:16, label:'RPM', unit:'RPM', assessment:'Respiration has been stable all week. No irregularities detected.' },
    },
  },

  activeMetric: 'hr',
  activeRange: '1H',
};
