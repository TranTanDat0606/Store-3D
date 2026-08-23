import { useEffect, useState } from 'react'
import { Search, ShieldCheck, ShieldX, Trash2, UserCheck, UserX } from 'lucide-react'
import { userApi } from '@/services'
import { getErrorMessage } from '@/services/apiClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Pagination } from '@/components/common/pagination'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { formatDate } from '@/lib'
import { toast } from 'sonner'
import type { PaginationMeta, User } from '@/types'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [adminCount, setAdminCount] = useState<number | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    userApi
      .list({ page, limit: 10, search: debouncedSearch || undefined })
      .then((res) => {
        if (cancelled) return
        setUsers(res.data)
        setMeta(res.pagination)
        setAdminCount(res.meta?.adminCount)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [page, debouncedSearch])

  // The system must always keep at least one admin account.
  const isLastAdmin = (user: User) => user.role === 'admin' && adminCount === 1

  const updateUser = (updated: User) => {
    setUsers((prev) => prev.map((u) => (u._id === updated._id ? updated : u)))
  }

  const toggleRole = async (user: User) => {
    try {
      const updated = await userApi.updateRole(user._id, user.role === 'admin' ? 'customer' : 'admin')
      updateUser(updated)
      toast.success('Cập nhật quyền thành công')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const toggleActive = async (user: User) => {
    try {
      const updated = await userApi.toggleActive(user._id)
      updateUser(updated)
      toast.success(updated.active ? 'Đã kích hoạt tài khoản' : 'Đã khóa tài khoản')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await userApi.remove(id)
      setUsers((prev) => prev.filter((u) => u._id !== id))
      toast.success('Xóa người dùng thành công')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quản lý khách hàng</h1>
        <p className="text-muted-foreground">{meta ? `${meta.total} người dùng` : ''}</p>
        {adminCount !== undefined && (
          <p className="text-muted-foreground mt-1 text-xs">
            Hệ thống luôn giữ ít nhất một tài khoản admin ({adminCount} admin hiện tại).
          </p>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tên hoặc email..."
          className="pl-9"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Người dùng</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  Không có người dùng
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{user.fullname.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.fullname}</p>
                        <p className="text-muted-foreground text-xs">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role === 'admin' ? 'Admin' : 'Khách hàng'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.active ? 'default' : 'destructive'}>
                      {user.active ? 'Hoạt động' : 'Đã khóa'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRole(user)}
                        disabled={isLastAdmin(user)}
                        title={
                          isLastAdmin(user)
                            ? 'Không thể hạ quyền admin cuối cùng của hệ thống'
                            : user.role === 'admin'
                              ? 'Hạ xuống khách hàng'
                              : 'Nâng lên admin'
                        }
                      >
                        {user.role === 'admin' ? <ShieldX className="size-4" /> : <ShieldCheck className="size-4" />}
                        {user.role === 'admin' ? 'Hạ' : 'Admin'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(user)}
                        title={user.active ? 'Khóa tài khoản' : 'Kích hoạt tài khoản'}
                      >
                        {user.active ? <UserX className="size-4" /> : <UserCheck className="size-4" />}
                        {user.active ? 'Khóa' : 'Mở'}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" title={isLastAdmin(user) ? 'Không thể xóa admin cuối cùng' : 'Xóa'} disabled={isLastAdmin(user)}>
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Xóa người dùng?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bạn có chắc muốn xóa tài khoản của "{user.fullname}"? Hành động này không thể hoàn tác.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-white hover:bg-destructive/90"
                              onClick={() => handleDelete(user._id)}
                            >
                              Xóa
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {meta && <Pagination meta={meta} onPageChange={setPage} />}
    </div>
  )
}
