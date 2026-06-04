import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { 
  Users, 
  Settings, 
  RefreshCw, 
  CheckCircle2, 
  Search,
  Filter
} from 'lucide-react';
import { Input } from './ui/input';
import { useTenant } from '../contexts/TenantContext';

const mockUsers = [
  {
    id: 'usr_001',
    name: 'victor',
    email: 'victor@getbnn.com',
    roles: 'Chromebook-ITP, role-device-ownership, auth-role-august',
    deviceName: 'Victor-MacBook-Pro',
    lastLogin: '8/12/2025, 4:09:42 PM'
  },
  {
    id: 'usr_002',
    name: 'Vladyslav',
    email: 'vladyslav@banyansecurity.io',
    roles: 'auth-role-mohini-2feb, role-device-ownership',
    deviceName: 'Vlad-Windows-PC',
    lastLogin: '6/16/2025, 8:03:04 AM'
  },
  {
    id: 'usr_003',
    name: 'nicolas',
    email: 'nicolas@getbnn.com',
    roles: 'role-device-ownership, auth-role-august-r...',
    deviceName: 'Nicolas-Laptop',
    lastLogin: '7/22/2025, 7:14:27 AM'
  },
  {
    id: 'usr_004',
    name: 'syed',
    email: 'syed@getbnn.com',
    roles: 'role-device-ownership, auth-role-august-r...',
    deviceName: '-',
    lastLogin: '-'
  },
  {
    id: 'usr_005',
    name: 'suhaan',
    email: 'suhaan@getbnn.com',
    roles: 'role-device-ownership, auth-role-august-r...',
    deviceName: 'Suhaan-Desktop',
    lastLogin: '-'
  },
  {
    id: 'usr_006',
    name: 'rohit',
    email: 'rohit@getbnn.com',
    roles: 'Chromebook-ITP, role-device-ownership, a...',
    deviceName: 'Rohit-Surface',
    lastLogin: '-'
  },
  {
    id: 'usr_007',
    name: 'vaishnavi',
    email: 'vaishnavi.kawade+group@spryiq.co',
    roles: 'auth-role-mohini-2feb, role-device-ownership',
    deviceName: 'Vaishnavi-MacBook-Air',
    lastLogin: '1/14/2025, 12:15:52 AM'
  },
  {
    id: 'usr_008',
    name: 'Sathish',
    email: 'satkumar@sonicwall.com',
    roles: 'auth-role-mohini-2feb, UnAuth-Sathish, r...',
    deviceName: 'Sathish-Dell-XPS',
    lastLogin: '10/26/2025, 11:47:31 PM'
  },
  {
    id: 'usr_009',
    name: 'Sathish',
    email: 'sathish@getbnn.com',
    roles: 'auth-role-mohini-2feb, Chromebook-ITP, ...',
    deviceName: 'Sathish-Mobile',
    lastLogin: '12/1/2025, 4:04:06 AM'
  },
  {
    id: 'usr_010',
    name: 'gauri',
    email: 'gauri@getbnn.com',
    roles: 'Chromebook-ITP, role-device-ownership, c...',
    deviceName: 'Gauri-ThinkPad',
    lastLogin: '7/6/2025, 10:49:23 PM'
  },
  {
    id: 'usr_011',
    name: 'dan',
    email: 'dan@getbnn.com',
    roles: 'Chromebook-ITP, role-device-ownership, a...',
    deviceName: '-',
    lastLogin: '-'
  }
];

export function IDPManagement() {
  const [isReconfiguring, setIsReconfiguring] = React.useState(false);
  const { getTenantData } = useTenant();
  const tenantData = getTenantData();
  
  // Ensure max 20 users
  const displayUsers = tenantData.users.length > 0 
    ? tenantData.users.slice(0, 20) 
    : mockUsers.slice(0, 11);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 text-[24px] font-bold">Users</h1>
          <p className="text-gray-600 mt-1">
            View your configured identity source and user directory
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setIsReconfiguring(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Reconfigure IDP
          </Button>
        </div>
      </div>

      {/* Users List */}
      <Card className="border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search users..." className="pl-9" />
            </div>
            <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
            </Button>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 border-b border-gray-200">
              <TableHead className="w-[150px] font-semibold text-xs uppercase tracking-wider text-gray-500">USER</TableHead>
              <TableHead className="w-[250px] font-semibold text-xs uppercase tracking-wider text-gray-500">EMAIL</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-gray-500">ROLES</TableHead>
              <TableHead className="w-[193px] font-semibold text-xs uppercase tracking-wider text-gray-500">DEVICE NAME</TableHead>
              <TableHead className="w-[180px] font-semibold text-xs uppercase tracking-wider text-gray-500">LAST LOGIN</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayUsers.map((user) => (
              <TableRow key={user.id} className="hover:bg-gray-50 border-b border-gray-100">
                <TableCell>
                    <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                                {user.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="font-medium text-[#1f2123]">{user.name}</div>
                    </div>
                </TableCell>
                <TableCell>
                    <div className="text-sm text-[#101828]">{user.email}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-[#364153] font-medium truncate max-w-[300px]">
                    {user.role || user.roles}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-[#4a5565]">
                    {user.deviceName || '-'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-[#364153]">
                    {user.lastLogin || '-'}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {displayUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="p-4 border-t border-gray-200 text-center text-sm text-gray-500">
            Showing {displayUsers.length} of {tenantData.dashboardMetrics.totalUsers || 458} users
        </div>
      </Card>
    </div>
  );
}