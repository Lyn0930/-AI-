import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Headphones } from 'lucide-react';
import { useRole, type UserRole } from '@client/src/hooks/useRole';

const RoleSelectPage: React.FC = () => {
  const navigate = useNavigate();
  const { setRole } = useRole();

  const handleSelect = (r: UserRole) => {
    setRole(r);
    navigate(r === 'manager' ? '/dashboard' : '/chat-sessions');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="w-full max-w-3xl px-6">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            天鹅到家线索系统
          </h1>
          <p className="text-gray-500">请选择您的角色进入系统</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 管理者 */}
          <button
            type="button"
            onClick={() => handleSelect('manager')}
            className="group flex flex-col items-center justify-center p-8 bg-white rounded-2xl border-2 border-gray-200 hover:border-primary hover:shadow-lg transition-all duration-300 cursor-pointer"
          >
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
              <Building2 className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">天鹅平台</h2>
            <p className="text-sm text-gray-500 text-center">
              数据概览 · 线索分配<br />
              全局会话监控 · 客服管理
            </p>
          </button>

          {/* 客服 */}
          <button
            type="button"
            onClick={() => handleSelect('agent')}
            className="group flex flex-col items-center justify-center p-8 bg-white rounded-2xl border-2 border-gray-200 hover:border-primary hover:shadow-lg transition-all duration-300 cursor-pointer"
          >
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
              <Headphones className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">客服</h2>
            <p className="text-sm text-gray-500 text-center">
              会话监控 · 人工接管<br />
              客户沟通 · 线索处理
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectPage;
