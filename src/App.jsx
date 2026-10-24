import { useEffect, useState } from "react";
import "./App.css";

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const BASE = "https://api.openweathermap.org/data/2.5";

function getBackground(weatherMain, icon) {
  const isNight = icon?.includes("n");
  const condition = weatherMain?.toLowerCase();

  if (condition === "clear") return isNight ? "linear-gradient(135deg, #0f2027, #203a43, #2c5364)" : "linear-gradient(135deg, #00b4db, #0083b0)";
  if (condition === "clouds") return isNight ? "linear-gradient(135deg, #232526, #414345)" : "linear-gradient(135deg, #757f9a, #d7dde8)";
  if (condition === "rain" || condition === "drizzle") return "linear-gradient(135deg, #3a7bd5, #3a6073)";
  if (condition === "thunderstorm") return "linear-gradient(135deg, #141e30, #243b55)";
  if (condition === "snow") return "linear-gradient(135deg, #83a4d4, #b6fbff)";
  return isNight ? "linear-gradient(135deg, #141e30, #243b55)" : "linear-gradient(135deg, #e0eafc, #cfdef3)";
}

function getAqiInfo(aqi) {
  switch(aqi) {
    case 1: return { text: "Baik", color: "#4caf50" };
    case 2: return { text: "Sedang", color: "#ffeb3b" };
    case 3: return { text: "Tidak Sehat", color: "#ff9800" };
    case 4: return { text: "Buruk", color: "#f44336" };
    case 5: return { text: "Sangat Buruk", color: "#9c27b0" };
    default: return { text: "N/A", color: "#ccc" };
  }
}

function WeatherEffect({ condition }) {
  if (!condition) return null;
  const cond = condition.toLowerCase();
  const isRain = cond.includes("rain") || cond.includes("drizzle") || cond.includes("thunderstorm");
  const isSnow = cond.includes("snow");
  if (!isRain && !isSnow) return null;

  const particles = Array.from({ length: 50 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    animationDuration: `${Math.random() * 1 + 0.5}s`,
    animationDelay: `${Math.random() * 2}s`,
    opacity: Math.random() * 0.5 + 0.3
  }));

  return (
    <div className="weather-effect-container">
      {particles.map((p) => (
        <div
          key={p.id}
          className={isRain ? "rain-drop" : "snow-flake"}
          style={{
            left: p.left,
            animationDuration: isSnow ? `${Math.random() * 3 + 2}s` : p.animationDuration,
            animationDelay: p.animationDelay,
            opacity: p.opacity,
            width: isSnow ? `${Math.random() * 6 + 4}px` : undefined,
            height: isSnow ? `${Math.random() * 6 + 4}px` : undefined,
          }}
        />
      ))}
    </div>
  );
}

