# 📡 Photolithography Monitoring Dashboard  
### Real‑time equipment monitoring with anomaly detection, hybrid severity scoring, and interactive analytics

This project is a **locally runnable, production‑grade monitoring system** designed to simulate and visualize the health of photolithography equipment. It includes:

- A **Node.js + Express backend**
- A **PostgreSQL database**
- A **synthetic telemetry generator**
- A **Streamlit dashboard**
- A **hybrid anomaly detection engine**
- A **machine health scoring system**
- A **compact, screenshot‑friendly UI**
- Automatic cleanup to keep the database small

The system continuously ingests synthetic telemetry, computes machine health in real time, and displays trends, alerts, and analytics in a clean, professional dashboard.

---

## 🚀 Features

### **Real‑time Telemetry**
Each machine generates live telemetry:
- Temperature  
- Pressure  
- Alignment error  
- Throughput  

Data is stored in PostgreSQL and updated every second.

### **Hybrid Anomaly Detection**
The backend computes anomalies using:
- Raw thresholds  
- Z‑scores  
- Drift detection  
- Worst‑case severity logic  

This produces realistic fab‑style alerts.

### **Machine Health Scoring**
Each machine receives a health score (0–100) based on:
- Recent anomalies  
- Statistical deviations  
- Trend behavior  
- Severity ranking  

Severity levels:
- 🟩 HEALTHY  
- 🟨 MINOR  
- 🟧 MAJOR  
- 🟥 CRITICAL  

### **Interactive Dashboard**
Built with Streamlit:
- Compact 3‑column machine overview  
- Anomaly counters  
- Flags  
- Health trend sparkline  
- 2×2 graph grid (temperature, throughput, pressure, alignment error)  
- Fab‑level overview  
- Active alerts table  

### **Automatic Database Cleanup**
To prevent storage bloat, the backend keeps only the **latest 50,000 rows per machine**.

---

## 🧱 Architecture Overview

```
┌──────────────────────────┐
│   Synthetic Data Engine   │
│  (Node.js, cron-based)    │
└──────────────┬───────────┘
               │ inserts
               ▼
┌──────────────────────────┐
│       PostgreSQL DB       │
│  telemetry + machines     │
└──────────────┬───────────┘
               │ queries
               ▼
┌──────────────────────────┐
│  Backend API (Express)    │
│  /latest /timeline /health│
│  /overview /alerts        │
└──────────────┬───────────┘
               │ JSON
               ▼
┌──────────────────────────┐
│   Streamlit Dashboard     │
│   Real‑time visualization │
└──────────────────────────┘
```

---

## 📦 Tech Stack

### **Backend**
- Node.js  
- Express  
- PostgreSQL  
- pg (Postgres client)  
- Cron‑based cleanup  

### **Frontend**
- Streamlit  
- Plotly  
- Pandas  

### **Infrastructure**
- Local PostgreSQL instance  
- Optional Docker setup  

---

## 🗄 Database Schema

### **machines**
| column | type |
|--------|------|
| id | integer |
| name | text |
| status | text |

### **telemetry**
| column | type |
|--------|------|
| id | integer |
| machine_id | integer |
| timestamp | timestamptz |
| temperature | float |
| pressure | float |
| alignment_error | float |
| throughput | float |

---

## ⚙️ Setup Instructions

### **1. Clone the repository**
```
git clone <your-repo-url>
cd photolithography-dashboard
```

### **2. Install backend dependencies**
```
cd backend
npm install
```

### **3. Start PostgreSQL**
Create a database named:
```
photolithography
```

Run the schema SQL (tables + seed machines).

### **4. Start the backend**
```
npm run dev
```

Backend runs at:
```
http://localhost:4000
```

### **5. Install dashboard dependencies**
```
cd ../dashboard
pip install -r requirements.txt
```

### **6. Run the dashboard**
```
streamlit run app.py
```

Dashboard runs at:
```
http://localhost:8501
```

---

## 🧹 Automatic Cleanup (50k rows per machine)

The backend includes a scheduled cleanup job:

- Runs every 10 minutes  
- Keeps only the **latest 50,000 rows per machine**  
- Prevents database growth  
- Keeps storage under ~20–30 MB  

Cleanup logic lives in:

```
src/services/cleanup.service.ts
```

---

## 📊 Screenshots

(Add your dashboard screenshots here — they will look great with your new UI.)

---

## 🧪 Testing

You can test the system by:

- Changing synthetic data generation rates  
- Introducing anomalies  
- Watching severity and health scores update  
- Observing alerts populate  
- Checking cleanup behavior  

---

## 📝 Future Enhancements

- Fab‑level heatmap  
- Predictive maintenance model  
- WebSocket live updates  
- Multi‑fab support  

---

## 👤 Author

**Atharva Pargaonkar** 