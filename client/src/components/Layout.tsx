import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { MessageSquareText, ListChecks, UserCog, LayoutDashboard, BarChart3, Settings, LogOut, Users } from 'lucide-react';
import { useRole } from '../hooks/useRole';
import AgentOnlineToggle from '../pages/AssignmentPage/AgentOnlineToggle';

interface NavItem {
  to: string;
  label: string;
  icon: typeof ListChecks;
  end: boolean;
  roles: ('manager' | 'agent')[];
}

const allNavItems: NavItem[] = [
  { to: '/dashboard', label: '数据概览', icon: LayoutDashboard, end: false, roles: ['manager'] },
  { to: '/leads', label: '线索管理', icon: ListChecks, end: false, roles: ['manager', 'agent'] },
  { to: '/chat-sessions', label: '会话监控', icon: MessageSquareText, end: false, roles: ['manager', 'agent'] },
  { to: '/assignments', label: '客服分配', icon: UserCog, end: false, roles: ['manager'] },
  { to: '/analytics', label: '经营分析', icon: BarChart3, end: false, roles: ['manager'] },
  { to: '/workers', label: '劳动者管理', icon: Users, end: false, roles: ['manager'] },
  { to: '/admin', label: '管理后台', icon: Settings, end: false, roles: ['manager'] },
];

const Layout = () => {
  const { role, clearRole } = useRole();
  const navigate = useNavigate();

  const navItems = allNavItems.filter(
    (item) => role && item.roles.includes(role),
  );

  const handleSwitchRole = () => {
    clearRole();
    navigate('/role-select');
  };

  return (
    <div className="flex w-screen h-screen bg-gray-50">
      <aside className="w-60 shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <span className="text-lg font-bold text-gray-800">天鹅到家线索系统</span>
        </div>
        {role && (
          <div className="px-4 py-2 border-b border-gray-100">
            <span
              className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                role === 'manager'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-green-100 text-green-700'
              }`}
            >
              {role === 'manager' ? '天鹅平台' : '客服'}
            </span>
          </div>
        )}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="p-3 border-t border-gray-200">
          <button
            type="button"
            onClick={handleSwitchRole}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            切换角色
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        {/* 客服上线/下线状态条（agent 角色才显示）— 2026-08-15 修复按钮看不到的 bug */}
        {role === 'agent' && (
          <div className="border-b border-gray-200 bg-white px-4 py-2.5 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              点击右侧按钮切换上线状态。上线后会周期性发送心跳，并接收新线索分配。
            </div>
            <AgentOnlineToggle />
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
