import { Candidate, ResumeData, ResumeVersion, SavedJobRole } from "../types";
import { v4 as uuidv4 } from "uuid";
import { apiClient } from "./apiClient";

const CANDIDATE_BASE_URL = "http://localhost:5000/api/candidate";
const JOBS_BASE_URL = "http://localhost:5000/api/jobs";

// --- Candidates ---
export const getCandidates = async (): Promise<Candidate[]> => {
  try {
    const res = await apiClient(`${CANDIDATE_BASE_URL}/all`);
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
    const res = await apiClient(`${CANDIDATE_BASE_URL}/create`, {
      method: "POST",
      body: JSON.stringify(candidate),
    });
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
    const res = await apiClient(`${CANDIDATE_BASE_URL}/${id}`);
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
    const res = await apiClient(
      `${CANDIDATE_BASE_URL}?email=${email}&phone=${phone}`,
    );
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
    const res = await apiClient(`${CANDIDATE_BASE_URL}/${candidate.id}`, {
      method: "PUT",
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
    const res = await apiClient(`${CANDIDATE_BASE_URL}/${id}`, {
      method: "DELETE",
    });

    return res.ok;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const findDuplicate = async (
  email: string,
  phone: string,
): Promise<Candidate | null> => {
  const candidate = getCandidateByEmailAndPhone(email, phone);
  return candidate;
};

export const uploadFile = async (file: File): Promise<{ fileId: string; filename: string }> => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await apiClient(`${CANDIDATE_BASE_URL}/upload`, {
    method: "POST",
    body: formData,
    // Note: Fetch sets the correct boundary when body is FormData,
    // so we must NOT set Content-Type manually.
    headers: {
        "Content-Type": "undefined" // placeholder to be removed by apiClient or fetch
    }
  });

  if (!res.ok) throw new Error("File upload failed");
  return await res.json();
};

export const addOrUpdateCandidate = async (
  parsedData: ResumeData,
  rawText: string,
  uploadedBy: string,
  fileId?: string,
): Promise<Candidate | null> => {
  const existing = await findDuplicate(parsedData.email, parsedData.phone);

  const newVersion: ResumeVersion = {
    versionId: uuidv4(),
    uploadedAt: Date.now(),
    uploadedBy,
    rawText,
    fileId,
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
    } as Candidate;

    return await createCandidate(newCandidate);
  }
};

// --- Job Roles ---

export const getJobRoles = async (): Promise<SavedJobRole[]> => {
  try {
    const res = await apiClient(JOBS_BASE_URL + "/all");
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
    const res = await apiClient(`${JOBS_BASE_URL}/${id}`);
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
    const res = await apiClient(JOBS_BASE_URL, {
      method: "POST",
      body: JSON.stringify(role),
    });
    return await res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const updateJobRole = async (role: SavedJobRole): Promise<boolean> => {
  try {
    const res = await apiClient(`${JOBS_BASE_URL}/${role.id}`, {
      method: "PUT",
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
    const res = await apiClient(`${JOBS_BASE_URL}/${id}`, {
      method: "DELETE",
    });

    return res.ok;
  } catch (error) {
    console.error(error);
    return false;
  }
};
