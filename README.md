# Singapore Real-Time Heat Index & Outdoor Activity Advisory

A full-stack web application providing real-time meteorological information, apparent heat indexes, Wet Bulb Globe Temperature (WBGT) heat stress levels, air quality telemetry (PSI & PM2.5), and intelligent outdoor activity safety advisories across Singapore.

![Singapore Outdoor Advisory Hero](src/assets/images/hero_singapore_skyline_1794324295428.jpg)

## Features

- **Live Singapore Meteorological Telemetry**: Fetches real-time air temperature, relative humidity, UV index, 2-hour nowcasts across 47 planning areas, and 24-hour weather forecasts directly from Singapore National Environment Agency (NEA) and Open-Meteo.
- **Heat Index & WBGT Heat Stress Calculations**: Computes real-time Steadman/Rothfusz heat indexes and estimated Wet Bulb Globe Temperature (WBGT), mapped to official Singapore NEA heat stress guidelines (**Low <31°C**, **Moderate 31°C–33°C**, **High ≥33°C**).
- **Air Quality Telemetry (PSI & PM2.5)**: Tracks 24-hour Pollutant Standards Index (PSI) and 1-hour PM2.5 particulate readings across 5 national monitoring regions (Central, East, West, North, South) alongside official MOH/NEA health guidelines.
- **Activity Suitability Engine**: Evaluates physiological risk factors, hydration plans (ml & electrolytes), work-to-rest intervals, and indoor alternatives across 7 disciplines:
  - Running & Marathon Training
  - Cycling & PCN Touring
  - Hiking & Nature Trail Walks
  - Water Sports & Beach Recreation
  - Court & Field Sports (Football, Tennis, Basketball)
  - Family & Toddler Outings
  - Senior Citizen Brisk Walking
- **24-Hour Diurnal Heat Timeline**: Interactive hourly visual scrubber displaying diurnal temperature shifts, apparent heat index bars, rain probabilities, and UV intensity to pinpoint optimal morning and evening training windows.
- **Singapore Park & Venue Explorer**: Detailed micro-climate profiles for 9 iconic Singapore parks and recreation spots (East Coast Park, MacRitchie Reservoir, Marina Bay Waterfront, Sentosa Island, Singapore Botanic Gardens, Southern Ridges, Bukit Timah Reserve, Punggol Waterway, Jurong Lake Gardens).
- **AI Outdoor Activity Consultant**: Server-side AI advisory powered by Google Gemini (`gemini-3.8-flash`) via the modern `@google/genai` SDK, offering personalized sports science recommendations tailored to target venues, time of day, and participant health profiles.

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React, Motion
- **Backend**: Express, Node.js, TypeScript (via tsx)
- **AI Engine**: `@google/genai` (Gemini 3.8 Flash)
- **Data Sources**: Singapore National Environment Agency (NEA) / Data.gov.sg APIs, Open-Meteo
- **Bundler & Tooling**: Vite 8, TypeScript 7

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or bun
- Gemini API key (optional for AI outdoor assistant)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/leongchoonchong/SG-Outdoor-Advisory-Weather.git
   cd SG-Outdoor-Advisory-Weather
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Add your GEMINI_API_KEY if using AI consultation features
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser at `http://localhost:3000`.

## Production Build

```bash
npm run build
npm start
```

## License

Apache-2.0
