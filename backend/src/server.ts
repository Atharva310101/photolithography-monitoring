import dotenv from "dotenv";
dotenv.config();
import app from "./app";
import dashboardRoutes from "./routes/dashboard.routes";
import { cleanupTelemetry } from "./services/cleanup.service";

app.use("/dashboard", dashboardRoutes);

const port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
});

// Run cleanup every 10 minutes
setInterval(() => {
    cleanupTelemetry(50000);
}, 10 * 60 * 1000);