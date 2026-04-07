import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, updateUser, deleteUser } from '../api/users';
import type { User } from '../types';
import { Trash2, UserCog, Shield, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';
import { Button } from '../ui/Button';

const UserList: React.FC = () => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<User['role']>('user');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const limit = 10;

  const { data: users, isLoading } = useQuery({
    queryKey: ['users', page],
    queryFn: () => getUsers(limit, page * limit),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: User['role'] }) => 
      updateUser(id, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User role updated successfully');
      setEditingId(null);
    },
    onError: () => {
      toast.error('Failed to update user role');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted successfully');
      setDeletingId(null);
    },
    onError: () => {
      toast.error('Failed to delete user');
      setDeletingId(null);
    }
  });

  const handleUpdateRole = (id: string) => {
    updateMutation.mutate({ id, role: selectedRole });
  };

  const confirmDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading users...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto pb-24">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <UserCog className="w-8 h-8 text-primary" />
          User Management
        </h1>
        <p className="text-gray-500 mt-2">Manage user access and roles within the system.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-sm font-semibold text-gray-700">Name</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-700">Email</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-700">Role</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users?.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{user.name}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{user.email}</td>
                  <td className="px-6 py-4">
                    {editingId === user.id ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value as User['role'])}
                          className="px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-primary outline-none"
                        >
                          <option value="user">User</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button 
                          onClick={() => handleUpdateRole(user.id)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setEditingId(null)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className={clsx(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize",
                        user.role === 'admin' ? "bg-purple-100 text-purple-700" :
                        user.role === 'manager' ? "bg-blue-100 text-blue-700" :
                        "bg-gray-100 text-gray-700"
                      )}>
                        <Shield className="w-3 h-3" />
                        {user.role}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingId(user.id);
                          setSelectedRole(user.role);
                        }}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit Role"
                      >
                        <UserCog className="w-4 h-4" />
                      </button>
                      
                      {deletingId === user.id ? (
                        <div className="flex items-center gap-2 bg-red-50 p-1 rounded-lg animate-in fade-in zoom-in duration-200">
                          <span className="text-xs text-red-600 font-medium px-1">Sure?</span>
                          <button
                            onClick={() => confirmDelete(user.id)}
                            className="p-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="p-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-xs"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingId(user.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500 font-medium">
            Showing page {page + 1}
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={!users || users.length < limit}
              className="gap-1"
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserList;
