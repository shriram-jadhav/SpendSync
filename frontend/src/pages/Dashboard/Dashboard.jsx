import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Users } from 'lucide-react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { getSummary, getByCategory, getTransactions } from '../../services/expenses';
import { getPeople } from '../../services/ledger';

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, balance: 0 });
  const [categoryData, setCategoryData] = useState([]);
  const [recentTxns, setRecentTxns] = useState([]);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [summaryRes, categoryRes, txnRes, peopleRes] = await Promise.all([
          getSummary(),
          getByCategory(),
          getTransactions(),
          getPeople(),
        ]);
        setSummary(summaryRes.data);
        setCategoryData(
          categoryRes.data.map((c) => ({
            name: c.category__name || 'Uncategorized',
            value: parseFloat(c.total),
            color: c.category__color || '#6b7280',
          }))
        );
        setRecentTxns(txnRes.data.slice(0, 5));
        setPeople(peopleRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const totalOwedToYou = people.reduce((sum, p) => sum + (p.balance > 0 ? parseFloat(p.balance) : 0), 0);
  const totalYouOwe = people.reduce((sum, p) => sum + (p.balance < 0 ? Math.abs(parseFloat(p.balance)) : 0), 0);

  const cards = [
    { label: 'Total Income', value: summary.total_income, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Total Expense', value: summary.total_expense, icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Net Balance', value: summary.balance, icon: Wallet, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Owed to You', value: totalOwedToYou - totalYouOwe, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="text-gray-400">Loading dashboard...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back, {user?.username} 👋</h1>
      <p className="text-gray-500 mb-8">Here's your financial overview</p>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={color} size={20} />
            </div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">₹{Number(value).toLocaleString('en-IN')}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending by Category */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Spending by Category</h3>
          {categoryData.length === 0 ? (
            <p className="text-gray-400 text-sm py-12 text-center">No expense data yet. Add a transaction to see it here.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name }) => name}>
                  {categoryData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${value}`} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Transactions</h3>
          {recentTxns.length === 0 ? (
            <p className="text-gray-400 text-sm py-12 text-center">No transactions yet.</p>
          ) : (
            <div className="space-y-3">
              {recentTxns.map((t) => (
                <div key={t.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{t.category_icon || '📦'}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{t.title}</p>
                      <p className="text-xs text-gray-400">{t.date}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.type === 'income' ? '+' : '-'}₹{Number(t.amount).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}