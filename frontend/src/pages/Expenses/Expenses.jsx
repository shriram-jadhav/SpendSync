import { useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, TrendingUp, TrendingDown, Sparkles, Loader2, Check, X } from 'lucide-react';
import Layout from '../../components/Layout';
import Modal from '../../components/Modal';
import {
  getTransactions, createTransaction, updateTransaction,
  deleteTransaction, getCategories,
} from '../../services/expenses';
import { createLedgerEntry, getPeople, createPerson } from '../../services/ledger';
import { parseTransaction } from '../../services/ai';

export default function Expenses() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTxn, setEditingTxn] = useState(null);
  const [filterType, setFilterType] = useState('all');

  // AI state
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreview, setAiPreview] = useState(null);
  const [aiError, setAiError] = useState('');
  const [aiConfirming, setAiConfirming] = useState(false);

  const [form, setForm] = useState({
    title: '', amount: '', type: 'expense', category: '',
    date: new Date().toISOString().slice(0, 10), notes: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = filterType !== 'all' ? { type: filterType } : {};
      const [txnRes, catRes] = await Promise.all([getTransactions(params), getCategories()]);
      setTransactions(txnRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType]);

  // ── AI handlers ──────────────────────────────────────────────
  const handleAiParse = async () => {
    if (!aiText.trim()) return;
    setAiLoading(true);
    setAiPreview(null);
    setAiError('');
    try {
      const res = await parseTransaction(aiText);
      setAiPreview(res.data);
    } catch (err) {
      setAiError(err.response?.data?.error || 'Could not parse that. Try rephrasing.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiConfirm = async () => {
    if (!aiPreview) return;
    setAiConfirming(true);
    try {
      // Match category_guess to actual category id
      const matchedCat = categories.find(
        (c) => c.name.toLowerCase() === aiPreview.category_guess?.toLowerCase() && c.type === aiPreview.type
      );

      await createTransaction({
        title: aiPreview.title,
        amount: aiPreview.amount,
        type: aiPreview.type,
        category: matchedCat?.id || null,
        date: aiPreview.date,
        notes: '',
      });

      // If person + direction detected, create ledger entry too
      if (aiPreview.person_name && aiPreview.person_direction) {
        // Find or create the person
        let peopleRes = await getPeople();
        let person = peopleRes.data.find(
          (p) => p.name.toLowerCase() === aiPreview.person_name.toLowerCase()
        );
        if (!person) {
          const newPerson = await createPerson({ name: aiPreview.person_name });
          person = newPerson.data;
        }
        await createLedgerEntry({
          person: person.id,
          entry_type: aiPreview.person_direction,
          amount: aiPreview.amount,
          description: aiPreview.title,
          date: aiPreview.date,
        });
      }

      // Reset AI state
      setAiText('');
      setAiPreview(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Something went wrong confirming the transaction.');
    } finally {
      setAiConfirming(false);
    }
  };

  const handleAiDiscard = () => {
    setAiPreview(null);
    setAiError('');
  };

  // ── Manual form handlers ──────────────────────────────────────
  const openAddModal = () => {
    setEditingTxn(null);
    setForm({ title: '', amount: '', type: 'expense', category: '', date: new Date().toISOString().slice(0, 10), notes: '' });
    setModalOpen(true);
  };

  const openEditModal = (txn) => {
    setEditingTxn(txn);
    setForm({
      title: txn.title, amount: txn.amount, type: txn.type,
      category: txn.category || '', date: txn.date, notes: txn.notes || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, category: form.category || null };
    try {
      if (editingTxn) {
        await updateTransaction(editingTxn.id, payload);
      } else {
        await createTransaction(payload);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Something went wrong. Check the form values.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return;
    await deleteTransaction(id);
    fetchData();
  };

  const filteredCategories = categories.filter((c) => c.type === form.type);

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expense Tracker</h1>
          <p className="text-gray-500 mt-1">All your transactions in one place</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-lg transition"
        >
          <Plus size={18} /> Add Transaction
        </button>
      </div>

      {/* ── AI Natural Language Input ── */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={18} className="text-indigo-600" />
          <span className="font-semibold text-indigo-800 text-sm">Smart Entry</span>
          <span className="text-xs text-indigo-400 ml-1">Type naturally, let SpendSync figure it out</span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAiParse()}
            placeholder='e.g. "paid 250 for lunch with Rohan yesterday" or "gave 500 to Mohan for tickets"'
            className="flex-1 px-4 py-2.5 rounded-lg border border-indigo-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
          <button
            onClick={handleAiParse}
            disabled={aiLoading || !aiText.trim()}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-lg transition disabled:opacity-50"
          >
            {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {aiLoading ? 'Parsing...' : 'Parse'}
          </button>
        </div>

        {/* Error */}
        {aiError && (
          <p className="text-red-500 text-sm mt-3">{aiError}</p>
        )}

        {/* Preview card */}
        {aiPreview && (
          <div className="mt-4 bg-white rounded-xl border border-indigo-100 p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Review before saving</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <p className="text-xs text-gray-400">Title</p>
                <p className="font-semibold text-gray-900">{aiPreview.title}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Amount</p>
                <p className={`font-semibold ${aiPreview.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {aiPreview.type === 'income' ? '+' : '-'}₹{Number(aiPreview.amount).toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Category</p>
                <p className="font-medium text-gray-700">{aiPreview.category_guess}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Date</p>
                <p className="font-medium text-gray-700">{aiPreview.date}</p>
              </div>
              {aiPreview.person_name && (
                <div>
                  <p className="text-xs text-gray-400">Person</p>
                  <p className="font-medium text-gray-700">
                    {aiPreview.person_name}
                    {aiPreview.person_direction && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
                        {aiPreview.person_direction === 'lent' ? '→ you gave' : '← you took'}
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {aiPreview.person_name && aiPreview.person_direction && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-3">
                💡 A ledger entry for {aiPreview.person_name} will also be created automatically.
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleAiConfirm}
                disabled={aiConfirming}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition disabled:opacity-50"
              >
                {aiConfirming ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Confirm & Save
              </button>
              <button
                onClick={handleAiDiscard}
                className="flex items-center gap-2 text-gray-500 hover:text-red-600 border border-gray-200 px-4 py-2 rounded-lg text-sm transition"
              >
                <X size={14} /> Discard
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'all', label: 'All' },
          { key: 'income', label: 'Income' },
          { key: 'expense', label: 'Expense' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilterType(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filterType === f.key
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Transaction list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <p className="text-gray-400 text-center py-12">Loading...</p>
        ) : transactions.length === 0 ? (
          <p className="text-gray-400 text-center py-12">No transactions found. Add your first one!</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition group">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type === 'income' ? 'bg-green-50' : 'bg-red-50'}`}>
                    {t.type === 'income'
                      ? <TrendingUp className="text-green-600" size={18} />
                      : <TrendingDown className="text-red-600" size={18} />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{t.title}</p>
                    <p className="text-xs text-gray-400">
                      {t.category_icon} {t.category_name || 'Uncategorized'} · {t.date}
                      {t.linked_person_name && ` · 🔗 ${t.linked_person_name}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.type === 'income' ? '+' : '-'}₹{Number(t.amount).toLocaleString('en-IN')}
                  </span>
                  <div className="opacity-0 group-hover:opacity-100 transition flex gap-2">
                    <button onClick={() => openEditModal(t)} className="text-gray-400 hover:text-indigo-600">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(t.id)} className="text-gray-400 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingTxn ? 'Edit Transaction' : 'Add Transaction'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            {['expense', 'income'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setForm({ ...form, type, category: '' })}
                className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition ${
                  form.type === type
                    ? type === 'income' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
            <input
              type="text" required value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Lunch at cafe"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount (₹)</label>
              <input
                type="number" step="0.01" required value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
              <input
                type="date" required value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Uncategorized</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Any extra details..."
            />
          </div>
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition">
            {editingTxn ? 'Update Transaction' : 'Add Transaction'}
          </button>
        </form>
      </Modal>
    </Layout>
  );
}