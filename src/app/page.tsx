'use client';

import { useState, useEffect } from 'react';

interface DashboardStats {
  totalUsers: number;
  revenue: number;
  orders: number;
  growth: number;
}

interface ChartData {
  name: string;
  value: number;
  color: string;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 12543,
    revenue: 89432,
    orders: 1234,
    growth: 12.5
  });

  const [chartData] = useState<ChartData[]>([
    { name: 'Desktop', value: 65, color: '#3B82F6' },
    { name: 'Mobile', value: 25, color: '#10B981' },
    { name: 'Tablet', value: 10, color: '#F59E0B' }
  ]);

  const [recentActivity] = useState([
    { id: 1, user: 'John Doe', action: 'Made a purchase', time: '2 minutes ago', amount: '$299' },
    { id: 2, user: 'Sarah Smith', action: 'Signed up', time: '5 minutes ago', amount: null },
    { id: 3, user: 'Mike Johnson', action: 'Updated profile', time: '10 minutes ago', amount: null },
    { id: 4, user: 'Emma Wilson', action: 'Made a purchase', time: '15 minutes ago', amount: '$149' },
    { id: 5, user: 'David Brown', action: 'Left a review', time: '20 minutes ago', amount: null }
  ]);

  const [salesData] = useState([
    { month: 'Jan', sales: 4000, users: 2400 },
    { month: 'Feb', sales: 3000, users: 1398 },
    { month: 'Mar', sales: 2000, users: 9800 },
    { month: 'Apr', sales: 2780, users: 3908 },
    { month: 'May', sales: 1890, users: 4800 },
    { month: 'Jun', sales: 2390, users: 3800 }
  ]);

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        totalUsers: prev.totalUsers + Math.floor(Math.random() * 3),
        revenue: prev.revenue + Math.floor(Math.random() * 100)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const StatCard = ({ title, value, change, icon, color }: {
    title: string;
    value: string | number;
    change: string;
    icon: React.ReactNode;
    color: string;
  }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
          <p className={`text-sm mt-2 ${color}`}>{change}</p>
        </div>
        <div className={`p-3 rounded-full ${color.includes('green') ? 'bg-green-100 dark:bg-green-900' : 
          color.includes('blue') ? 'bg-blue-100 dark:bg-blue-900' : 
          color.includes('purple') ? 'bg-purple-100 dark:bg-purple-900' : 'bg-orange-100 dark:bg-orange-900'}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const SimpleChart = ({ data }: { data: typeof salesData }) => (
    <div className="h-64 flex items-end justify-between px-4">
      {data.map((item, index) => (
        <div key={index} className="flex flex-col items-center">
          <div 
            className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-md w-8 mb-2"
            style={{ height: `${(item.sales / 4000) * 200}px` }}
          />
          <span className="text-xs text-gray-600 dark:text-gray-400">{item.month}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        </div>
        
        <nav className="mt-8">
          {[
            { id: 'overview', name: 'Overview', icon: '📊' },
            { id: 'analytics', name: 'Analytics', icon: '📈' },
            { id: 'users', name: 'Users', icon: '👥' },
            { id: 'products', name: 'Products', icon: '📦' },
            { id: 'orders', name: 'Orders', icon: '🛒' },
            { id: 'settings', name: 'Settings', icon: '⚙️' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                activeTab === item.id ? 'bg-blue-50 dark:bg-blue-900 border-r-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Welcome back! Here's what's happening with your business today.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
              Export Data
            </button>
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
          </div>
        </div>

        {activeTab === 'overview' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Users"
                value={stats.totalUsers.toLocaleString()}
                change="+12% from last month"
                color="text-green-600"
                icon={<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>}
              />
              <StatCard
                title="Revenue"
                value={`$${stats.revenue.toLocaleString()}`}
                change="+8% from last month"
                color="text-blue-600"
                icon={<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>}
              />
              <StatCard
                title="Orders"
                value={stats.orders.toLocaleString()}
                change="+23% from last month"
                color="text-purple-600"
                icon={<svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>}
              />
              <StatCard
                title="Growth Rate"
                value={`${stats.growth}%`}
                change="+2.1% from last month"
                color="text-orange-600"
                icon={<svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>}
              />
            </div>

            {/* Charts and Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Sales Chart */}
              <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sales Overview</h3>
                <SimpleChart data={salesData} />
              </div>

              {/* Device Usage */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Device Usage</h3>
                <div className="space-y-4">
                  {chartData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-3"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                        {activity.user.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.user}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{activity.action}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {activity.amount && (
                        <p className="text-sm font-medium text-green-600">{activity.amount}</p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Analytics Dashboard</h3>
            <p className="text-gray-600 dark:text-gray-400">Detailed analytics and insights coming soon...</p>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">User Management</h3>
            <p className="text-gray-600 dark:text-gray-400">User management interface coming soon...</p>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Product Catalog</h3>
            <p className="text-gray-600 dark:text-gray-400">Product management interface coming soon...</p>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Order Management</h3>
            <p className="text-gray-600 dark:text-gray-400">Order management interface coming soon...</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Settings</h3>
            <p className="text-gray-600 dark:text-gray-400">Settings panel coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
