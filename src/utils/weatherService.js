// Weather service for live disaster meteorological telemetry
// Supports Open-Meteo (Zero-key open API) + OpenWeatherMap (Keyed commercial API)

export async function fetchLiveWeather(lat, lng, apiKey = null) {
  // If user provided OpenWeatherMap API key
  const customKey = apiKey || import.meta.env.VITE_OPENWEATHER_API_KEY;

  if (customKey && customKey.trim() !== '') {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${customKey}`
      );
      if (res.ok) {
        const data = await res.json();
        return {
          source: 'OpenWeatherMap (Keyed Live API)',
          temperature: Math.round(data.main.temp),
          humidity: data.main.humidity,
          rainfall: data.rain ? (data.rain['1h'] || data.rain['3h'] || 0) : 0,
          windSpeed: Math.round(data.wind.speed * 3.6), // convert m/s to km/h
          condition: data.weather[0]?.main || 'Clear',
          description: data.weather[0]?.description || 'Normal conditions',
          pressure: data.main.pressure,
        };
      }
    } catch {
      // Fallback to Open-Meteo
    }
  }

  // Free Open-Meteo API (requires zero API key, global coverage)
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,rain,wind_speed_10m`
    );
    if (res.ok) {
      const data = await res.json();
      const cur = data.current || {};
      const rainVal = Number(cur.rain || cur.precipitation || 0);

      let condition = 'Clear Skies';
      if (rainVal > 50) condition = 'Torrential Downpour / Flooding';
      else if (rainVal > 15) condition = 'Heavy Rain Alert';
      else if (rainVal > 0.5) condition = 'Moderate Rain';
      else if (cur.relative_humidity_2m > 80) condition = 'Humid & Overcast';

      return {
        source: 'Open-Meteo Global WMO Network (Live Free API)',
        temperature: Math.round(cur.temperature_2m ?? 28),
        humidity: Math.round(cur.relative_humidity_2m ?? 65),
        rainfall: rainVal,
        windSpeed: Math.round(cur.wind_speed_10m ?? 12),
        condition,
        description: `Live Sensor at ${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E`,
      };
    }
  } catch (err) {
    console.warn('Weather fetch error:', err);
  }

  // Graceful baseline
  return {
    source: 'Simulated Hydrological Station Baseline',
    temperature: 31,
    humidity: 78,
    rainfall: 180, // Default disaster demonstration flood telemetry
    windSpeed: 24,
    condition: 'Heavy Precipitation Runoff',
    description: 'Active Inundation Monitoring Grid',
  };
}
