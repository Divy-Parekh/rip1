import React, { useEffect, useState } from "react";
import { getCandidates } from "../services/storageService";
import { Candidate } from "../types";
import {
  Users,
  Clock,
  TrendingUp,
  Award,
  ChevronRight,
  LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color: string;
};

const StatCard = ({ icon: Icon, label, value, color }: StatCardProps) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4 transition-transform hover:scale-[1.01]">
    <div className={`p-3 rounded-lg ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  useEffect(() => {
    async function fetchCandidates() {
      const candidates = await getCandidates();
      setCandidates(candidates);
    }

    fetchCandidates();
  }, []);

  const totalCandidates = candidates.length;
  const recentUploads = candidates.filter(
    (c) => Date.now() - c.updatedAt < 7 * 24 * 60 * 60 * 1000,
  ).length;
  const totalSkills = new Set(candidates.flatMap((c) => c.currentData.skills))
    .size;
  const avgExp =
    totalCandidates > 0
      ? (
          candidates.reduce(
            (acc, c) => acc + (c.currentData.totalExperienceYears || 0),
            0,
          ) / totalCandidates
        ).toFixed(1)
      : 0;

  const sortedCandidates = [...candidates]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Overview of your resume database.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          label="Total Candidates"
          value={totalCandidates}
          color="bg-blue-500"
        />
        <StatCard
          icon={Clock}
          label="New This Week"
          value={recentUploads}
          color="bg-green-500"
        />
        <StatCard
          icon={Award}
          label="Unique Skills"
          value={totalSkills}
          color="bg-purple-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg Experience"
          value={`${avgExp} Yrs`}
          color="bg-orange-500"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="font-semibold text-gray-800">Recent Candidates</h2>
          <Link
            to="/candidates"
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium hover:underline"
          >
            View All
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {sortedCandidates.map((candidate) => (
            <Link
              to={`/candidates/${candidate.id}`}
              key={candidate.id}
              className="block hover:bg-gray-50 transition-colors group"
            >
              <div className="p-6 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm group-hover:bg-indigo-200 transition-colors">
                    {candidate.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {candidate.fullName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {candidate.currentData.experience?.[0]?.role ||
                        candidate.currentData.skills[0] ||
                        "No role identified"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">
                      {candidate.currentData.totalExperienceYears || 0} years
                      exp
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(candidate.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-400" />
                </div>
              </div>
            </Link>
          ))}
          {candidates.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <p className="mb-2">No candidates found.</p>
              <Link
                to="/ingest"
                className="text-indigo-600 font-medium hover:underline"
              >
                Add your first candidate
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
