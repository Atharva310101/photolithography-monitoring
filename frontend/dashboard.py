import streamlit as st
import requests
import pandas as pd
import plotly.express as px
from streamlit_autorefresh import st_autorefresh

BACKEND = "http://localhost:4000"

st.set_page_config(page_title="Photolithography Dashboard", layout="wide")

# Auto-refresh every 5 seconds
st_autorefresh(interval=5000, limit=None)

# -----------------------------
# Global CSS for compact layout
# -----------------------------
st.markdown("""
<style>
    .block-container {
        padding-top: 1rem;
        padding-bottom: 1rem;
    }
    /* Increase sidebar font size significantly for readability */
    [data-testid="stSidebar"] {
        font-size: 1.3rem;
    }
    [data-testid="stSidebar"] p {
        font-size: 1.3rem !important;
    }
    [data-testid="stSidebar"] label {
        font-size: 1.3rem !important;
    }
    /* Style the sidebar buttons to be vertical and large */
    section[data-testid="stSidebar"] div.stButton button {
        width: 100%;
        height: 4.5rem;
        font-size: 1.4rem !important;
        font-weight: bold !important;
        margin-bottom: 1rem;
        border-radius: 12px;
        text-transform: uppercase;
        letter-spacing: 1px;
    }
</style>
""", unsafe_allow_html=True)

# -----------------------------
# Centered Title + Description
# -----------------------------
st.markdown(
    "<h1 style='text-align:center;'>Photolithography Monitoring Dashboard</h1>",
    unsafe_allow_html=True
)

st.markdown(
    """
    <p style='text-align:center; font-size:20px; color:#ffffff;'>
    Real‑time monitoring of photolithography equipment with anomaly detection, hybrid severity scoring, and machine health analytics.
    </p>
    """,
    unsafe_allow_html=True
)

# -----------------------------
# Backend API helper functions
# -----------------------------
def safe_get(url):
    try:
        return requests.get(url, timeout=3).json()
    except Exception:
        return None

def get_latest(machine_id):
    return safe_get(f"{BACKEND}/dashboard/machines/{machine_id}/latest")

def get_timeline(machine_id, minutes=30):
    return safe_get(f"{BACKEND}/dashboard/machines/{machine_id}/timeline?minutes={minutes}")

def get_health(machine_id):
    return safe_get(f"{BACKEND}/dashboard/machines/{machine_id}/health")

def get_overview():
    return safe_get(f"{BACKEND}/dashboard/stats/overview")

def get_alerts():
    return safe_get(f"{BACKEND}/dashboard/alerts")

# -----------------------------
# Sidebar Selection (Vertical Buttons)
# -----------------------------
st.sidebar.markdown("### 🖥️ Equipment Selection")

# Initialize session state
if "selected_machine" not in st.session_state:
    st.session_state.selected_machine = 1

def update_machine(mid):
    st.session_state.selected_machine = mid

# Create vertical buttons
for i in range(1, 5):
    st.sidebar.button(
        f"MACHINE {i}",
        key=f"btn_m{i}",
        on_click=update_machine,
        args=(i,),
        type="primary" if st.session_state.selected_machine == i else "secondary",
        use_container_width=True
    )

machine_id = st.session_state.selected_machine

# -----------------------------
# Fetch data
# -----------------------------
latest = get_latest(machine_id)
health = get_health(machine_id)
timeline = get_timeline(machine_id, minutes=30)

# -----------------------------
# Row 1: Machine Status / Telemetry / Health
# -----------------------------
col1, col2, col3 = st.columns(3)

with col1:
    st.subheader("Machine Status")

    if latest:
        status = latest.get("status", "unknown")
        badge = "🟢 Running" if status == "running" else "🟡 Idle" if status == "idle" else "⚪ Unknown"
        st.metric("Status", badge)
    else:
        st.write("No data available")

