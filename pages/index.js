import { useState, useEffect } from 'react';
import { supabase } from './_app';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function Home({ user, loading }) {
  const [coupleId, setCoupleId] = useState(null);
  const [memories, setMemories] = useState([]);
  const [activeTab, setActiveTab] = useState('roulette');
  const [rouletteOptions, setRouletteOptions] = useState([]);
  const [battle, setBattle] = useState(null);
  const [battleQuestion, setBattleQuestion] = useState(null);
  const [judgeResult, setJudgeResult] = useState(null);
  const [suggestion, setSuggestion] = useState(null);

  const login = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const spinRoulette = async (type, budget, mood) => {
    try {
      const res = await axios.post(`${API_URL}/api/roulette`, { type, budget, mood });
      setRouletteOptions(res.data.options || []);
    } catch (error) {
      alert('Error al girar la ruleta');
    }
  };

  const startBattle = async (optionA, optionB) => {
    try {
      const res = await axios.post(`${API_URL}/api/battle/start`, {
        optionA,
        optionB,
        coupleId: coupleId || 'demo'
      });
      setBattle(res.data);
      setBattleQuestion(null);
    } catch (error) {
      alert('Error al iniciar batalla');
    }
  };

  const voteBattle = async (selected) => {
    if (!battle || !battle.battleId) return;
    try {
      const res = await axios.post(`${API_URL}/api/battle/vote`, {
        battleId: battle.battleId,
        selected,
        userId: user?.id || 'demo',
        coupleId: coupleId || 'demo'
      });
      setBattle(res.data.battle);
      setBattleQuestion(res.data.questionData);
      if (res.data.winner) {
        alert(`🎉 Ganó: ${res.data.winner}`);
      }
    } catch (error) {
      alert('Error al votar');
    }
  };

  const judge = async (optionA, optionB, argsA, argsB) => {
    try {
      const res = await axios.post(`${API_URL}/api/judge`, {
        optionA,
        optionB,
        argumentsA: argsA,
        argumentsB: argsB
      });
      setJudgeResult(res.data);
    } catch (error) {
      alert('Error al obtener veredicto');
    }
  };

  const getSuggestion = async () => {
    try {
      const res = await axios.post(`${API_URL}/api/planner/suggest`, {
        history: [],
        preferences: {},
        budget: 500
      });
      setSuggestion(res.data);
    } catch (error) {
      alert('Error al obtener sugerencia');
    }
  };

  const loadMemories = async () => {
    if (!coupleId) return;
    try {
      const res = await axios.get(`${API_URL}/api/memories?coupleId=${coupleId}`);
      setMemories(res.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const addMemory = async (title, description) => {
    if (!coupleId || !user) return;
    try {
      await axios.post(`${API_URL}/api/memories`, {
        coupleId,
        userId: user.id,
        title,
        description,
        date: new Date().toISOString().split('T')[0]
      });
      loadMemories();
    } catch (error) {
      alert('Error al guardar recuerdo');
    }
  };

  useEffect(() => {
    if (user && !coupleId) {
      setCoupleId('demo');
      loadMemories();
    }
  }, [user]);

  if (loading) return <div className="p-8 text-center">Cargando...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <h1 className="text-4xl font-bold text-pink-600 mb-4">❤️ LoveBite AI</h1>
          <p className="text-gray-600 mb-6">La app definitiva para parejas</p>
          <button
            onClick={login}
            className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-xl transition"
          >
            Iniciar sesión con Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-pink-600">❤️ LoveBite AI</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user.email}</span>
          <button onClick={logout} className="text-sm text-red-500">Cerrar sesión</button>
        </div>
      </header>

      <nav className="bg-white border-b flex overflow-x-auto p-2 gap-2">
        {['roulette', 'battle', 'judge', 'planner', 'memories'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              activeTab === tab ? 'bg-pink-100 text-pink-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab === 'roulette' && '🎲 Ruleta'}
            {tab === 'battle' && '⚔️ Batalla'}
            {tab === 'judge' && '🏆 Juez'}
            {tab === 'planner' && '🍕 Planificador'}
            {tab === 'memories' && '❤️ Recuerdos'}
          </button>
        ))}
      </nav>

      <main className="p-4 max-w-4xl mx-auto">
        {activeTab === 'roulette' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">🎲 Ruleta del Amor</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <select id="type" className="border rounded-lg p-2">
                <option value="food">🍕 Comida</option>
                <option value="activity">🎯 Actividad</option>
                <option value="movie">🎬 Película</option>
                <option value="place">📍 Lugar</option>
              </select>
              <input id="budget" type="number" placeholder="Presupuesto" className="border rounded-lg p-2" />
              <input id="mood" type="text" placeholder="Estado de ánimo" className="border rounded-lg p-2" />
            </div>
            <button
              onClick={() => {
                const type = document.getElementById('type').value;
                const budget = document.getElementById('budget').value;
                const mood = document.getElementById('mood').value;
                spinRoulette(type, budget, mood);
              }}
              className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-xl transition"
            >
              🎰 Girar
            </button>
            {rouletteOptions.length > 0 && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                {rouletteOptions.map((opt, i) => (
                  <div key={i} className="border rounded-xl p-4 text-center hover:shadow-md transition">
                    <p className="font-medium">{opt}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'battle' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">⚔️ Food Battle</h2>
            {!battle ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input id="optA" placeholder="Opción A (ej: Pizza)" className="border rounded-lg p-2" />
                  <input id="optB" placeholder="Opción B (ej: Sushi)" className="border rounded-lg p-2" />
                </div>
                <button
                  onClick={() => {
                    const a = document.getElementById('optA').value;
                    const b = document.getElementById('optB').value;
                    if (a && b) startBattle(a, b);
                  }}
                  className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-xl transition"
                >
                  ⚔️ Iniciar Batalla
                </button>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-2">Ronda {battle.rounds || 0}/5</p>
                <div className="flex justify-between mb-4">
                  <span className="font-bold text-blue-600">{battle.option_a || 'A'}: {battle.scores?.optionA || 0}</span>
                  <span className="font-bold text-red-600">{battle.option_b || 'B'}: {battle.scores?.optionB || 0}</span>
                </div>
                {battleQuestion && (
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <p className="font-medium">{battleQuestion.question}</p>
                    <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                      <div className="bg-blue-50 p-2 rounded"><strong>A:</strong> {battleQuestion.argumentA}</div>
                      <div className="bg-red-50 p-2 rounded"><strong>B:</strong> {battleQuestion.argumentB}</div>
                    </div>
                  </div>
                )}
                {battle.status !== 'finished' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => voteBattle('A')} className="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-xl transition">Votar por A</button>
                    <button onClick={() => voteBattle('B')} className="bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl transition">Votar por B</button>
                  </div>
                ) : (
                  <p className="text-center text-green-600 font-bold">🏆 Ganador: {battle.winner}</p>
                )}
                {battle.status === 'finished' && (
                  <button onClick={() => setBattle(null)} className="w-full mt-4 bg-gray-200 hover:bg-gray-300 py-2 rounded-xl transition">Nueva batalla</button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'judge' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">🏆 Judge AI</h2>
            <div className="space-y-4">
              <input id="jOptA" placeholder="Opción A" className="w-full border rounded-lg p-2" />
              <input id="jArgsA" placeholder="Argumentos para A" className="w-full border rounded-lg p-2" />
              <input id="jOptB" placeholder="Opción B" className="w-full border rounded-lg p-2" />
              <input id="jArgsB" placeholder="Argumentos para B" className="w-full border rounded-lg p-2" />
              <button
                onClick={() => {
                  const a = document.getElementById('jOptA').value;
                  const aa = document.getElementById('jArgsA').value;
                  const b = document.getElementById('jOptB').value;
                  const bb = document.getElementById('jArgsB').value;
                  if (a && b) judge(a, b, aa, bb);
                }}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-xl transition"
              >
                ⚖️ Pedir Veredicto
              </button>
              {judgeResult && (
                <div className="mt-4 bg-gray-50 rounded-xl p-4">
                  <p className="font-bold">Veredicto: {judgeResult.verdict}</p>
                  <p className="text-sm mt-2">{judgeResult.reason}</p>
                  {judgeResult.compromise && <p className="text-sm text-green-600 mt-2">💡 Compromiso: {judgeResult.compromise}</p>}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'planner' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">🍕 Smart Planner</h2>
            <button
              onClick={getSuggestion}
              className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-xl transition"
            >
              💡 Sugerir comida
            </button>
            {suggestion && (
              <div className="mt-4 bg-gray-50 rounded-xl p-4">
                <p className="font-bold text-lg">{suggestion.meal}</p>
                <p className="text-sm">{suggestion.reason}</p>
                {suggestion.restaurant && <p className="text-sm text-pink-600">📍 {suggestion.restaurant}</p>}
              </div>
            )}
          </div>
        )}

        {activeTab === 'memories' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">❤️ Nuestros Recuerdos</h2>
            <div className="space-y-4">
              <input id="memTitle" placeholder="Título" className="w-full border rounded-lg p-2" />
              <input id="memDesc" placeholder="Descripción" className="w-full border rounded-lg p-2" />
              <button
                onClick={() => {
                  const t = document.getElementById('memTitle').value;
                  const d = document.getElementById('memDesc').value;
                  if (t) addMemory(t, d);
                }}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-xl transition"
              >
                📸 Guardar Recuerdo
              </button>
            </div>
            <div className="mt-6 space-y-2">
              {memories.map(m => (
                <div key={m.id} className="border-b py-2">
                  <p className="font-semibold">{m.title}</p>
                  <p className="text-sm text-gray-600">{m.description}</p>
                  <p className="text-xs text-gray-400">{m.date}</p>
                </div>
              ))}
              {memories.length === 0 && <p className="text-gray-400 text-center">Aún no hay recuerdos. ¡Guarda el primero!</p>}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
