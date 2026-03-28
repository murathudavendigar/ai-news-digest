"use client";

import { useState, useEffect } from 'react';

function getSessionId() {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('haberai_session_id');
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
    localStorage.setItem('haberai_session_id', id);
  }
  return id;
}

export default function ColumnPoll({ pollId, columnistAccent }) {
  const [poll, setPoll] = useState(null);
  const [results, setResults] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [status, setStatus] = useState('loading'); // loading, question, voting, voted
  
  useEffect(() => {
    if (!pollId) return;
    
    // Check if already voted
    const votedState = typeof window !== 'undefined' ? localStorage.getItem(`haberai_voted_${pollId}`) : null;
    
    fetch(`/api/polls/${pollId}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setStatus('error');
          return;
        }
        setPoll(data.poll);
        setResults(data.results || []);
        setTotalVotes(data.totalVotes || 0);
        if (votedState) {
          setStatus('voted');
        } else {
          setStatus('question');
        }
      })
      .catch(() => setStatus('error'));
  }, [pollId]);

  const handleVote = async (index) => {
    setStatus('voting');
    try {
      const sessionId = getSessionId();
      const res = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionIndex: index, sessionId }),
      });
      const data = await res.json();
      
      if (data.results) {
        setResults(data.results);
        setTotalVotes(data.totalVotes);
      }
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(`haberai_voted_${pollId}`, 'true');
      }
      setStatus('voted');
    } catch (e) {
      console.error(e);
      setStatus('question'); // revert
    }
  };

  const handleShare = async () => {
    if (!poll || results.length === 0) return;
    
    const sorted = [...results].sort((a,b) => b.count - a.count);
    const winner = sorted[0];
    
    const text = `HaberAI anketi: "${poll.question}"\n%${winner.percentage} "${winner.text}" dedi 🗳️\nSen de katıl: ${window.location.href}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'HaberAI Anketi',
          text,
          url: window.location.href
        });
      } catch(e) {}
    } else {
      navigator.clipboard.writeText(text);
      alert('Anket sonucu kopyalandı!');
    }
  };

  if (status === 'loading') {
    return (
      <div className="w-full my-12 bg-stone-50 dark:bg-stone-900 rounded-2xl p-6 md:p-8 animate-pulse border border-stone-100 dark:border-stone-800">
        <div className="h-4 w-32 bg-stone-200 dark:bg-stone-700 rounded mb-4"></div>
        <div className="h-6 w-3/4 bg-stone-200 dark:bg-stone-700 rounded mb-8"></div>
        <div className="space-y-4">
          <div className="h-12 bg-stone-200 dark:bg-stone-700 rounded-xl"></div>
          <div className="h-12 bg-stone-200 dark:bg-stone-700 rounded-xl"></div>
          <div className="h-12 bg-stone-200 dark:bg-stone-700 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (status === 'error' || !poll) {
    return null;
  }

  return (
    <div className="w-full my-12 bg-stone-50 dark:bg-stone-900/50 rounded-2xl p-6 md:p-8 border border-stone-100 dark:border-stone-800 shadow-sm relative overflow-hidden">
      {/* Top accent */}
      <div className="absolute top-0 left-0 right-0 h-1 opacity-70" style={{ backgroundColor: columnistAccent }} />
      
      <p className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: columnistAccent }}>
        Siz Ne Düşünüyorsunuz?
      </p>
      
      <h3 className="text-xl md:text-2xl font-bold text-stone-900 dark:text-white mb-6 leading-snug">
        {poll.question}
      </h3>

      {status === 'question' || status === 'voting' ? (
        <div className="space-y-3">
          {poll.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleVote(i)}
              disabled={status === 'voting'}
              className="w-full text-left p-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:shadow-md transition-all group disabled:opacity-50"
            >
              <span className="font-medium text-stone-800 dark:text-stone-200 group-hover:text-stone-900 dark:group-hover:text-white transition-colors">
                {opt}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {results.map((res, i) => {
            const isWinner = results.every(r => r.count <= res.count) && res.count > 0;
            return (
              <div key={i} className="relative w-full rounded-xl overflow-hidden border border-stone-100 dark:border-stone-700 bg-white dark:bg-stone-800 p-4">
                {/* Progress bar background */}
                <div 
                  className="absolute top-0 bottom-0 left-0 opacity-10 transition-all duration-1000 ease-out"
                  style={{ 
                    width: `${res.percentage}%`, 
                    backgroundColor: columnistAccent 
                  }}
                />
                
                <div className="relative z-10 flex justify-between items-center gap-4">
                  <span className={`font-medium ${isWinner ? 'text-stone-900 dark:text-white' : 'text-stone-700 dark:text-stone-300'}`}>
                    {res.text}
                  </span>
                  <span className={`font-bold shrink-0 ${isWinner ? '' : 'text-stone-500'}`} style={{ color: isWinner ? columnistAccent : undefined }}>
                    %{res.percentage}
                  </span>
                </div>
              </div>
            );
          })}
          
          <div className="pt-4 flex items-center justify-between mt-4 border-t border-stone-100 dark:border-stone-800">
            <span className="text-sm text-stone-500 dark:text-stone-400">
              Toplam {totalVotes.toLocaleString('tr-TR')} oy
            </span>
            <button 
              onClick={handleShare}
              className="flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-80"
              style={{ color: columnistAccent }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
              Sonucu Paylaş
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
