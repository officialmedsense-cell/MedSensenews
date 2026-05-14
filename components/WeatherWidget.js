'use client';

import { useState, useEffect } from 'react';

const WMO_CODES = {
  0: { label: 'Clear Sky', icon: 'fa-sun' },
  1: { label: 'Mainly Clear', icon: 'fa-sun' },
  2: { label: 'Partly Cloudy', icon: 'fa-cloud-sun' },
  3: { label: 'Overcast', icon: 'fa-cloud' },
  45: { label: 'Foggy', icon: 'fa-smog' },
  48: { label: 'Icy Fog', icon: 'fa-smog' },
  51: { label: 'Light Drizzle', icon: 'fa-cloud-rain' },
  53: { label: 'Drizzle', icon: 'fa-cloud-rain' },
  55: { label: 'Heavy Drizzle', icon: 'fa-cloud-showers-heavy' },
  61: { label: 'Light Rain', icon: 'fa-cloud-rain' },
  63: { label: 'Rain', icon: 'fa-cloud-rain' },
  65: { label: 'Heavy Rain', icon: 'fa-cloud-showers-heavy' },
  71: { label: 'Light Snow', icon: 'fa-snowflake' },
  73: { label: 'Snow', icon: 'fa-snowflake' },
  75: { label: 'Heavy Snow', icon: 'fa-snowflake' },
  80: { label: 'Rain Showers', icon: 'fa-cloud-showers-heavy' },
  95: { label: 'Thunderstorm', icon: 'fa-bolt' },
  99: { label: 'Thunderstorm', icon: 'fa-bolt' },
};

const getHealthAdvice = (code, temp) => {
  if (code >= 95) return { text: 'Thunderstorm risk — stay indoors', color: '#ef4444' };
  if (code >= 71) return { text: 'Cold & snow — dress warmly', color: '#60a5fa' };
  if (code >= 51) return { text: 'Rainy — risk of cold & flu', color: '#818cf8' };
  if (temp > 35) return { text: 'Extreme heat — stay hydrated', color: '#f97316' };
  if (temp > 28) return { text: 'Hot — limit outdoor exposure', color: '#fb923c' };
  if (temp < 10) return { text: 'Cold — layer up to stay healthy', color: '#38bdf8' };
  return { text: 'Good conditions for outdoor activity', color: '#22c55e' };
};

export default function WeatherWidget() {
  const [weather, setWeather] = useState(null);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const geoData = await geoRes.json();
          const city =
            geoData.address?.city ||
            geoData.address?.town ||
            geoData.address?.village ||
            geoData.address?.county ||
            'Your Location';
          const country = geoData.address?.country_code?.toUpperCase() || '';
          setLocation(`${city}${country ? ', ' + country : ''}`);

          const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weathercode&temperature_unit=celsius&wind_speed_unit=kmh`
          );
          const weatherData = await weatherRes.json();
          const current = weatherData.current;
          setWeather({
            temp: Math.round(current.temperature_2m),
            humidity: current.relative_humidity_2m,
            wind: Math.round(current.wind_speed_10m),
            code: current.weathercode,
          });
        } catch (e) {
          setError('Unable to fetch weather data.');
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError('Location access denied. Please allow location to see weather.');
        setLoading(false);
      }
    );
  }, []);

  const condition = weather ? (WMO_CODES[weather.code] || { label: 'Unknown', icon: 'fa-cloud' }) : null;

  return (
    <div className="weather-widget-container">
      {/* Weather Card */}
      <div className="weather-info-card">
        {/* Background decoration */}
        <div style={{
          position: 'absolute', top: '-10px', right: '-10px',
          fontSize: '5rem', opacity: 0.08, pointerEvents: 'none'
        }}>
          <i className="fas fa-cloud-sun"></i>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', marginBottom: '0.5rem', display: 'block' }}></i>
            <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8 }}>Detecting location...</p>
          </div>
        )}

        {error && !loading && (
          <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
            <i className="fas fa-map-marker-slash" style={{ fontSize: '1.5rem', marginBottom: '0.5rem', display: 'block', opacity: 0.8 }}></i>
            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.85 }}>{error}</p>
          </div>
        )}

        {weather && !loading && (
          <div>
            {/* Location */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8, marginBottom: '0.2rem' }}>
                  <i className="fas fa-map-marker-alt" style={{ marginRight: '0.4rem' }}></i>Local Weather
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{location}</div>
              </div>
              <div style={{ fontSize: '0.65rem', fontWeight: 600, opacity: 0.7 }}>Live Update</div>
            </div>

            {/* Temp & Condition */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
              <i className={`fas ${condition.icon}`} style={{ fontSize: '2.5rem', opacity: 0.95 }}></i>
              <div>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, lineHeight: 1 }}>{weather.temp}°C</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.9, marginTop: '0.2rem' }}>{condition.label}</div>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', opacity: 0.9 }}>
                <i className="fas fa-tint"></i> {weather.humidity}%
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', opacity: 0.9 }}>
                <i className="fas fa-wind"></i> {weather.wind} km/h
              </div>
            </div>

            {/* Health Advice */}
            {(() => {
              const advice = getHealthAdvice(weather.code, weather.temp);
              return (
                <div style={{
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: '6px',
                  padding: '0.4rem 0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backdropFilter: 'blur(4px)'
                }}>
                  <i className="fas fa-heartbeat" style={{ color: advice.color }}></i>
                  <span>{advice.text}</span>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
