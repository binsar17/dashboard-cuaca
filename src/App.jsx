import { useEffect, useState } from "react";

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const BASE = "https://api.openweathermap.org/data/2.5";

// Fungsi untuk menentukan warna background berdasarkan cuaca
function getBackground(weatherMain, icon) {
  const isNight = icon?.includes("n");
  const condition = weatherMain?.toLowerCase();

  if (condition === "clear") {
    return isNight 
      ? "linear-gradient(135deg, #0f2027, #203a43, #2c5364)" // Malam cerah
      : "linear-gradient(135deg, #00b4db, #0083b0)"; // Siang cerah
  }
  if (condition === "clouds") {
    return isNight 
      ? "linear-gradient(135deg, #232526, #414345)" 
      : "linear-gradient(135deg, #757f9a, #d7dde8)";
  }
  if (condition === "rain" || condition === "drizzle") {
    return "linear-gradient(135deg, #3a7bd5, #3a6073)";
  }
  if (condition === "thunderstorm") {
    return "linear-gradient(135deg, #141e30, #243b55)";
  }
  if (condition === "snow") {
    return "linear-gradient(135deg, #83a4d4, #b6fbff)";
  }
  return isNight ? "linear-gradient(135deg, #141e30, #243b55)" : "linear-gradient(135deg, #e0eafc, #cfdef3)";
}

