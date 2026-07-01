import { useEffect, useState } from 'react';
import { Plus, Trash2, ArrowUpRight, ArrowDownLeft, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import Layout from '../../components/Layout';
import Modal from '../../components/Modal';
import {
  getPeople, createPerson, deletePerson, getLedgerEntries, createLedgerEntry, deleteLedgerEntry,
} from '../../services/ledger';

export default function Ledger() {
  const [people, setPeople] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPerson, setExpandedPerson] = useState(null);

  const [personModalOpen, setPersonModalOpen] = useState(false);
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState(null);

  const [personForm, setPersonForm] = useState({ name: '', phone_number: '', notes: '' });
  const [entryForm, setEntryForm] = useState({
    entry_type: 'lent', amount: '', description: '', date: new Date().toISOString().slice(0, 10),
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [peopleRes, entriesRes] = await Promise.all([getPeople(), getLedgerEntries()]);
      setPeople(peopleRes.data);
      setEntries(entriesRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddPerson = async (e) => {
    e.preventDefault();
    try {
      await createPerson(personForm);
      setPersonModalOpen(false);
      setPersonForm({ name: '', phone_number: '', notes: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.name?.[0] || 'Could not add person. Name might already exist.');
    }
  };

  const handleDeletePerson = async (id) => {
    if (!confirm('Delete this person and all their ledger history?')) return;
    await deletePerson(id);
    fetchData();
  };

  const openEntryModal = (personId) => {
    setSelectedPersonId(personId);
    setEntryForm({ entry_type: 'lent', amount: '', description: '', date: new Date().toISOString().slice(0, 10) });
    setEntryModalOpen(true);
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    try {
      await createLedgerEntry({ ...entryForm, person: selectedPersonId });
      setEntryModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Something went wrong adding the entry.');
    }
  };

  const handleDeleteEntry = async (id) => {
    if (!confirm('Delete this entry? Note: this will NOT remove the already-synced expense transaction.')) return;
    await deleteLedgerEntry(id);
    fetchData();
  };

  const getPersonEntries = (personId) => entries.filter((e) => e.person === personId);

  if (loading) {
    return (
      <Layout>
        <p className="text-gray-400">Loading ledger...</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Money Ledger</h1>
          <p className="text-gray-500 mt-1">Track who owes you, and who you owe</p>
        </div>
        <button
          onClick={() => setPersonModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-lg transition"
        >
          <Plus size={18} /> Add Person
        </button>
      </div>

      {people.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <p className="text-gray-400">No one added yet. Add a person to start tracking shared money.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {people.map((p) => {
            const isExpanded = expandedPerson === p.id;
            const balance = parseFloat(p.balance);
            const personEntries = getPersonEntries(p.id);

            return (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div
                  className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => setExpandedPerson(isExpanded ? null : p.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">
                      {p.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{p.name}</p>
                      {p.phone_number && <p className="text-xs text-gray-400">{p.phone_number}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      {balance === 0 ? (
                        <span className="text-sm text-gray-400 font-medium">Settled up</span>
                      ) : balance > 0 ? (
                        <div>
                          <p className="text-xs text-gray-400">owes you</p>
                          <p className="font-semibold text-green-600">₹{balance.toLocaleString('en-IN')}</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs text-gray-400">you owe</p>
                          <p className="font-semibold text-red-600">₹{Math.abs(balance).toLocaleString('en-IN')}</p>
                        </div>
                      )}
                    </div>
                    {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-6 py-4 bg-gray-50">
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => openEntryModal(p.id)}
                        className="flex items-center gap-1.5 text-sm font-medium bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
                      >
                        <Plus size={14} /> Add Entry
                      </button>
                      <button
                        onClick={() => handleDeletePerson(p.id)}
                        className="flex items-center gap-1.5 text-sm font-medium text-red-500 bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition ml-auto"
                      >
                        <Trash2 size={14} /> Remove Person
                      </button>
                    </div>

                    {personEntries.length === 0 ? (
                      <p className="text-sm text-gray-400 py-4 text-center">No entries yet for {p.name}.</p>
                    ) : (
                      <div className="space-y-2">
                        {personEntries.map((e) => (
                          <div key={e.id} className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-gray-100">
                            <div className="flex items-center gap-3">
                              {e.entry_type === 'lent' && <ArrowUpRight className="text-red-500" size={16} />}
                              {e.entry_type === 'borrowed' && <ArrowDownLeft className="text-green-500" size={16} />}
                              {e.entry_type === 'settled' && <CheckCircle2 className="text-gray-400" size={16} />}
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {e.entry_type === 'lent' && 'You gave money'}
                                  {e.entry_type === 'borrowed' && 'You took money'}
                                  {e.entry_type === 'settled' && 'Settled'}
                                </p>
                                <p className="text-xs text-gray-400">{e.description || 'No description'} · {e.date}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-gray-900">₹{Number(e.amount).toLocaleString('en-IN')}</span>
                              <button onClick={() => handleDeleteEntry(e.id)} className="text-gray-300 hover:text-red-500">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Person Modal */}
      <Modal isOpen={personModalOpen} onClose={() => setPersonModalOpen(false)} title="Add Person">
        <form onSubmit={handleAddPerson} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
            <input
              type="text" required value={personForm.name}
              onChange={(e) => setPersonForm({ ...personForm, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Rohan"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number (optional)</label>
            <input
              type="text" value={personForm.phone_number}
              onChange={(e) => setPersonForm({ ...personForm, phone_number: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="+91 9876543210"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (optional)</label>
            <textarea
              value={personForm.notes}
              onChange={(e) => setPersonForm({ ...personForm, notes: e.target.value })}
              rows={2}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Any context..."
            />
          </div>
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition">
            Add Person
          </button>
        </form>
      </Modal>

      {/* Add Entry Modal */}
      <Modal isOpen={entryModalOpen} onClose={() => setEntryModalOpen(false)} title="Add Ledger Entry">
        <form onSubmit={handleAddEntry} className="space-y-4">
          <div className="flex gap-2">
            {[
              { key: 'lent', label: 'I Gave Money' },
              { key: 'borrowed', label: 'I Took Money' },
              { key: 'settled', label: 'Settled' },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setEntryForm({ ...entryForm, entry_type: opt.key })}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${
                  entryForm.entry_type === opt.key ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount (₹)</label>
            <input
              type="number" step="0.01" required value={entryForm.amount}
              onChange={(e) => setEntryForm({ ...entryForm, amount: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
            <input
              type="date" required value={entryForm.date}
              onChange={(e) => setEntryForm({ ...entryForm, date: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (optional)</label>
            <input
              type="text" value={entryForm.description}
              onChange={(e) => setEntryForm({ ...entryForm, description: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Movie tickets"
            />
          </div>

          {entryForm.entry_type !== 'settled' && (
            <p className="text-xs text-gray-400 bg-amber-50 rounded-lg px-3 py-2">
              💡 This will automatically create a matching transaction in your Expense Tracker.
            </p>
          )}

          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition">
            Add Entry
          </button>
        </form>
      </Modal>
    </Layout>
  );
}