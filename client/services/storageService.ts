import { Candidate, ResumeData, ResumeVersion, SavedJobRole } from "../types";
import { v4 as uuidv4 } from "uuid";

// const STORAGE_KEY = "rip_candidates";
// const ROLES_STORAGE_KEY = "rip_job_roles";
const CANDIDATE_BASE_URL = "http://localhost:5000/api/candidate";
const JOBS_BASE_URL = "http://localhost:5000/api/jobs";

// --- Candidates ---
export const getCandidates = async (): Promise<Candidate[]> => {
  try {
    const res = await fetch(`${CANDIDATE_BASE_URL}/all`);

    if (!res.ok) throw new Error("Failed to fetch candidates");

    return await res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const createCandidate = async (
  candidate: Candidate,
): Promise<Candidate | null> => {
  try {
    const res = await fetch(`${CANDIDATE_BASE_URL}/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(candidate),
    });

    if (!res.ok) throw new Error("Failed to create");

    return await res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const getCandidateById = async (
  id: string,
): Promise<Candidate | null> => {
  try {
    const res = await fetch(`${CANDIDATE_BASE_URL}/${id}`);

    if (!res.ok) return null;

    return await res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const getCandidateByEmailAndPhone = async (
  email: string,
  phone: string,
): Promise<Candidate | null> => {
  try {
    const res = await fetch(
      `${CANDIDATE_BASE_URL}?email=${email}&phone=${phone}`,
    );

    if (!res.ok) return null;

    return await res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const updateCandidate = async (
  candidate: Candidate,
): Promise<boolean> => {
  try {
    const res = await fetch(`${CANDIDATE_BASE_URL}/${candidate.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(candidate),
    });

    return res.ok;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const deleteCandidate = async (id: string): Promise<boolean> => {
  try {
    const res = await fetch(`${CANDIDATE_BASE_URL}/${id}`, {
      method: "DELETE",
    });

    return res.ok;
  } catch (error) {
    console.error(error);
    return false;
  }
};

// export const saveCandidates = (candidates: Candidate[]) => {
//   localStorage.setItem(STORAGE_KEY, JSON.stringify(candidates));
// };

export const findDuplicate = async (
  email: string,
  phone: string,
): Promise<Candidate | null> => {
  const candidate = getCandidateByEmailAndPhone(email, phone);
  return candidate;
};

export const addOrUpdateCandidate = async (
  parsedData: ResumeData,
  rawText: string,
  uploadedBy: string,
): Promise<Candidate | null> => {
  const existing = await findDuplicate(parsedData.email, parsedData.phone);

  const newVersion: ResumeVersion = {
    versionId: uuidv4(),
    uploadedAt: Date.now(),
    uploadedBy,
    rawText,
    data: parsedData,
  };

  if (existing) {
    const updatedCandidate: Candidate = {
      ...existing,
      currentData: parsedData,
      fullName: parsedData.fullName || existing.fullName,
      email: parsedData.email || existing.email,
      phone: parsedData.phone || existing.phone,
      updatedAt: Date.now(),
      versions: [newVersion, ...existing.versions],
    };

    await updateCandidate(updatedCandidate);
    return updatedCandidate;
  } else {
    const newCandidate: Candidate = {
      id: uuidv4(),
      fullName: parsedData.fullName,
      email: parsedData.email,
      phone: parsedData.phone,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      versions: [newVersion],
      currentData: parsedData,
    };

    return await createCandidate(newCandidate);
  }
};
// --- Job Roles ---

export const getJobRoles = async (): Promise<SavedJobRole[]> => {
  try {
    const res = await fetch(JOBS_BASE_URL + "/all");

    if (!res.ok) throw new Error("Failed to fetch roles");

    return await res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const getJobRoleById = async (
  id: string,
): Promise<SavedJobRole | null> => {
  try {
    const res = await fetch(`${JOBS_BASE_URL}/${id}`);

    if (!res.ok) return null;

    return await res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const addJobRole = async (
  role: Omit<SavedJobRole, "id" | "createdAt">,
): Promise<SavedJobRole | null> => {
  try {
    const res = await fetch(JOBS_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(role),
    });

    if (!res.ok) throw new Error("Failed to create role");

    return await res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
};

// export const saveJobRoles = (roles: SavedJobRole[]) => {
//   localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(roles));
// };

export const updateJobRole = async (role: SavedJobRole): Promise<boolean> => {
  try {
    const res = await fetch(`${JOBS_BASE_URL}/${role.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(role),
    });

    return res.ok;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const deleteJobRole = async (id: string): Promise<boolean> => {
  try {
    const res = await fetch(`${JOBS_BASE_URL}/${id}`, {
      method: "DELETE",
    });

    return res.ok;
  } catch (error) {
    console.error(error);
    return false;
  }
};
