import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AppLayout from './components/layout/AppLayout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import VehiclesPage from './pages/vehicles/VehiclesPage';
import DriversPage from './pages/drivers/DriversPage';
import TripsPage from './pages/trips/TripsPage';
import FuelPredictionPage from './pages/prediction/FuelPredictionPage';
import ModelTrainingPage from './pages/models/ModelTrainingPage';
import OptimizationPage from './pages/optimization/OptimizationPage';
import RouteMapPage from './pages/maps/RouteMapPage';
import GreenFleetPage from './pages/green/GreenFleetPage';
import EmissionsPage from './pages/analytics/EmissionsPage';
import FuelAnalyticsPage from './pages/analytics/FuelAnalyticsPage';
import DatasetsPage from './pages/datasets/DatasetsPage';
import AssistantPage from './pages/assistant/AssistantPage';
import AlertsPage from './pages/alerts/AlertsPage';
import ReportsPage from './pages/reports/ReportsPage';
import AdminPage from './pages/admin/AdminPage';
import SettingsPage from './pages/settings/SettingsPage';

// Advanced Research & Operational Intelligence Modules
import VRPPage from './pages/vrp/VRPPage';
import ParetoPage from './pages/pareto/ParetoPage';
import BenchmarkPage from './pages/benchmark/BenchmarkPage';
import QuboVisualizerPage from './pages/qubo/QuboVisualizerPage';
import DigitalTwinPage from './pages/digitaltwin/DigitalTwinPage';
import MaintenancePage from './pages/maintenance/MaintenancePage';
import SensitivityPage from './pages/sensitivity/SensitivityPage';
import EVFleetPage from './pages/ev/EVFleetPage';
import MLMonitorPage from './pages/ml/MLMonitorPage';
import FleetIntelligencePage from './pages/intelligence/FleetIntelligencePage';
import ResearchLabPage from './pages/research/ResearchLabPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Application Routes */}
          <Route
            path="/dashboard"
            element={
              <AppLayout title="Operations & Fleet Dashboard">
                <DashboardPage />
              </AppLayout>
            }
          />

          <Route
            path="/vehicles"
            element={
              <AppLayout title="Vehicle Fleet Management">
                <VehiclesPage />
              </AppLayout>
            }
          />

          <Route
            path="/drivers"
            element={
              <AppLayout title="Driver Performance & Rosters">
                <DriversPage />
              </AppLayout>
            }
          />

          <Route
            path="/trips"
            element={
              <AppLayout title="Trip Dispatches & Telemetry">
                <TripsPage />
              </AppLayout>
            }
          />

          <Route
            path="/predict"
            element={
              <AppLayout title="AI Fuel Consumption Prediction">
                <FuelPredictionPage />
              </AppLayout>
            }
          />

          <Route
            path="/models"
            element={
              <AppLayout title="Machine Learning Models & Metrics">
                <ModelTrainingPage />
              </AppLayout>
            }
          />

          <Route
            path="/optimization"
            element={
              <AppLayout title="Quantum QUBO Fleet Optimization">
                <OptimizationPage />
              </AppLayout>
            }
          />

          <Route
            path="/map"
            element={
              <AppLayout title="Transit Corridors & Telemetry Map">
                <RouteMapPage />
              </AppLayout>
            }
          />

          <Route
            path="/green-fleet"
            element={
              <AppLayout title="Green Fleet & Decarbonization Command">
                <GreenFleetPage />
              </AppLayout>
            }
          />

          <Route
            path="/emissions"
            element={
              <AppLayout title="Carbon Emissions & ESG Accounting">
                <EmissionsPage />
              </AppLayout>
            }
          />

          <Route
            path="/fuel-analytics"
            element={
              <AppLayout title="Fuel Cost & Mileage Analytics">
                <FuelAnalyticsPage />
              </AppLayout>
            }
          />

          <Route
            path="/datasets"
            element={
              <AppLayout title="Telemetry Datasets & Feature Store">
                <DatasetsPage />
              </AppLayout>
            }
          />

          <Route
            path="/assistant"
            element={
              <AppLayout title="Fleet Intelligence AI Assistant">
                <AssistantPage />
              </AppLayout>
            }
          />

          <Route
            path="/alerts"
            element={
              <AppLayout title="Fleet Alerts & Anomaly Feed">
                <AlertsPage />
              </AppLayout>
            }
          />

          <Route
            path="/reports"
            element={
              <AppLayout title="Compliance & Executive Audits">
                <ReportsPage />
              </AppLayout>
            }
          />

          {/* Advanced Research & Operational Intelligence Routes */}
          <Route
            path="/vrp"
            element={
              <AppLayout title="Multi-Stop Vehicle Routing Problem (CVRPTW)">
                <VRPPage />
              </AppLayout>
            }
          />

          <Route
            path="/pareto"
            element={
              <AppLayout title="Multi-Objective Quantum Pareto Frontier">
                <ParetoPage />
              </AppLayout>
            }
          />

          <Route
            path="/benchmark"
            element={
              <AppLayout title="Quantum-Inspired Benchmarking Suite">
                <BenchmarkPage />
              </AppLayout>
            }
          />

          <Route
            path="/qubo"
            element={
              <AppLayout title="QUBO Matrix Visualizer & Energy Explorer">
                <QuboVisualizerPage />
              </AppLayout>
            }
          />

          <Route
            path="/digital-twin"
            element={
              <AppLayout title="Digital Twin & Stochastic Fleet Simulation">
                <DigitalTwinPage />
              </AppLayout>
            }
          />

          <Route
            path="/maintenance"
            element={
              <AppLayout title="Fleet Telemetry & Predictive Maintenance">
                <MaintenancePage />
              </AppLayout>
            }
          />

          <Route
            path="/sensitivity"
            element={
              <AppLayout title="Robust Monte Carlo Optimization & Risk Analysis">
                <SensitivityPage />
              </AppLayout>
            }
          />

          <Route
            path="/ev-fleet"
            element={
              <AppLayout title="Electric & Hybrid Fleet Electrification">
                <EVFleetPage />
              </AppLayout>
            }
          />

          <Route
            path="/ml-drift"
            element={
              <AppLayout title="Adaptive ML Drift Monitor & Model Registry">
                <MLMonitorPage />
              </AppLayout>
            }
          />

          <Route
            path="/intelligence"
            element={
              <AppLayout title="Advanced Fleet Intelligence & Depot Rebalancing">
                <FleetIntelligencePage />
              </AppLayout>
            }
          />

          <Route
            path="/research-lab"
            element={
              <AppLayout title="Scientific Research Validator & Experiment Suite">
                <ResearchLabPage />
              </AppLayout>
            }
          />

          <Route
            path="/admin"
            element={
              <AppLayout title="System Administration">
                <AdminPage />
              </AppLayout>
            }
          />

          <Route
            path="/settings"
            element={
              <AppLayout title="System & Algorithm Settings">
                <SettingsPage />
              </AppLayout>
            }
          />

          {/* Root and Fallback */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
