import { useState } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  ShieldAlert, 
  Search, 
  Building, 
  FileCheck, 
  Key, 
  Globe, 
  Monitor, 
  ArrowUpRight, 
  RotateCw,
  Clock
} from 'lucide-react';
import { DEPARTMENTS } from '../data.js';
import { Employee, ServerAccessLog } from '../types.js';

interface AdminPanelProps {
  currentUser: any;
  employees: Employee[];
  logs: ServerAccessLog[];
  onUpdateStatus: (userId: string, status: string) => void;
  onUpdateRole: (userId: string, role: string) => void;
  onRefresh: () => void;
  loading: boolean;
  theme: 'light' | 'dark';
}

export function AdminPanel({
  currentUser,
  employees,
  logs,
  onUpdateStatus,
  onUpdateRole,
  onRefresh,
  loading,
  theme
}: AdminPanelProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState(
    currentUser.role === 'Super Admin' ? 'all' : currentUser.departmentId
  );
  
  const [logsSearch, setLogsSearch] = useState('');

  // Filtering Employees List
  const filteredEmployees = employees.filter(emp => {
    const textMatch = 
      emp.fullName.toLowerCase().includes(search.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase()) ||
      emp.designation.toLowerCase().includes(search.toLowerCase());

    const statusMatch = statusFilter === 'all' || emp.status === statusFilter;
    
    // Department admins can only filter users from their OWN department
    const effDeptFilter = currentUser.role === 'Super Admin' ? deptFilter : currentUser.departmentId;
    const deptMatch = effDeptFilter === 'all' || emp.departmentId === effDeptFilter;

    return textMatch && statusMatch && deptMatch;
  });

  // Filtering Logs
  const filteredLogs = logs.filter(log => {
    const term = logsSearch.toLowerCase();
    return (
      log.fullName.toLowerCase().includes(term) ||
      log.email.toLowerCase().includes(term) ||
      log.action.toLowerCase().includes(term) ||
      log.ip.toLowerCase().includes(term) ||
      log.device.toLowerCase().includes(term) ||
      log.details.toLowerCase().includes(term)
    );
  });

  const pendingCount = employees.filter(e => e.status === 'Pending').length;
  const activeCount = employees.filter(e => e.status === 'Approved').length;
  const suspendedCount = employees.filter(e => e.status === 'Suspended').length;

  return (
    <div className="space-y-6">
      
      {/* Overview stats panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`rounded-xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'} p-4 shadow-sm`}>
          <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Total Staff Accounts</span>
          <p className="text-2xl font-black mt-1">{employees.length}</p>
          <p className="text-[10px] text-slate-500 font-bold mt-1">Daffodil Active Registry</p>
        </div>

        <div className={`rounded-xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'} p-4 shadow-sm relative overflow-hidden`}>
          <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Pending Approval</span>
          <p className="text-2xl font-black text-amber-500 mt-1">{pendingCount}</p>
          {pendingCount > 0 && (
            <div className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full animate-ping" />
          )}
          <p className="text-[10px] text-amber-600 font-bold mt-1">Requires security checkout</p>
        </div>

        <div className={`rounded-xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'} p-4 shadow-sm`}>
          <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Approved Active</span>
          <p className="text-2xl font-black text-emerald-500 mt-1">{activeCount}</p>
          <p className="text-[10px] text-emerald-600 font-bold mt-1">Authorized access</p>
        </div>

        <div className={`rounded-xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'} p-4 shadow-sm`}>
          <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Suspended Access</span>
          <p className="text-2xl font-black text-rose-500 mt-1">{suspendedCount}</p>
          <p className="text-[10px] text-rose-600 font-bold mt-1">Temporarily blocked profiles</p>
        </div>
      </div>

      {/* Corporate Directories Controls */}
      <div className={`rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'} p-5 shadow-sm space-y-4 text-left`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100/10 pb-4">
          <div>
            <h3 className="text-base font-bold">University Employee Directory</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentUser.role === 'Super Admin' 
                ? 'Review signup requests, authorize department ranks, adjust roles, or lock accounts university-wide.' 
                : `Manage registrations exclusively for ${DEPARTMENTS.find(d => d.id === currentUser.departmentId)?.name}.`}
            </p>
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="px-3.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 self-start md:self-center transition-all"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-500' : ''}`} />
            <span>Reload Active Directory</span>
          </button>
        </div>

        {/* Dynamic Controls Filter Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID, name, or designations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg outline-none font-medium"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg outline-none text-slate-500"
            >
              <option value="all">Filter Status: All Records</option>
              <option value="Pending">Pending Approvals Only</option>
              <option value="Approved">Approved Profiles Only</option>
              <option value="Suspended">Suspended Restrictions</option>
              <option value="Rejected">Rejected Application Records</option>
            </select>
          </div>

          <div>
            <select
              disabled={currentUser.role !== 'Super Admin'}
              value={currentUser.role === 'Super Admin' ? deptFilter : currentUser.departmentId}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg outline-none text-slate-500 disabled:opacity-75"
            >
              {currentUser.role === 'Super Admin' && <option value="all">Filter Departments: All Offices</option>}
              {DEPARTMENTS.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Directory Listings Table */}
        <div className="overflow-x-auto w-full border border-slate-200/30 dark:border-slate-850 rounded-xl">
          <table className="w-full text-left text-xs text-slate-400 border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-[10px] font-bold uppercase tracking-widest text-slate-550 border-b border-slate-200/50 dark:border-slate-850">
                <th className="p-3">Employee Description</th>
                <th className="p-3">Designation / Role</th>
                <th className="p-3">Department</th>
                <th className="p-3">Portal Access Permissions</th>
                <th className="p-3 text-right">Approval Status / Quick Alter</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map(emp => (
                <tr 
                  key={emp.id}
                  className="border-b border-slate-200/50 dark:border-slate-850 hover:bg-slate-50/20 dark:hover:bg-slate-850/50 transition-colors"
                >
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <img 
                        src={emp.profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80'} 
                        alt={emp.fullName} 
                        className="w-9 h-9 rounded-xl object-cover border border-slate-200/40"
                      />
                      <div>
                        <p className={`font-bold text-sm ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>{emp.fullName}</p>
                        <p className="font-mono text-[10px] text-slate-500">{emp.employeeId} • {emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div>
                      <p className={`font-semibold ${theme === 'dark' ? 'text-slate-250' : 'text-slate-700'}`}>{emp.designation}</p>
                      <p className="text-[10px] text-slate-500">Privilege: {emp.role}</p>
                    </div>
                  </td>
                  <td className="p-3 font-medium">
                    <span className="bg-indigo-500/10 border border-indigo-500/15 text-indigo-400 px-2 py-0.5 rounded-md text-[10px] font-semibold">
                      {DEPARTMENTS.find(d => d.id === emp.departmentId)?.name || emp.departmentId}
                    </span>
                  </td>
                  <td className="p-3">
                    {/* Super admin role changer dropdown */}
                    {currentUser.role === 'Super Admin' ? (
                      <select
                        disabled={emp.id === currentUser.id}
                        value={emp.role}
                        onChange={(e) => onUpdateRole(emp.id, e.target.value)}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded px-2 py-1 outline-none text-[11px] font-semibold text-indigo-400 disabled:opacity-50"
                      >
                        <option value="Viewer">Viewer Only (Read Files)</option>
                        <option value="Employee">Employee Rank (Upload & Manage)</option>
                        <option value="Department Admin">Department Admin (Review Dept)</option>
                        <option value="Super Admin">Super Admin Access</option>
                      </select>
                    ) : (
                      <span className="text-[11px] font-semibold text-indigo-400 bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded">
                        {emp.role}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2.5">
                      
                      {/* Active Status Badge */}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase inline-block ${
                        emp.status === 'Approved' 
                          ? 'bg-emerald-500/15 border border-emerald-500/20 text-emerald-450' 
                          : emp.status === 'Pending'
                          ? 'bg-amber-500/15 border border-amber-500/20 text-amber-450 animate-pulse'
                          : emp.status === 'Suspended'
                          ? 'bg-rose-500/15 border border-rose-500/20 text-rose-450'
                          : 'bg-slate-500/15 border border-slate-500/20 text-slate-450'
                      }`}>
                        {emp.status}
                      </span>

                      {/* Dropdown status toggler */}
                      <select
                        value={emp.status}
                        disabled={emp.id === currentUser.id}
                        onChange={(e) => onUpdateStatus(emp.id, e.target.value)}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded px-1 text-[11px] py-1 text-slate-400 cursor-pointer disabled:opacity-50 font-bold"
                      >
                        <option value="Pending">Set Pending</option>
                        <option value="Approved">Approve Access</option>
                        <option value="Suspended">Suspend Access</option>
                        <option value="Rejected">Reject Request</option>
                      </select>

                    </div>
                  </td>
                </tr>
              ))}

              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500">
                    No active Daffodil employee registries discovery. Try adjusting search filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Access Audits timeline logs */}
      <div className={`rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'} p-5 shadow-sm text-left`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100/10 pb-4 mb-4">
          <div>
            <h3 className="text-base font-bold">Activity Logs & Audit Trails</h3>
            <p className="text-xs text-slate-500 mt-0.5">Real-time security auditing tracking file alterations, logins, failed attempts, and role updates.</p>
          </div>
          
          <div className="relative w-full md:w-64 shrink-0">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search audit trail keywords..."
              value={logsSearch}
              onChange={(e) => setLogsSearch(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg outline-none font-medium"
            />
          </div>
        </div>

        {/* Audit timeline lists */}
        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
          {filteredLogs.map(log => (
            <div 
              key={log.id}
              className={`p-3.5 rounded-xl border ${theme === 'dark' ? 'bg-slate-950/40 border-slate-900' : 'bg-slate-50 border-slate-100'} text-xs space-y-1.5`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 font-mono font-bold rounded text-[9px] uppercase tracking-wider ${
                    log.status === 'Success' 
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/15'
                      : 'bg-rose-500/10 text-rose-500 border border-rose-500/15'
                  }`}>
                    {log.action}
                  </span>
                  
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="font-mono text-[10px]">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 font-mono text-[10px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    IP: {log.ip}
                  </span>
                  <span className="flex items-center gap-1 max-w-[120px] truncate" title={log.device}>
                    <Monitor className="w-3.5 h-3.5 text-slate-400" />
                    {log.device.includes('Node') ? 'Security Server' : 'Web Agent'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pt-0.5">
                <p className={`font-semibold ${theme === 'dark' ? 'text-slate-200 font-sans' : 'text-slate-800'}`}>
                  {log.details}
                </p>
                <div className="text-right text-[10px]">
                  <span className="font-bold text-indigo-400">{log.fullName}</span> 
                  <span className="text-slate-500"> ({log.employeeId} • {log.role})</span>
                </div>
              </div>
            </div>
          ))}

          {filteredLogs.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No audit activities match the active query log indices.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
