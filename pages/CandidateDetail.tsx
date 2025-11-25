
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCandidateById, deleteCandidate, updateCandidate } from '../services/storageService';
import { generateInterviewQuestions } from '../services/geminiService';
import { Candidate, InterviewQuestion, ResumeData, ResumeVersion } from '../types';
import { 
    ArrowLeft, Mail, Phone, MapPin, Clock, 
    FileText, Briefcase, GraduationCap, BrainCircuit, Layers, Trash2, Edit2, Save, X,
    History, ExternalLink, Linkedin, Github, Globe
} from 'lucide-react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import DiffViewer from '../components/DiffViewer';

const CandidateDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<Candidate | undefined>(undefined);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [compareVersionId, setCompareVersionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'raw' | 'interview' | 'compare'>('profile');
  
  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<ResumeData | null>(null);

  useEffect(() => {
    if (id) {
        const c = getCandidateById(id);
        if (c) {
            setCandidate(c);
            setSelectedVersionId(c.versions[0].versionId);
            // Default comparison: if more than 1 version, compare latest with previous
            if (c.versions.length > 1) {
                setCompareVersionId(c.versions[1].versionId);
            }
        }
    }
  }, [id]);

  const handleDelete = () => {
      if (window.confirm("Are you sure you want to delete this candidate?")) {
          if (id) {
              deleteCandidate(id);
              navigate('/candidates');
          }
      }
  };

  const handleEditToggle = () => {
      if (isEditing) {
          setIsEditing(false);
          setEditData(null);
      } else if (candidate) {
          setEditData({ ...candidate.currentData });
          setIsEditing(true);
          setActiveTab('profile');
      }
  };

  const handleSave = () => {
      if (candidate && editData) {
          const updatedCandidate: Candidate = {
              ...candidate,
              fullName: editData.fullName,
              email: editData.email,
              phone: editData.phone,
              updatedAt: Date.now(),
              currentData: editData
          };
          updateCandidate(updatedCandidate);
          setCandidate(updatedCandidate);
          setIsEditing(false);
          setEditData(null);
      }
  };

  const handleGenerateQuestions = async () => {
      if (!candidate) return;
      setLoadingQuestions(true);
      const qs = await generateInterviewQuestions(candidate);
      setQuestions(qs);
      setLoadingQuestions(false);
  };

  // Helper to format data for diff
  const formatList = (items: string[]) => items.map(i => `• ${i}`).join('\n');
  const formatExperience = (exps: any[]) => exps.map(e => `${e.role} at ${e.company} (${e.duration})\n${e.description}`).join('\n\n-------------------\n\n');
  const formatProjects = (projs: any[]) => projs.map(p => `${p.name}\n${p.description}\nTech: ${p.technologies.join(', ')}`).join('\n\n-------------------\n\n');

  if (!candidate) return <div className="p-8 text-center">Candidate not found</div>;

  const currentVersion = candidate.versions.find(v => v.versionId === selectedVersionId) || candidate.versions[0];
  const compareVersion = candidate.versions.find(v => v.versionId === compareVersionId);
  
  const displayData = isEditing && editData ? editData : currentVersion.data;
  const isViewingLatest = currentVersion.versionId === candidate.versions[0].versionId;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-3 w-full lg:w-auto">
            <Link to="/candidates" className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
                <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex-1">
                {isEditing ? (
                    <input 
                        type="text"
                        value={displayData.fullName}
                        onChange={e => setEditData(prev => prev ? {...prev, fullName: e.target.value} : null)}
                        className="text-2xl font-bold text-gray-900 border border-gray-300 rounded p-1 w-full bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="Full Name"
                    />
                ) : (
                    <h1 className="text-2xl font-bold text-gray-900">{candidate.fullName}</h1>
                )}
                
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-1">
                    <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" /> 
                        {isEditing ? (
                            <input 
                                value={displayData.email} 
                                onChange={e => setEditData(prev => prev ? {...prev, email: e.target.value} : null)}
                                className="border rounded px-2 py-0.5 bg-white text-gray-900 focus:border-indigo-500 outline-none" placeholder="Email"
                            />
                        ) : displayData.email}
                    </div>
                    <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {isEditing ? (
                            <input 
                                value={displayData.phone} 
                                onChange={e => setEditData(prev => prev ? {...prev, phone: e.target.value} : null)}
                                className="border rounded px-2 py-0.5 bg-white text-gray-900 focus:border-indigo-500 outline-none" placeholder="Phone"
                            />
                        ) : displayData.phone}
                    </div>
                    <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {isEditing ? (
                            <input 
                                value={displayData.location} 
                                onChange={e => setEditData(prev => prev ? {...prev, location: e.target.value} : null)}
                                className="border rounded px-2 py-0.5 bg-white text-gray-900 focus:border-indigo-500 outline-none" placeholder="Location"
                            />
                        ) : displayData.location}
                    </div>
                </div>

                {/* Social Links */}
                {!isEditing && displayData.socialLinks && displayData.socialLinks.length > 0 && (
                    <div className="flex gap-3 mt-2">
                        {displayData.socialLinks.map((link, idx) => {
                            let Icon = Globe;
                            if (link.platform.toLowerCase().includes('linkedin')) Icon = Linkedin;
                            if (link.platform.toLowerCase().includes('github')) Icon = Github;
                            return (
                                <a key={idx} href={link.url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-800 transition-colors" title={link.platform}>
                                    <Icon className="w-4 h-4" />
                                </a>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
        <div className="flex items-center gap-3">
             <div className="text-right mr-4 hidden sm:block">
                <span className="text-xs text-gray-500 block">Version History</span>
                <select 
                    className="text-sm border border-gray-200 rounded p-1 bg-white text-gray-900 outline-none focus:border-indigo-500"
                    value={selectedVersionId || ''}
                    onChange={(e) => setSelectedVersionId(e.target.value)}
                    disabled={isEditing}
                >
                    {candidate.versions.map((v, idx) => (
                        <option key={v.versionId} value={v.versionId}>
                            v{candidate.versions.length - idx} - {new Date(v.uploadedAt).toLocaleDateString()} ({v.uploadedBy})
                        </option>
                    ))}
                </select>
            </div>
            
            {isViewingLatest && (
                isEditing ? (
                    <>
                        <button onClick={handleSave} className="p-2 text-green-600 hover:bg-green-50 rounded-lg flex items-center gap-1 font-medium transition-colors">
                            <Save className="w-5 h-5" /> Save
                        </button>
                        <button onClick={handleEditToggle} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </>
                ) : (
                    <button onClick={handleEditToggle} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit Info">
                        <Edit2 className="w-5 h-5" />
                    </button>
                )
            )}

            <button onClick={handleDelete} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete Candidate">
                <Trash2 className="w-5 h-5" />
            </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {[
                { id: 'profile', label: 'Profile View', icon: FileText },
                { id: 'raw', label: 'Raw Resume', icon: FileText },
                { id: 'interview', label: 'AI Interview', icon: BrainCircuit },
                { id: 'compare', label: 'Version Compare', icon: History }
            ].map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => !isEditing && setActiveTab(tab.id as any)}
                    disabled={isEditing}
                    className={clsx(
                        "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors flex items-center gap-2",
                        activeTab === tab.id 
                            ? "border-indigo-500 text-indigo-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
                        isEditing && "opacity-50 cursor-not-allowed"
                    )}
                >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                </button>
            ))}
        </nav>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left / Main Content */}
        <div className="lg:col-span-2 space-y-6">
            {activeTab === 'profile' && (
                <>
                    {/* Summary */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-gray-400" /> Summary
                        </h2>
                        {isEditing ? (
                            <textarea 
                                value={displayData.summary}
                                onChange={e => setEditData(prev => prev ? {...prev, summary: e.target.value} : null)}
                                className="w-full h-32 border border-gray-300 rounded p-3 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        ) : (
                            <p className="text-gray-600 leading-relaxed">{displayData.summary || "No summary available."}</p>
                        )}
                    </div>

                    {/* Experience */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-gray-400" /> Work Experience
                        </h2>
                        {isEditing && <p className="text-xs text-amber-600 mb-4 bg-amber-50 p-2 rounded">Advanced editing (Experience/Projects) not available in quick edit.</p>}
                        
                        <div className="relative border-l-2 border-gray-200 ml-3 space-y-8 pb-2">
                            {displayData.experience?.map((exp, idx) => (
                                <div key={idx} className="relative pl-8 group">
                                    {/* Timeline Node */}
                                    <div className="absolute -left-[17px] top-0 flex items-center justify-center w-9 h-9 rounded-full bg-white border-2 border-indigo-100 text-indigo-600 shadow-sm group-hover:border-indigo-500 group-hover:scale-110 transition-all">
                                       <Clock className="w-4 h-4" />
                                    </div>
                                    
                                    {/* Content Card */}
                                    <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all">
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                                            <div>
                                                <div className="font-bold text-gray-900 text-lg leading-tight">{exp.role}</div>
                                                <div className="text-indigo-600 font-medium text-sm">{exp.company}</div>
                                            </div>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 whitespace-nowrap">
                                                {exp.duration}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{exp.description}</p>
                                    </div>
                                </div>
                            ))}
                             {(!displayData.experience || displayData.experience.length === 0) && <p className="pl-8 text-gray-500 italic">No experience listed.</p>}
                        </div>
                    </div>

                    {/* Projects */}
                    {displayData.projects && displayData.projects.length > 0 && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Layers className="w-5 h-5 text-gray-400" /> Projects
                            </h2>
                            <div className="grid gap-4">
                                {displayData.projects.map((proj, idx) => (
                                    <div key={idx} className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-50">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-medium text-indigo-700">{proj.name}</h3>
                                            {proj.url && (
                                                <a href={proj.url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-indigo-600">
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">{proj.description}</p>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {proj.technologies?.map(t => (
                                                <span key={t} className="text-xs bg-white border border-gray-200 px-2 py-1 rounded text-gray-600">{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {activeTab === 'raw' && (
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Raw Resume Text</h2>
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono bg-gray-50 p-4 rounded-lg border border-gray-200 overflow-x-auto max-h-[600px] overflow-y-auto">
                        {currentVersion.rawText || "No raw text available."}
                    </pre>
                 </div>
            )}

            {activeTab === 'compare' && (
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Compare Versions</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Comparing Current (v{candidate.versions.findIndex(v => v.versionId === selectedVersionId) === -1 ? candidate.versions.length : candidate.versions.length - candidate.versions.findIndex(v => v.versionId === selectedVersionId)}) against:</span>
                            <select 
                                className="text-sm border border-gray-300 rounded p-1.5 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500"
                                value={compareVersionId || ''}
                                onChange={(e) => setCompareVersionId(e.target.value)}
                            >
                                <option value="" disabled>Select version</option>
                                {candidate.versions
                                    .filter(v => v.versionId !== selectedVersionId)
                                    .map((v, idx) => (
                                    <option key={v.versionId} value={v.versionId}>
                                        v{candidate.versions.length - candidate.versions.findIndex(x => x.versionId === v.versionId)} - {new Date(v.uploadedAt).toLocaleDateString()}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {compareVersion ? (
                        <div className="space-y-6">
                             <DiffViewer 
                                title="Skills Changes"
                                oldText={formatList(compareVersion.data.skills || [])}
                                newText={formatList(currentVersion.data.skills || [])}
                             />
                             <DiffViewer 
                                title="Experience Changes"
                                oldText={formatExperience(compareVersion.data.experience || [])}
                                newText={formatExperience(currentVersion.data.experience || [])}
                             />
                             <DiffViewer 
                                title="Projects Changes"
                                oldText={formatProjects(compareVersion.data.projects || [])}
                                newText={formatProjects(currentVersion.data.projects || [])}
                             />
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                            <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>Select a version to compare changes.</p>
                        </div>
                    )}
                 </div>
            )}

            {activeTab === 'interview' && (
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <BrainCircuit className="w-5 h-5 text-indigo-600" /> AI Interview Generator
                        </h2>
                        <button 
                            onClick={handleGenerateQuestions} 
                            disabled={loadingQuestions}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                        >
                            {loadingQuestions ? 'Generating...' : 'Generate Questions'}
                        </button>
                    </div>

                    {questions.length === 0 && !loadingQuestions && (
                        <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-100 rounded-xl">
                            <p>Click generate to create tailored interview questions based on this profile.</p>
                        </div>
                    )}

                    <div className="space-y-6">
                        {questions.map((q, i) => (
                            <div key={i} className="border-l-4 border-indigo-500 pl-4 py-1 bg-indigo-50/30 p-4 rounded-r-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-indigo-100 text-indigo-800 border border-indigo-200">{q.type}</span>
                                </div>
                                <h3 className="font-medium text-gray-900 text-lg">{q.question}</h3>
                                <p className="text-sm text-gray-500 mt-2 italic flex gap-1">
                                    <span className="font-semibold">Context:</span> {q.context}
                                </p>
                            </div>
                        ))}
                    </div>
                 </div>
            )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
             {/* Skills */}
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Skills</h3>
                {isEditing ? (
                    <textarea 
                        value={displayData.skills.join(', ')}
                        onChange={e => setEditData(prev => prev ? {...prev, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)} : null)}
                        className="w-full h-32 border border-gray-300 rounded p-3 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="Java, Python, React..."
                    />
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {displayData.skills.map(skill => (
                            <span key={skill} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium border border-indigo-100">
                                {skill}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Education */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><GraduationCap className="w-4 h-4" /> Education</h3>
                <div className="space-y-4">
                    {displayData.education?.map((edu, idx) => (
                        <div key={idx} className="text-sm border-l-2 border-gray-100 pl-3">
                            <div className="font-medium text-gray-900">{edu.institution}</div>
                            <div className="text-gray-600">{edu.degree}</div>
                            <div className="text-gray-400 text-xs">{edu.year}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Metadata */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-sm space-y-3">
                <div className="flex justify-between">
                    <span className="text-gray-500">Total Experience</span>
                    <span className="font-medium text-gray-900">{displayData.totalExperienceYears || 0} Years</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-gray-500">Last Updated</span>
                    <span className="font-medium text-gray-900">{new Date(candidate.updatedAt).toLocaleDateString()}</span>
                </div>
                 <div className="flex justify-between pt-2 border-t border-gray-100">
                    <span className="text-gray-500">Profile ID</span>
                    <span className="font-mono text-xs text-gray-400">{candidate.id.slice(0,8)}...</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateDetail;