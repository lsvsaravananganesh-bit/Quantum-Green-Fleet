import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Truck, Users, MapPin, Fuel, Atom, Map,
  Leaf, BarChart2, DollarSign, Database, Brain, MessageSquare,
  Bell, FileText, Settings, Shield, LogOut, ChevronRight,
  Menu, X, Gauge, Route, Layers, Activity, Cpu, Wrench,
  ShieldAlert, BatteryCharging, BookOpen, Compass, Grid
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: <LayoutDashboard size={18} /> },
      { label: 'Fleet Intelligence', to: '/intelligence', icon: <Compass size={18} /> },
    ],
  },
  {
    title: 'Quantum & Optimization',
    items: [
      { label: 'VRP Multi-Stop', to: '/vrp', icon: <Route size={18} /> },
      { label: 'QUBO Assignment', to: '/optimization', icon: <Atom size={18} /> },
      { label: 'Multi-Objective Pareto', to: '/pareto', icon: <Layers size={18} /> },
      { label: 'QUBO Visualizer', to: '/qubo', icon: <Grid size={18} /> },
      { label: 'Benchmarking Lab', to: '/benchmark', icon: <Activity size={18} /> },
      { label: 'Route Map', to: '/map', icon: <Map size={18} /> },
    ],
  },
  {
    title: 'Simulation & Intelligence',
    items: [
      { label: 'Digital Twin', to: '/digital-twin', icon: <Cpu size={18} /> },
      { label: 'Predictive Health', to: '/maintenance', icon: <Wrench size={18} /> },
      { label: 'Robust Sensitivity', to: '/sensitivity', icon: <ShieldAlert size={18} /> },
      { label: 'EV & Hybrid Fleet', to: '/ev-fleet', icon: <BatteryCharging size={18} /> },
      { label: 'ML Drift Monitor', to: '/ml-drift', icon: <Brain size={18} /> },
      { label: 'Research Validator', to: '/research-lab', icon: <BookOpen size={18} /> },
    ],
  },
  {
    title: 'Fleet Operations',
    items: [
      { label: 'Vehicles', to: '/vehicles', icon: <Truck size={18} /> },
      { label: 'Drivers', to: '/drivers', icon: <Users size={18} /> },
      { label: 'Trips', to: '/trips', icon: <MapPin size={18} /> },
      { label: 'Fuel Prediction', to: '/predict', icon: <Fuel size={18} /> },
      { label: 'Model Training', to: '/models', icon: <Brain size={18} /> },
      { label: 'Green Fleet', to: '/green-fleet', icon: <Leaf size={18} /> },
    ],
  },
  {
    title: 'Analytics & Tools',
    items: [
      { label: 'Carbon Emissions', to: '/emissions', icon: <BarChart2 size={18} /> },
      { label: 'Fuel Cost Analytics', to: '/fuel-analytics', icon: <DollarSign size={18} /> },
      { label: 'Datasets', to: '/datasets', icon: <Database size={18} /> },
      { label: 'AI Assistant', to: '/assistant', icon: <MessageSquare size={18} /> },
      { label: 'Alerts', to: '/alerts', icon: <Bell size={18} /> },
      { label: 'Reports', to: '/reports', icon: <FileText size={18} /> },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-gray-100">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
        <div className="w-9 h-9 bg-green-800 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
          <Gauge size={20} className="text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-gray-900 text-sm leading-tight">Quantum Green Fleet</p>
          <p className="text-[10px] text-green-700 font-medium uppercase tracking-wider">AI-Powered Platform</p>
        </div>
        <button
          onClick={onClose}
          className="ml-auto lg:hidden text-gray-400 hover:text-gray-600 p-1"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="section-title">{section.title}</p>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  isActive ? 'sidebar-link-active' : 'sidebar-link'
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}

        {user?.role === 'admin' && (
          <div>
            <p className="section-title">System</p>
            <NavLink
              to="/admin"
              onClick={onClose}
              className={({ isActive }) =>
                isActive ? 'sidebar-link-active' : 'sidebar-link'
              }
            >
              <Shield size={18} />
              <span>Admin Dashboard</span>
            </NavLink>
            <NavLink
              to="/settings"
              onClick={onClose}
              className={({ isActive }) =>
                isActive ? 'sidebar-link-active' : 'sidebar-link'
              }
            >
              <Settings size={18} />
              <span>Settings</span>
            </NavLink>
          </div>
        )}
      </nav>

      {/* User footer */}
      <div className="border-t border-gray-100 p-3">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
          <div className="w-8 h-8 rounded-full bg-green-800 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {user?.full_name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-800 truncate">{user?.full_name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-red-500 transition-colors p-1"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col w-60 flex-shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-gray-900/50" onClick={onClose} />
          <div className="relative flex flex-col w-60 flex-shrink-0 h-full">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