function App() {
  const [city, setCity] = useState(localStorage.getItem("lastCity") || "Jakarta");
  const [input, setInput] = useState(city);
  const [current, setCurrent] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [aqi, setAqi] = useState(null);
  const [unit, setUnit] = useState("metric");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem("favorites");
    return saved ? JSON.parse(saved) : ["Jakarta", "Bandung", "Tokyo"];
  });

  async function fetchWeather(query, isCoords = false) {
    try {
      setLoading(true);
      setError("");
      const queryParam = isCoords ? `lat=${query.lat}&lon=${query.lon}` : `q=${query}`;

      const [curRes, foreRes] = await Promise.all([
        fetch(`${BASE}/weather?${queryParam}&appid=${API_KEY}&units=${unit}&lang=id`),
        fetch(`${BASE}/forecast?${queryParam}&appid=${API_KEY}&units=${unit}&lang=id`),
      ]);

      if (!curRes.ok || !foreRes.ok) throw new Error("Kota tidak ditemukan");

      const curData = await curRes.json();
      const foreData = await foreRes.json();

      const aqiRes = await fetch(`${BASE}/air_pollution?lat=${curData.coord.lat}&lon=${curData.coord.lon}&appid=${API_KEY}`);
      const aqiData = await aqiRes.json();

      setCurrent(curData);
      setForecast(foreData.list.filter((_, i) => i % 8 === 0).slice(0, 5));
      setAqi(aqiData.list[0].main.aqi);
      
      setCity(curData.name);
      setInput(curData.name);
      localStorage.setItem("lastCity", curData.name);
    } catch (err) {
      setError(err.message);
      setCurrent(null);
      setForecast([]);
      setAqi(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchWeather(city);
  }, [unit]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim()) return;
    fetchWeather(input.trim());
  }

  function handleGetLocation() {
    if (!navigator.geolocation) return alert("Browser tidak mendukung lokasi.");
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => fetchWeather({ lat: position.coords.latitude, lon: position.coords.longitude }, true),
      () => { setError("Gagal mendapatkan lokasi."); setLoading(false); }
    );
  }

  function toggleFavorite(cityName) {
    let newFavorites = favorites.includes(cityName)
      ? favorites.filter((fav) => fav !== cityName)
      : [...favorites, cityName];
    setFavorites(newFavorites);
    localStorage.setItem("favorites", JSON.stringify(newFavorites));
  }

  const localTime = current ? new Date((Date.now() + (current.timezone * 1000))).toLocaleTimeString("id-ID", { timeZone: "UTC", hour: "2-digit", minute: "2-digit" }) : "";
  
  const formatTime = (unix) => {
    if (!unix || !current) return "";
    return new Date((unix + current.timezone) * 1000).toLocaleTimeString("id-ID", { timeZone: "UTC", hour: "2-digit", minute: "2-digit" });
  };

  const bgGradient = current ? getBackground(current.weather[0].main, current.weather[0].icon) : "linear-gradient(135deg, #e0eafc, #cfdef3)";
  const isFavorite = current && favorites.includes(current.name);
  const aqiInfo = aqi ? getAqiInfo(aqi) : null;

  return (
    <div className="app-wrapper" style={{ background: bgGradient }}>
      {current && <WeatherEffect condition={current.weather[0].main} />}

      <div className="app-container">
        <h1 className="app-title">Dashboard Cuaca</h1>

        <form onSubmit={handleSubmit} className="search-form">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Cari kota..." className="search-input" />
          <div className="form-buttons">
            <button type="button" onClick={handleGetLocation} className="btn-location" title="Gunakan Lokasi">📍</button>
            <button type="submit" className="btn-search">Cari</button>
            <button type="button" onClick={() => setUnit(unit === "metric" ? "imperial" : "metric")} className="btn-toggle">
              {unit === "metric" ? "°C" : "°F"}
            </button>
          </div>
        </form>

        {favorites.length > 0 && (
          <div className="fav-container">
            {favorites.map((fav) => (
              <button key={fav} onClick={() => fetchWeather(fav)} className={`fav-chip ${city.toLowerCase() === fav.toLowerCase() ? "active" : ""}`}>
                {fav}
              </button>
            ))}
          </div>
        )}

        {loading && !current && <p className="loading-text">Memuat data cuaca...</p>}
        {error && <p className="error-text">{error}</p>}

        {current && (
          <>
            <div className="glass-card">
              <div className="card-header">
                <div className="city-title-wrapper">
                  <h2 className="city-name">{current.name}, {current.sys.country}</h2>
                  <button onClick={() => toggleFavorite(current.name)} className="btn-star">{isFavorite ? "⭐" : "☆"}</button>
                </div>
                <span className="time-badge">🕒 {localTime} Lokal</span>
              </div>
              
              <div className="temp-wrapper">
                <img src={`https://openweathermap.org/img/wn/${current.weather[0].icon}@4x.png`} alt="icon" className="weather-icon" />
                <h1 className="big-temp">{Math.round(current.main.temp)}°</h1>
              </div>
              <p className="description">{current.weather[0].description}</p>
              
              <div className="details-row">
                <div className="detail-item">
                  <span className="detail-label">Kelembapan</span>
                  <strong>{current.main.humidity}%</strong>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Angin</span>
                  <strong>{current.wind.speed} m/s</strong>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Terasa Seperti</span>
                  <strong>{Math.round(current.main.feels_like)}°</strong>
                </div>
              </div>

              <div className="extra-info-row">
                <div className="extra-item">
                  <span className="extra-label">Kualitas Udara</span>
                  <div className="aqi-badge" style={{ backgroundColor: aqiInfo?.color }}>
                    {aqiInfo?.text}
                  </div>
                </div>
                <div className="extra-item">
                  <span className="extra-label">Matahari</span>
                  <div className="sun-times">
                    <span>🌅 {formatTime(current.sys.sunrise)}</span>
                    <span>🌇 {formatTime(current.sys.sunset)}</span>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="forecast-title">Prakiraan 5 Hari Ke Depan</h3>
            <div className="forecast-row">
              {forecast.map((item) => (
                <div key={item.dt} className="forecast-card">
                  <p className="forecast-day">{new Date(item.dt * 1000).toLocaleDateString("id-ID", { weekday: "short" })}</p>
                  <img src={`https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`} alt="icon" className="forecast-icon" />
                  <p className="forecast-temp">{Math.round(item.main.temp)}°</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;