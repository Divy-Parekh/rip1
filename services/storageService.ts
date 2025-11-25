
import { Candidate, ResumeData, ResumeVersion, SavedJobRole } from "../types";
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'rip_candidates';
const ROLES_STORAGE_KEY = 'rip_job_roles';

// --- Candidates ---

export const getCandidates = (): Candidate[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveCandidates = (candidates: Candidate[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(candidates));
};

export const findDuplicate = (email: string, phone: string): Candidate | undefined => {
  const candidates = getCandidates();
  return candidates.find(c => 
    (c.email && c.email.toLowerCase() === email.toLowerCase()) || 
    (c.phone && phone && c.phone.replace(/\D/g, '') === phone.replace(/\D/g, ''))
  );
};

export const addOrUpdateCandidate = (parsedData: ResumeData, rawText: string, uploadedBy: string): Candidate => {
  const candidates = getCandidates();
  const existing = findDuplicate(parsedData.email, parsedData.phone);
  
  const newVersion: ResumeVersion = {
    versionId: uuidv4(),
    uploadedAt: Date.now(),
    uploadedBy,
    rawText,
    data: parsedData
  };

  if (existing) {
    // Update existing
    const updatedCandidate: Candidate = {
      ...existing,
      currentData: parsedData, // Latest wins strategy
      fullName: parsedData.fullName || existing.fullName, // Fallback
      email: parsedData.email || existing.email,
      phone: parsedData.phone || existing.phone,
      updatedAt: Date.now(),
      versions: [newVersion, ...existing.versions] // Prepend new version
    };
    
    const updatedList = candidates.map(c => c.id === existing.id ? updatedCandidate : c);
    saveCandidates(updatedList);
    return updatedCandidate;
  } else {
    // Create new
    const newCandidate: Candidate = {
      id: uuidv4(),
      fullName: parsedData.fullName,
      email: parsedData.email,
      phone: parsedData.phone,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      versions: [newVersion],
      currentData: parsedData
    };
    
    saveCandidates([...candidates, newCandidate]);
    return newCandidate;
  }
};

export const updateCandidate = (candidate: Candidate) => {
    const candidates = getCandidates();
    const updatedList = candidates.map(c => c.id === candidate.id ? candidate : c);
    saveCandidates(updatedList);
};

export const deleteCandidate = (id: string) => {
    const candidates = getCandidates().filter(c => c.id !== id);
    saveCandidates(candidates);
};

export const getCandidateById = (id: string): Candidate | undefined => {
    return getCandidates().find(c => c.id === id);
};

// --- Job Roles ---

export const getJobRoles = (): SavedJobRole[] => {
    const data = localStorage.getItem(ROLES_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
};

export const saveJobRoles = (roles: SavedJobRole[]) => {
    localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(roles));
};

export const addJobRole = (role: Omit<SavedJobRole, 'id' | 'createdAt'>): SavedJobRole => {
    const roles = getJobRoles();
    const newRole: SavedJobRole = {
        ...role,
        id: uuidv4(),
        createdAt: Date.now()
    };
    saveJobRoles([...roles, newRole]);
    return newRole;
};

export const updateJobRole = (role: SavedJobRole) => {
    const roles = getJobRoles();
    const updatedList = roles.map(r => r.id === role.id ? role : r);
    saveJobRoles(updatedList);
};

export const deleteJobRole = (id: string) => {
    const roles = getJobRoles().filter(r => r.id !== id);
    saveJobRoles(roles);
};

export const getJobRoleById = (id: string): SavedJobRole | undefined => {
    return getJobRoles().find(r => r.id === id);
};
