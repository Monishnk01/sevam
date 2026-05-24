# Upahar AI - Autonomous Food Waste Prediction & Redistribution

Upahar AI is a full-stack, AI-powered web application that helps restaurants reduce food waste by predicting surplus food and automatically redistributing it to NGOs, shelters, orphanages, and food banks.

## Quick Start

1. **Start the System**:
   Run the `start.bat` file located in the root directory. This will automatically spin up the Node.js backend (port 5000) and the Vite frontend (port 5173).

2. **Access the Application**:
   Navigate to the following local link in your browser:
   **[http://localhost:5173/](http://localhost:5173/)**

## Features

- **Personalized AI Predictions**: A Scikit-Learn Random Forest Regressor trains automatically on the restaurant's operational data to predict next-day leftovers.
- **Autonomous Agent**: Automatically detects surpluses over 5 meals and generates NGO pickup requests, locating the nearest shelter with capacity.
- **1-Click Demo Portal**: Try out the Restaurant, NGO, and Receiver dashboards instantly without manually signing up. 
- **Real-time Radar Map**: Interactive, stunning vector map tracking surplus locations and active delivery routes.

## Technology Stack

- **Frontend**: React, Vite, Tailwind CSS (v3), Recharts, Lucide React
- **Backend**: Node.js, Express, SQLite (Relational mappings), WebSockets
- **AI / ML**: Python, Scikit-Learn, Pandas, Numpy

---
*Built to transform food surplus into social impact using AI.*