with col2:
    st.subheader("Latest Telemetry")

    if latest:
        st.metric("Temperature (°C)", latest["temperature"])
        st.metric("Pressure (atm)", latest["pressure"])
        st.metric("Alignment Error", latest["alignment_error"])
        st.metric("Throughput (wph)", latest["throughput"])
    else:
        st.write("No data available")

with col3:
    st.subheader("Machine Health")

    if health:
        score = health["health"]
        severity = health.get("severity", "HEALTHY")

        # Severity badge
        if severity == "CRITICAL":
            st.markdown("### 🟥 **CRITICAL**")
        elif severity == "MAJOR":
            st.markdown("### 🟧 **MAJOR**")
        elif severity == "MINOR":
            st.markdown("### 🟨 **MINOR**")
        else:
            st.markdown("### 🟩 **HEALTHY**")

        # Health score
        color = "🟢" if score >= 80 else "🟡" if score >= 50 else "🔴"
        st.metric("Health Score", f"{color} {score}")

    else:
        st.write("No health data")

# -----------------------------
# Row 2: Counters / Flags / Trend
# -----------------------------
c1, c2, c3 = st.columns([1, 1, 2])

with c1:
    st.subheader("Anomaly Counts")

    if health:
        counts = health["anomaly_counts"]
        st.write(f"- Temperature spikes: **{counts['temp_spike']}**")
        st.write(f"- Throughput drops: **{counts['throughput_drop']}**")
        st.write(f"- Pressure lows: **{counts['pressure_low']}**")
        st.write(f"- Drift events: **{counts['drift']}**")
        st.write(f"- Z-score anomalies: **{counts['zscore']}**")
    else:
        st.write("No data")

with c2:
    st.subheader("Flags")

    if health and health["flags"]:
        for f in health["flags"]:
            st.write(f"- {f}")
    else:
        st.write("No active flags")

with c3:
    st.subheader("Health Trend")

    if health and health["trend"]:
        trend_df = pd.DataFrame(health["trend"])
        trend_df["timestamp"] = pd.to_datetime(trend_df["timestamp"])
        st.line_chart(trend_df.set_index("timestamp")["health"])
    else:
        st.write("No trend data")

# -----------------------------
# Row 3 & 4: 2×2 Graph Grid
# -----------------------------
if timeline:
    df = pd.DataFrame(timeline)
    df["timestamp"] = pd.to_datetime(df["timestamp"])

    g1, g2 = st.columns(2)
    with g1:
        st.subheader("Temperature Trend")
        fig = px.line(df, x="timestamp", y="temperature")
        fig.update_layout(height=300)
        st.plotly_chart(fig, use_container_width=True)

    with g2:
        st.subheader("Throughput Trend")
        fig2 = px.line(df, x="timestamp", y="throughput")
        fig2.update_layout(height=300)
        st.plotly_chart(fig2, use_container_width=True)

    g3, g4 = st.columns(2)
    with g3:
        st.subheader("Pressure Trend")
        fig3 = px.line(df, x="timestamp", y="pressure")
        fig3.update_layout(height=300)
        st.plotly_chart(fig3, use_container_width=True)

    with g4:
        st.subheader("Alignment Error Trend")
        fig4 = px.line(df, x="timestamp", y="alignment_error")
        fig4.update_layout(height=300)
        st.plotly_chart(fig4, use_container_width=True)

# -----------------------------
# Fab Overview + Alerts
# -----------------------------
with st.expander("Fab Overview (Last 10 min)", expanded=False):
    overview = get_overview()
    if overview:
        colA, colB, colC = st.columns(3)
        colA.metric("Avg Temperature", round(overview["avg_temperature"], 2))
        colB.metric("Avg Pressure", round(overview["avg_pressure"], 3))
        colC.metric("Avg Throughput", round(overview["avg_throughput"], 2))
    else:
        st.write("No overview data")

with st.expander("Active Alerts", expanded=False):
    alerts = get_alerts()
    if alerts:
        alert_df = pd.DataFrame(alerts)
        st.dataframe(alert_df)
    else:
        st.write("No active alerts")