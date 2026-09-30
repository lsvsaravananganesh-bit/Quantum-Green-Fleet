import React, { useState } from 'react';
import {
  MessageSquare, Send, Sparkles, Bot, User,
  Atom, Fuel, Truck, Leaf, AlertCircle, HelpCircle
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  time: string;
  tags?: string[];
}

const PRESET_QUERIES = [
  'Which vehicle has the highest fuel efficiency?',
  'Recommend vehicle for 450km trip to Ahmedabad',
  'How much CO₂ is saved by switching 4 vans to EV?',
  'What active maintenance alerts do we have?',
  'How does Quantum QUBO improve dispatch efficiency?',
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'assistant',
      text: "Hello! I am your **Quantum Green Fleet AI Assistant**. I can help you analyze fuel consumption, formulate quantum dispatch strategies, evaluate EV ROI, and check vehicle maintenance health. Ask me anything or select a prompt below!",
      time: 'Just now',
      tags: ['Fleet AI', 'Quantum Ready'],
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);

  const handleSend = (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    // Intelligent contextual response generation
    setTimeout(() => {
      let reply = '';
      let tags: string[] = ['Fleet Telemetry'];
      const q = query.toLowerCase();

      if (q.includes('highest') || q.includes('efficiency') || q.includes('best mileage')) {
        reply = "Based on current fleet telemetry, **RJ07KL2345 (Maruti Swift Dzire - Petrol)** achieves the highest efficiency at **22.0 km/L**, followed by **UP10QR4567 (Honda City - Petrol)** at **18.5 km/L**. For freight haulage, **Tata Ace (HR11ST8901)** leads light commercial vehicles at **14.0 km/L**.";
        tags = ['Efficiency', 'Leaderboard'];
      } else if (q.includes('recommend') || q.includes('ahmedabad') || q.includes('450km') || q.includes('trip')) {
        reply = "For a **450 km highway trip to Ahmedabad with moderate payload (~1,500 kg)**, I recommend **MH04CD5678 (Mahindra Supro)** or **KA03EF9012 (Toyota Innova)**. The XGBoost model predicts **~32 Liters of fuel burn** costing approx **₹2,880**, yielding a 14% fuel cost saving compared to deploying a heavy hauler.";
        tags = ['Trip Recommendation', 'XGBoost Prediction'];
      } else if (q.includes('ev') || q.includes('electric') || q.includes('switch') || q.includes('co2')) {
        reply = "Transitioning **4 diesel delivery vans** running an average of 150 km/day will abet **~48.2 metric tons of CO₂ per year** (equivalent to planting ~2,190 trees). Financially, with commercial EV charging at ₹8/kWh versus diesel at ₹90.25/L, net operational fuel cost savings will exceed **₹12.6 Lakhs annually**!";
        tags = ['Decarbonization', 'EV ROI'];
      } else if (q.includes('alert') || q.includes('maintenance')) {
        reply = "There are **2 critical / warning alerts** requiring attention:\n1. **HR11ST8901 (Tata Ace)**: Due for scheduled engine overhaul (overdue by 2,000 km).\n2. **TN01AB1234 (Tata Prima)**: Observed 18% fuel spike on recent highway dispatch. Check injector calibration.";
        tags = ['Alerts', 'Maintenance'];
      } else if (q.includes('qubo') || q.includes('quantum') || q.includes('algorithm')) {
        reply = "The **Quadratic Unconstrained Binary Optimization (QUBO)** formulation models vehicle-to-trip assignment as minimizing a quadratic cost function: `min α·Cost + β·Emissions + Σ penalties`. Using **Simulated Annealing** on this QUBO Hamiltonian avoids local minima traps, saving an average of **12-18% in fuel expenditure** compared to naive greedy assignment!";
        tags = ['QUBO Formulation', 'Simulated Annealing'];
      } else {
        reply = `I analyzed your inquiry regarding "${query}". The Quantum Green Fleet engine combines machine learning (XGBoost R²=0.971) with QUBO mathematical optimization to continuously optimize route dispatch, minimize emissions, and maintain vehicle reliability.`;
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        tags,
      };

      setMessages((prev) => [...prev, botMsg]);
      setTyping(false);
    }, 600);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-green-800 to-emerald-600 flex items-center justify-center text-white shadow-sm">
            <Bot size={22} />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-base">Fleet Intelligence AI Copilot</h1>
            <p className="text-xs text-gray-500">Autonomous advisor for fuel management, QUBO dispatches, and green transitions</p>
          </div>
        </div>
      </div>

      {/* Query Suggestions */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 flex-shrink-0">
        <Sparkles size={14} className="text-green-700 flex-shrink-0" />
        {PRESET_QUERIES.map((q) => (
          <button
            key={q}
            onClick={() => handleSend(q)}
            className="text-[11px] font-medium px-2.5 py-1 bg-white hover:bg-green-50 border border-gray-200 hover:border-green-300 rounded-full text-gray-700 hover:text-green-800 transition-all flex-shrink-0"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages Canvas */}
      <div className="flex-1 overflow-y-auto p-4 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                m.sender === 'user'
                  ? 'bg-green-800 text-white'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {m.sender === 'user' ? <User size={15} /> : <Bot size={16} />}
            </div>

            <div
              className={`max-w-xl rounded-2xl p-4 text-xs leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-green-800 text-white rounded-tr-none'
                  : 'bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-none space-y-2'
              }`}
            >
              <div className="whitespace-pre-line">{m.text}</div>

              {m.tags && (
                <div className="flex items-center gap-1.5 pt-1">
                  {m.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-gray-200 font-semibold text-green-800"
                    >
                      {t}
                    </span>
                  ))}
                  <span className="text-[10px] text-gray-400 ml-auto">{m.time}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {typing && (
          <div className="flex items-center gap-2 text-xs text-gray-400 italic p-2">
            <Bot size={14} className="animate-spin text-green-700" />
            <span>Analyzing fleet telemetry & optimization matrix...</span>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="flex-shrink-0 flex items-center gap-2 bg-white p-2 border border-gray-200 rounded-xl shadow-sm">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about fuel consumption, vehicle recommendations, carbon targets, or QUBO algorithms..."
          className="flex-1 text-xs px-3 py-2 bg-transparent focus:outline-none text-gray-900 placeholder-gray-400"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim()}
          className="btn-primary p-2 rounded-lg disabled:opacity-40"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
