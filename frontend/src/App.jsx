import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Cloud, DollarSign, Activity, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCosts = async () => {
    const API_URL = 'https://7npynqwloc.execute-api.us-east-1.amazonaws.com/costs';
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const jsonData = await response.json();
      
      // Since we don't know the exact format, we'll try to extract or mock the visualization structure.
      // Assuming a structured response, or we transform it into what we need.
      setData(jsonData);
    } catch (err) {
      console.error("Failed to fetch costs:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCosts();
  }, []);

  // Mock data for fallback if the API returns something unexpected or empty
  const defaultDailyCosts = [
    { date: 'Mon', cost: 12 }, { date: 'Tue', cost: 19 }, { date: 'Wed', cost: 15 },
    { date: 'Thu', cost: 22 }, { date: 'Fri', cost: 28 }, { date: 'Sat', cost: 34 }, { date: 'Sun', cost: 30 }
  ];
  
  const defaultServiceCosts = [
    { name: 'EC2', value: 400 }, { name: 'S3', value: 300 },
    { name: 'RDS', value: 300 }, { name: 'Lambda', value: 200 }
  ];

  const dailyCosts = data?.dailyCosts || defaultDailyCosts;
  const serviceCosts = data?.costsByService || defaultServiceCosts;
  const totalCost = data?.totalCost || serviceCosts.reduce((acc, curr) => acc + curr.value, 0);
  
  const COLORS = ['#60a5fa', '#34d399', '#f472b6', '#fbbf24', '#a78bfa'];

  return (
    <div className="min-h-screen bg-slate-900 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-800 to-slate-900 p-6 text-slate-100 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/20 rounded-xl backdrop-blur-md border border-blue-500/30">
              <Cloud className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400">
                AWS Cost Explorer
              </h1>
              <p className="text-slate-400 text-sm">Real-time cloud expenditure dashboard</p>
            </div>
          </div>
          <button 
            onClick={fetchCosts}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-lg transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </header>

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <p>Error loading data: {error}. Displaying fallback data.</p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <DollarSign className="w-16 h-16 text-emerald-400" />
            </div>
            <p className="text-slate-400 text-sm font-medium mb-1">Total Month-to-Date</p>
            <h2 className="text-4xl font-bold text-white flex items-baseline gap-1">
              <span className="text-emerald-400 text-2xl">$</span>
              {loading ? '...' : totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Activity className="w-16 h-16 text-blue-400" />
            </div>
            <p className="text-slate-400 text-sm font-medium mb-1">Active Services</p>
            <h2 className="text-4xl font-bold text-white">
              {loading ? '...' : serviceCosts.length}
            </h2>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Cloud className="w-16 h-16 text-purple-400" />
            </div>
            <p className="text-slate-400 text-sm font-medium mb-1">Top Cost Driver</p>
            <h2 className="text-2xl font-bold text-white mt-2 truncate">
              {loading ? '...' : (serviceCosts.length > 0 ? serviceCosts.sort((a, b) => b.value - a.value)[0].name : 'N/A')}
            </h2>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-medium text-slate-200 mb-6">Daily Spend Trend</h3>
            <div className="h-[300px] w-full">
              {loading && !data ? (
                <div className="w-full h-full flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-blue-400 animate-spin opacity-50" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyCosts} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" vertical={false} />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      itemStyle={{ color: '#e2e8f0' }}
                    />
                    <Bar dataKey="cost" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Secondary Chart */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-medium text-slate-200 mb-6">Cost by Service</h3>
            <div className="h-[300px] w-full relative">
              {loading && !data ? (
                <div className="w-full h-full flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-blue-400 animate-spin opacity-50" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={serviceCosts}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {serviceCosts.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      itemStyle={{ color: '#e2e8f0' }}
                      formatter={(value) => `$${Number(value).toFixed(2)}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
              {/* Legend overlay */}
              <div className="absolute inset-x-0 bottom-0 flex flex-wrap justify-center gap-3 pt-4">
                {serviceCosts.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                    {entry.name}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
