import streamlit as st
import requests
import pandas as pd
import plotly.express as px
import altair as alt
from streamlit_autorefresh import st_autorefresh

BACKEND = "http://localhost:4000"

st.set_page_config(page_title="Fab Equipment Telemetry Dashboard", layout="wide")

if "nav" not in st.session_state:
    st.session_state.nav = "Home"   

if st.session_state.get("nav", "Home") == "Home":
    st_autorefresh(interval=5000, limit=None)

# -----------------------------
# Global CSS
# -----------------------------
st.markdown("""
<style>
    .block-container { padding-top: 1rem; padding-bottom: 1rem; }

    .navbar {
        display: flex;
        justify-content: center;
        gap: 2rem;
        margin-top: 1rem;
        margin-bottom: 2rem;
    }
    .navbutton {
        padding: 0.6rem 1.2rem;
        border-radius: 8px;
        background-color: #262730;
        color: white;
        font-weight: 600;
        cursor: pointer;
        border: 1px solid #444;
    }
    .navbutton:hover {
        background-color: #333;
    }
    .big-stat-text {
        font-size: 1.25rem !important;
        margin-bottom: 0.3rem !important;
    }
    /* Increase size of input labels and text */
    .stTextArea label p, .stTextInput label p {
        font-size: 1.3rem !important;
        font-weight: 600 !important;
    }
    .stTextArea textarea, .stTextInput input {
        font-size: 1.2rem !important;
    }
    .chat-message {
        font-size: 1.15rem !important;
        margin-bottom: 1rem !important;
        line-height: 1.6 !important;
    }
</style>
""", unsafe_allow_html=True)

# -----------------------------
# Title + Top-Right Navigation
# -----------------------------
col_title, col_nav = st.columns([3, 2])

with col_title:
    st.markdown("<h1 style='text-align:left;'>Fab Equipment Telemetry & Analytics Dashboard</h1>", unsafe_allow_html=True)

with col_nav:
    st.markdown("""
        <style>
            [data-testid="stAppViewContainer"] section.main .stButton > button {
                font-size: 1.3rem !important;
                padding: 0.5rem 1rem !important;
                border-radius: 8px !important;
                background-color: #262730 !important;
                color: white !important;
                font-weight: 600 !important;
                border: 1px solid #444 !important;
                cursor: pointer !important;
            }
            [data-testid="stAppViewContainer"] section.main .stButton > button:hover {
                background-color: #333 !important;
            }
        </style>
    """, unsafe_allow_html=True)

    nav_col1, nav_col2, nav_col3 = st.columns(3)
    with nav_col1:
        if st.button("🏠 Home"):
            st.session_state.nav = "Home"
    with nav_col2:
        if st.button("🤖 Chat with AI"):
            st.session_state.nav = "Chat"
    with nav_col3:
        if st.button("📊 Data Analysis"):
            st.session_state.nav = "SQL"

# -----------------------------
# Backend Helpers
# -----------------------------
def safe_get(url):
    try:
        return requests.get(url, timeout=3).json()
    except:
        return None

def get_latest(mid): return safe_get(f"{BACKEND}/dashboard/machines/{mid}/latest")
def get_timeline(mid, minutes=30): return safe_get(f"{BACKEND}/dashboard/machines/{mid}/timeline?minutes={minutes}")
def get_health(mid): return safe_get(f"{BACKEND}/dashboard/machines/{mid}/health")
def get_overview(): return safe_get(f"{BACKEND}/dashboard/stats/overview")
def get_alerts(): return safe_get(f"{BACKEND}/dashboard/alerts")

# -----------------------------
# MACHINE SELECTION (Shared)
# -----------------------------
st.sidebar.markdown("### 🖥️ Equipment Selection")

if "selected_machine" not in st.session_state:
    st.session_state.selected_machine = 1

def update_machine(mid):
    st.session_state.selected_machine = mid

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

