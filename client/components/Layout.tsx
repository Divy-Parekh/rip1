import React, { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Upload,
  Users,
  BarChart2,
  UserPlus,
  Scale,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import clsx from "clsx";
import { useAuth } from "../context/AuthContext";

const Layout: React.FC = () => {
  const location = useLocation();
  const { logout, user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/ingest", icon: Upload, label: "Add Resume" },
    { path: "/candidates", icon: Users, label: "Candidates" },
    { path: "/role-match", icon: UserPlus, label: "Role Match" },
    { path: "/compare", icon: Scale, label: "Compare" },
  ];

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside
        className={clsx(
          "hidden md:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex-shrink-0 relative",
          isCollapsed ? "w-20" : "w-64",
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          <div
            className={clsx(
              "flex items-center gap-2 font-bold text-xl text-primary transition-opacity duration-200",
              isCollapsed && "justify-center w-full",
            )}
          >
            <BarChart2 className="w-8 h-8 flex-shrink-0" />
            {!isCollapsed && (
              <span className="whitespace-nowrap transition-opacity">
                RIP AI
              </span>
            )}
          </div>
        </div>

        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 bg-white border border-gray-200 rounded-full p-1 shadow-sm text-gray-500 hover:text-indigo-600 z-10 hidden md:block"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        <div className="p-4 pb-2">
          {!isCollapsed && (
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2 animate-fade-in">
              Menu
            </div>
          )}
          {isCollapsed && <div className="h-4 mb-2"></div>}
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={isCollapsed ? item.label : undefined}
                className={clsx(
                  "flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-colors group",
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                  isCollapsed && "justify-center",
                )}
              >
                <item.icon
                  className={clsx(
                    "w-5 h-5 flex-shrink-0",
                    isActive
                      ? "text-indigo-700"
                      : "text-gray-400 group-hover:text-gray-600",
                  )}
                />
                {!isCollapsed && (
                  <span className="whitespace-nowrap transition-opacity duration-200">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 overflow-hidden">
          <div
            className={clsx(
              "flex items-center gap-3 mb-4 transition-all",
              isCollapsed ? "justify-center" : "px-2",
            )}
          >
            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs flex-shrink-0">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            )}
          </div>

          <button
            onClick={logout}
            title={isCollapsed ? "Sign Out" : undefined}
            className={clsx(
              "flex items-center gap-3 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full",
              isCollapsed && "justify-center px-0",
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>

          {!isCollapsed && (
            <div className="mt-4 text-xs text-gray-400 text-center whitespace-nowrap">
              v1.0.0
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>

          <div className="relative bg-white w-64 max-w-[85vw] h-full shadow-2xl flex flex-col animate-slide-in-left">
            <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
              <div className="flex items-center gap-2 font-bold text-xl text-primary">
                <BarChart2 className="w-6 h-6" />
                <span>RIP AI</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 -mr-2 text-gray-500 hover:bg-gray-100 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 px-4 space-y-1">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">
                Menu
              </div>
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={clsx(
                      "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                      isActive
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    )}
                  >
                    <item.icon
                      className={clsx(
                        "w-5 h-5",
                        isActive ? "text-indigo-700" : "text-gray-400",
                      )}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full justify-center border border-red-100 bg-white"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="md:hidden bg-white border-b border-gray-200 h-16 flex items-center px-4 justify-between flex-shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-bold text-primary text-lg flex items-center gap-2">
              <BarChart2 className="w-5 h-5" />
              RIP AI
            </span>
          </div>
          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
            {user?.name.charAt(0).toUpperCase()}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
