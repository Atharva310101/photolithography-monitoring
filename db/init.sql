CREATE TABLE machines (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OK'
);

CREATE TABLE telemetry (
  id SERIAL PRIMARY KEY,
  machine_id INT NOT NULL REFERENCES machines(id),
  temperature NUMERIC(5,2) NOT NULL,
  pressure NUMERIC(5,3) NOT NULL,
  alignment_error NUMERIC(5,3) NOT NULL,
  throughput NUMERIC(5,2) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE alerts (
  id SERIAL PRIMARY KEY,
  machine_id INT NOT NULL REFERENCES machines(id),
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