# ============================================================
# ⭐ PAGE 1 — HOME (Monitoring Dashboard)
# ============================================================
if st.session_state.nav == "Home":

    latest = get_latest(machine_id)
    health = get_health(machine_id)
    timeline = get_timeline(machine_id, minutes=30)

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
            badge = {
                "CRITICAL": "🟥 **CRITICAL**",
                "MAJOR": "🟧 **MAJOR**",
                "MINOR": "🟨 **MINOR**",
                "HEALTHY": "🟩 **HEALTHY**"
            }.get(severity, "🟩 **HEALTHY**")
            st.markdown(f"### {badge}")
            color = "🟢" if score >= 80 else "🟡" if score >= 50 else "🔴"
            st.metric("Health Score", f"{color} {score}")
        else:
            st.write("No health data")

    # -----------------------------
    # Anomaly Counts / Flags / Trend
    # -----------------------------
    c1, c2, c3 = st.columns([1, 1, 2])

    with c1:
        st.subheader("Anomaly Counts")
        if health:
            counts = health["anomaly_counts"]
            for k, v in counts.items():
                label = k.replace('_', ' ').title()
                st.markdown(f'<div class="big-stat-text"> - {label}: {v}</div>', unsafe_allow_html=True)
        else:
            st.write("No data")

    with c2:
        st.subheader("Flags")
        if health and health["flags"]:
            for f in health["flags"]:
                st.markdown(f'<div class="big-stat-text"> - {f}</div>', unsafe_allow_html=True)
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
    # Telemetry Graphs
    # -----------------------------
    if timeline:
        df = pd.DataFrame(timeline)
        df["timestamp"] = pd.to_datetime(df["timestamp"])

        g1, g2 = st.columns(2)
        with g1:
            st.subheader("Temperature Trend")
            st.plotly_chart(px.line(df, x="timestamp", y="temperature"), use_container_width=True)

        with g2:
            st.subheader("Throughput Trend")
            st.plotly_chart(px.line(df, x="timestamp", y="throughput"), use_container_width=True)

        g3, g4 = st.columns(2)
        with g3:
            st.subheader("Pressure Trend")
            st.plotly_chart(px.line(df, x="timestamp", y="pressure"), use_container_width=True)

        with g4:
            st.subheader("Alignment Error Trend")
            st.plotly_chart(px.line(df, x="timestamp", y="alignment_error"), use_container_width=True)

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
            st.dataframe(pd.DataFrame(alerts))
        else:
            st.write("No active alerts")

# ============================================================
# ⭐ PAGE 2 — ASK THE FAB (Chatbot)
# ============================================================
elif st.session_state.nav == "Chat":

    st.header("🤖 Chat with FabAI")

    if "chat_history" not in st.session_state:
        st.session_state.chat_history = []

    # Display chat history
    for msg in st.session_state.chat_history:
        role = "🧑‍🔧 User" if msg["role"] == "user" else "🤖 Fab Assistant"
        st.markdown(f"""
            <div class="chat-message">
                <strong>{role}:</strong> {msg['content']}
            </div>
        """, unsafe_allow_html=True)

    question = st.text_area("Ask a question to FabAI:")

    if st.button("Send"):
        st.session_state.chat_history.append({"role": "user", "content": question})

        response = requests.post(
            f"{BACKEND}/analysis/analyze",
            json={
                "question": question,
                "machineId": machine_id,
                "minutes": 120,
                "history": st.session_state.chat_history
            }
        )

        if response.status_code == 200:
            answer = response.json()["answer"]
            st.session_state.chat_history.append({"role": "assistant", "content": answer})
            st.rerun()
        else:
            st.error("Analysis failed")

# ============================================================
# ⭐ PAGE 3 — NL → SQL EXPLORER
# ============================================================
elif st.session_state.nav == "SQL":

    st.header("📊 Natural Language → SQL Explorer")

    nl_query = st.text_input("Ask a Data Analytics question:")

    if st.button("Run Query"):
        response = requests.post(
            f"{BACKEND}/query/query",
            json={"question": nl_query}
        )

        if response.status_code != 200:
            st.error("Query failed")
        else:
            data = response.json()

            st.subheader("Generated SQL")
            st.markdown(f"""
                <div style="background-color: #0e1117; padding: 15px; border-radius: 8px; border: 1px solid #333; margin-bottom: 20px;">
                    <code style="color: white !important; font-size: 1.1rem; font-family: 'Source Code Pro', monospace;">{data['sql']}</code>
                </div>
            """, unsafe_allow_html=True)

            df = pd.DataFrame(data["rows"])
            st.subheader("Query Results")
            st.dataframe(df)

            st.subheader("Insight Summary")
            st.write(data["summary"])

            numeric_cols = df.select_dtypes(include=["float64", "int64"]).columns
            if len(numeric_cols) >= 2:
                x, y = numeric_cols[:2]
                st.subheader(f"Chart: {x} vs {y}")
                chart = alt.Chart(df).mark_line(point=True).encode(x=x, y=y)
                st.altair_chart(chart, use_container_width=True)