function App() {
  const [city, setCity] = useState(localStorage.getItem("lastCity") || "Jakarta");
  const [input, setInput] = useState(city);
  const [current, setCurrent] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [unit, setUnit] = useState("metric");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchWeather(query, isCoords = false) {
    try {
      setLoading(true);
      setError("");

      const queryParam = isCoords 
        ? `lat=${query.lat}&lon=${query.lon}` 
        : `q=${query}`;

      const [curRes, foreRes] = await Promise.all([
        fetch(`${BASE}/weather?${queryParam}&appid=${API_KEY}&units=${unit}&lang=id`),
        fetch(`${BASE}/forecast?${queryParam}&appid=${API_KEY}&units=${unit}&lang=id`),
      ]);

      if (!curRes.ok || !foreRes.ok) throw new Error("Kota tidak ditemukan");

      const curData = await curRes.json();
      const foreData = await foreRes.json();

      setCurrent(curData);
      setForecast(foreData.list.filter((_, i) => i % 8 === 0).slice(0, 5));
      
      setCity(curData.name);
      setInput(curData.name);
      localStorage.setItem("lastCity", curData.name);
    } catch (err) {
      setError(err.message);
      setCurrent(null);
      setForecast([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchWeather(city);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim()) return;
    fetchWeather(input.trim());
  }

  // Fitur Deteksi Lokasi
  function handleGetLocation() {
    if (!navigator.geolocation) {
      alert("Browser kamu tidak mendukung fitur lokasi.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchWeather({ lat: latitude, lon: longitude }, true);
      },
      () => {
        setError("Gagal mendapatkan lokasi. Pastikan izin lokasi diaktifkan.");
        setLoading(false);
      }
    );
  }

  // Menghitung waktu lokal di kota tersebut
  const localTime = current 
    ? new Date((Date.now() + (current.timezone * 1000))).toLocaleTimeString("id-ID", { timeZone: "UTC", hour: "2-digit", minute: "2-digit" })
    : "";

  const bgGradient = current 
    ? getBackground(current.weather[0].main, current.weather[0].icon)
    : "linear-gradient(135deg, #e0eafc, #cfdef3)";

  return (
    <div style={{ ...styles.wrapper, background: bgGradient }}>
      <div style={styles.container}>
        <h1 style={styles.title}>Dashboard Cuaca</h1>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Cari kota..."
            style={styles.input}
          />
          <button type="button" onClick={handleGetLocation} style={styles.btnLocation} title="Gunakan Lokasi Saat Ini">
            📍
          </button>
          <button type="submit" style={styles.btnSearch}>Cari</button>
          <button 
            type="button" 
            onClick={() => setUnit(unit === "metric" ? "imperial" : "metric")} 
            style={styles.btnToggle}
          >
            {unit === "metric" ? "°C" : "°F"}
          </button>
        </form>

        {loading && <p style={styles.loadingText}>Memuat data cuaca...</p>}
        {error && <p style={styles.error}>{error}</p>}

        {current && (
          <>
            {/* Kartu Cuaca Utama (Glassmorphism) */}
            <div style={styles.glassCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={styles.cityName}>{current.name}, {current.sys.country}</h2>
                <span style={styles.time}>🕒 {localTime} Lokal</span>
              </div>
              
              <div style={styles.tempWrapper}>
                <img 
                  src={`https://openweathermap.org/img/wn/${current.weather[0].icon}@4x.png`} 
                  alt="icon" 
                  style={{ width: 140, height: 140 }}
                />
                <h1 style={styles.bigTemp}>{Math.round(current.main.temp)}°</h1>
              </div>
              <p style={styles.description}>{current.weather[0].description}</p>
              
              <div style={styles.detailsRow}>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Kelembapan</span>
                  <strong>{current.main.humidity}%</strong>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Angin</span>
                  <strong>{current.wind.speed} m/s</strong>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Terasa Seperti</span>
                  <strong>{Math.round(current.main.feels_like)}°</strong>
                </div>
              </div>
            </div>

            {/* Prakiraan 5 Hari */}
            <h3 style={styles.forecastTitle}>Prakiraan 5 Hari Ke Depan</h3>
            <div style={styles.forecastRow}>
              {forecast.map((item) => (
                <div key={item.dt} style={styles.forecastCard}>
                  <p style={styles.forecastDay}>
                    {new Date(item.dt * 1000).toLocaleDateString("id-ID", { weekday: "short" })}
                  </p>
                  <img 
                    src={`https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`} 
                    alt="icon" 
                    style={{ width: 60, height: 60, margin: "10px 0" }} 
                  />
                  <p style={styles.forecastTemp}>{Math.round(item.main.temp)}°</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// --- STYLING ---
const styles = {
  wrapper: {
    minHeight: "100vh",
    width: "100%",
    transition: "background 1s ease-in-out", // Animasi transisi background
    padding: "40px 0",
    boxSizing: "border-box",
  },
  container: {
    maxWidth: 800,
    margin: "0 auto",
    padding: "0 20px",
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  title: {
    textAlign: "center",
    fontSize: "2.8rem",
    marginBottom: "30px",
    color: "#fff",
    textShadow: "0 4px 10px rgba(0,0,0,0.3)", // Biar teks kebaca di background apapun
    fontWeight: "800",
  },
  form: {
    display: "flex",
    gap: "10px",
    marginBottom: "30px",
    background: "rgba(255, 255, 255, 0.2)",
    padding: "15px",
    borderRadius: "16px",
    backdropFilter: "blur(10px)",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
  },
  input: {
    flex: 1,
    padding: "12px 16px",
    borderRadius: "10px",
    border: "none",
    fontSize: "16px",
    outline: "none",
    background: "rgba(255, 255, 255, 0.9)",
  },
  btnSearch: {
    padding: "12px 24px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#333",
    color: "white",
    fontSize: "16px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  btnLocation: {
    padding: "12px 16px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#fff",
    fontSize: "18px",
    cursor: "pointer",
  },
  btnToggle: {
    padding: "12px 20px",
    borderRadius: "10px",
    border: "2px solid #fff",
    backgroundColor: "transparent",
    color: "#fff",
    fontSize: "16px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  loadingText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "bold",
    fontSize: "1.2rem",
  },
  error: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    padding: "10px",
    backgroundColor: "rgba(255, 77, 79, 0.8)",
    borderRadius: "8px",
    backdropFilter: "blur(5px)",
  },
  glassCard: {
    backgroundColor: "rgba(255, 255, 255, 0.85)", // Transparan
    backdropFilter: "blur(15px)", // Efek kaca
    border: "1px solid rgba(255, 255, 255, 0.5)",
    color: "#333",
    padding: "30px",
    borderRadius: "20px",
    boxShadow: "0 15px 35px rgba(0,0,0,0.2)",
    textAlign: "center",
  },
  cityName: {
    margin: 0,
    fontSize: "1.8rem",
    color: "#111",
    fontWeight: "700",
  },
  time: {
    fontSize: "1rem",
    color: "#555",
    fontWeight: "600",
    backgroundColor: "rgba(0,0,0,0.05)",
    padding: "5px 10px",
    borderRadius: "8px",
  },
  tempWrapper: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "10px",
    margin: "10px 0",
  },
  bigTemp: {
    fontSize: "5.5rem",
    margin: 0,
    fontWeight: "800",
    color: "#111",
    letterSpacing: "-2px",
  },
  description: {
    textTransform: "capitalize",
    fontSize: "1.4rem",
    margin: "0 0 20px 0",
    color: "#333",
    fontWeight: "500",
  },
  detailsRow: {
    display: "flex",
    justifyContent: "space-around",
    borderTop: "1px solid rgba(0,0,0,0.1)",
    paddingTop: "20px",
    marginTop: "20px",
  },
  detailItem: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    fontSize: "1.1rem",
    color: "#222",
  },
  detailLabel: {
    fontSize: "0.85rem",
    color: "#555",
    textTransform: "uppercase",
    letterSpacing: "1px",
    fontWeight: "600",
  },
  forecastTitle: {
    marginTop: "30px",
    color: "#fff",
    textShadow: "0 2px 5px rgba(0,0,0,0.3)",
  },
  forecastRow: {
    display: "flex",
    gap: "15px",
    overflowX: "auto",
    paddingBottom: "15px",
  },
  forecastCard: {
    flex: "0 0 auto",
    width: "110px",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.4)",
    color: "#333",
    padding: "15px 10px",
    borderRadius: "16px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  forecastDay: {
    fontWeight: "700",
    margin: 0,
    fontSize: "1rem",
    color: "#222",
  },
  forecastTemp: {
    fontSize: "1.5rem",
    fontWeight: "800",
    margin: "5px 0",
    color: "#111",
  },
};

export default App;