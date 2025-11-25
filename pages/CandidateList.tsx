import React, { useState, useMemo } from 'react';
import { getCandidates } from '../services/storageService';
import { Link, useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, ChevronRight, UserPlus } from 'lucide-react';

const CandidateList: React.FC = () => {
  const navigate = useNavigate();
  const candidates = getCandidates();
  const [searchQuery, setSearchQuery] = useState('');
  const [minExp, setMinExp] = useState(0);

  // Search Logic
  const filteredCandidates = useMemo(() => {
    const queryParts = searchQuery.toLowerCase().split(' ').filter(Boolean);
    
    return candidates.map(c => {
        // Calculate matches
        const skills = c.currentData.skills.map(s => s.toLowerCase());
        const matches = queryParts.filter(part => skills.some(s => s.includes(part)));
        
        // Simple rule-based ranking score
        const expScore = Math.min((c.currentData.totalExperienceYears || 0) * 5, 30);
        const recencyScore = 20; 
        const totalScore = queryParts.length > 0 
            ? (matches.length / queryParts.length) * 50 + expScore + recencyScore
            : 0;

        return { ...c, matchScore: totalScore, matches };
    })
    .filter(c => {
        if (minExp > 0 && (c.currentData.totalExperienceYears || 0) < minExp) return false;
        if (queryParts.length === 0) return true;
        return c.matches.length > 0;
    })
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  }, [candidates, searchQuery, minExp]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
            <p className="text-gray-500">Search by skills (e.g., "React Node Mongo")</p>
        </div>
        <Link to="/ingest" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium shadow-sm transition-colors flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Add Candidate
        </Link>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
                type="text" 
                placeholder="Search skills (e.g. React TypeScript AWS)..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-gray-900 transition-all"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
            />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
            <SlidersHorizontal className="text-gray-400 w-5 h-5" />
            <select 
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 bg-white text-gray-900 min-w-[140px]"
                value={minExp}
                onChange={e => setMinExp(Number(e.target.value))}
            >
                <option value="0">Any Experience</option>
                <option value="1">1+ Years</option>
                <option value="3">3+ Years</option>
                <option value="5">5+ Years</option>
            </select>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/80">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Top Skills</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                    <th className="relative px-6 py-3"><span className="sr-only">Action</span></th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {filteredCandidates.map((c) => (
                    <tr 
                        key={c.id} 
                        onClick={() => navigate(`/candidates/${c.id}`)}
                        className="hover:bg-indigo-50/50 transition-colors cursor-pointer group"
                    >
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                                <div className="h-10 w-10 flex-shrink-0 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold transition-colors group-hover:bg-indigo-200">
                                    {c.fullName.charAt(0).toUpperCase()}
                                </div>
                                <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900 group-hover:text-indigo-700">{c.fullName}</div>
                                    <div className="text-sm text-gray-500">{c.email}</div>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                                {c.currentData.skills.slice(0, 3).map(s => (
                                    <span key={s} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full border border-gray-200 group-hover:border-indigo-100 group-hover:bg-white">{s}</span>
                                ))}
                                {c.currentData.skills.length > 3 && <span className="text-xs text-gray-400 flex items-center">+{c.currentData.skills.length - 3}</span>}
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {c.currentData.totalExperienceYears || 0} Years
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            {searchQuery ? (
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${c.matchScore && c.matchScore > 70 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {Math.round(c.matchScore || 0)}% Match
                                </span>
                            ) : <span className="text-gray-400 text-xs">-</span>}
                        </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(c.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-500 ml-auto" />
                        </td>
                    </tr>
                ))}
                {filteredCandidates.length === 0 && (
                    <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                            No candidates match your search.
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default CandidateList;