import { useEffect, useState, useCallback } from 'react'
import { Search, Filter, Eye, MessageSquare, Clock, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Ban } from 'lucide-react'
import { contactApi } from '@/services'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/common/empty-state'
import { cn, formatDate } from '@/lib'
import type { ContactRequest, PaginationMeta } from '@/types'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  new: { label: 'Mới', color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400', icon: Clock },
  in_progress: { label: 'Đang xử lý', color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400', icon: MessageSquare },
  resolved: { label: 'Đã xử lý', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400', icon: CheckCircle2 },
  rejected: { label: 'Từ chối xử lý', color: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400', icon: Ban },
}

const ALLOWED_NEXT_STATUS: Record<string, string[]> = {
  new: ['in_progress', 'rejected'],
  in_progress: ['resolved', 'rejected'],
  resolved: [],
  rejected: [],
}

const STATUS_ORDER = ['new', 'in_progress', 'resolved', 'rejected'] as const

function getDisabledStatuses(currentStatus: string): Set<string> {
  const disabled = new Set<string>()
  const currentIdx = STATUS_ORDER.indexOf(currentStatus as typeof STATUS_ORDER[number])
  if (currentIdx === -1) return disabled

  for (let i = 0; i < STATUS_ORDER.length; i++) {
    const key = STATUS_ORDER[i]
    if (i < currentIdx) {
      disabled.add(key)
    } else if (i > currentIdx) {
      const allowed = ALLOWED_NEXT_STATUS[currentStatus] || []
      if (!allowed.includes(key)) {
        disabled.add(key)
      }
    }
  }
  return disabled
}

export default function AdminSupportPage() {
  const [contacts, setContacts] = useState<ContactRequest[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ContactRequest | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [adminNote, setAdminNote] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchContacts = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const res = await contactApi.adminList({ page, limit: 10, status: statusFilter || undefined, search: search || undefined })
      setContacts(res.data)
      setMeta(res.pagination)
    } catch {
      setContacts([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search])

  useEffect(() => {
    fetchContacts(1)
  }, [fetchContacts])

  const openDetail = async (id: string) => {
    setDetailLoading(true)
    setSelected(null)
    try {
      const data = await contactApi.adminGetById(id)
      setSelected(data)
      setAdminNote(data.adminNote || '')
    } catch {
      /* ignore */
    } finally {
      setDetailLoading(false)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    setSaving(true)
    try {
      const updated = await contactApi.adminUpdateStatus(id, status, adminNote)
      setSelected(updated)
      setContacts((prev) => prev.map((c) => (c._id === id ? { ...c, status: updated.status as ContactRequest['status'] } : c)))
    } catch {
      /* ignore */
    } finally {
      setSaving(false)
    }
  }

  const saveNote = async (id: string) => {
    setSaving(true)
    try {
      const updated = await contactApi.adminAddNote(id, adminNote)
      setSelected(updated)
    } catch {
      /* ignore */
    } finally {
      setSaving(false)
    }
  }

  const handleSearch = () => {
    fetchContacts(1)
  }

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">Yêu cầu hỗ trợ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Tìm theo tên, email, chủ đề..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] border-white/10 bg-white/5 text-white">
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-slate-900 text-white">
                  <SelectItem value="new">Mới</SelectItem>
                  <SelectItem value="in_progress">Đang xử lý</SelectItem>
                  <SelectItem value="resolved">Đã xử lý</SelectItem>
                  <SelectItem value="rejected">Từ chối xử lý</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleSearch} className="border-white/10 text-white hover:bg-white/10">
                <Filter className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-4 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-white/5" />
              ))}
            </div>
          ) : contacts.length === 0 ? (
            <div className="p-12">
              <EmptyState title="Chưa có yêu cầu" description="Không có yêu cầu hỗ trợ nào." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-slate-400">
                    <th className="px-4 py-3 font-medium">#</th>
                    <th className="px-4 py-3 font-medium">Khách hàng</th>
                    <th className="px-4 py-3 font-medium">Chủ đề</th>
                    <th className="px-4 py-3 font-medium">Trạng thái</th>
                    <th className="px-4 py-3 font-medium">Ngày gửi</th>
                    <th className="px-4 py-3 font-medium text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((c, idx) => {
                    const st = STATUS_CONFIG[c.status] || STATUS_CONFIG.new
                    return (
                      <tr key={c._id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-4 py-3 text-slate-400">{(meta?.page ?? 1) * 10 - 10 + idx + 1}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-white">{c.fullname}</p>
                          <p className="text-xs text-slate-400">{c.email}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-300">{c.subject}</td>
                        <td className="px-4 py-3">
                          <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', st.color)}>
                            <st.icon className="size-3" />
                            {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400">{formatDate(c.createdAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="sm" onClick={() => openDetail(c._id)} className="text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300">
                            <Eye className="size-4" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
              <p className="text-xs text-slate-400">
                Trang {meta.page}/{meta.totalPages} · {meta.total} yêu cầu
              </p>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" disabled={!meta.hasPrevPage} onClick={() => fetchContacts(meta.page - 1)} className="text-slate-300">
                  <ChevronLeft className="size-4" />
                </Button>
                <Button variant="ghost" size="sm" disabled={!meta.hasNextPage} onClick={() => fetchContacts(meta.page + 1)} className="text-slate-300">
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {(selected || detailLoading) && (
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <span>Chi tiết yêu cầu</span>
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)} className="text-slate-400 hover:text-white">
                <XCircle className="size-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {detailLoading ? (
              <div className="space-y-4">
                <div className="h-8 w-1/3 animate-pulse rounded bg-white/5" />
                <div className="h-20 animate-pulse rounded bg-white/5" />
              </div>
            ) : selected && (
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <p className="mb-1 text-xs font-medium text-slate-400">Thông tin khách hàng</p>
                    <div className="rounded-lg border border-white/10 p-4 space-y-2">
                      <p className="text-white"><span className="text-slate-400">Tên:</span> {selected.fullname}</p>
                      <p className="text-white"><span className="text-slate-400">Email:</span> {selected.email}</p>
                      <p className="text-white"><span className="text-slate-400">Điện thoại:</span> {selected.phone}</p>
                      {selected.userId && <p className="text-white"><span className="text-slate-400">User ID:</span> <span className="font-mono text-xs">{selected.userId}</span></p>}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-slate-400">Nội dung yêu cầu</p>
                    <div className="rounded-lg border border-white/10 p-4 space-y-2">
                      <p className="text-white"><span className="text-slate-400">Chủ đề:</span> {selected.subject}</p>
                      <p className="text-white"><span className="text-slate-400">Ngày gửi:</span> {formatDate(selected.createdAt)}</p>
                      <p className="text-white whitespace-pre-line mt-2">{selected.message}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="mb-1 text-xs font-medium text-slate-400">Xử lý</p>
                    <div className="rounded-lg border border-white/10 p-4 space-y-3">
                      <div>
                        <label className="mb-1 block text-xs text-slate-400">Chuyển trạng thái</label>
                        {(() => {
                          const allowed = ALLOWED_NEXT_STATUS[selected.status] || []
                          const disabledStatuses = getDisabledStatuses(selected.status)
                          if (allowed.length === 0) {
                            return (
                              <div className="space-y-2">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400">
                                  <CheckCircle2 className="size-3" />
                                  Trạng thái cuối — không thể thay đổi
                                </span>
                                <Select value={selected.status} disabled>
                                  <SelectTrigger className="w-full border-white/10 bg-white/5 text-white opacity-60">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="border-white/10 bg-slate-900 text-white">
                                    {STATUS_ORDER.map((key) => {
                                      const cfg = STATUS_CONFIG[key]
                                      if (!cfg) return null
                                      return (
                                        <SelectItem key={key} value={key} disabled>
                                          {cfg.label}
                                        </SelectItem>
                                      )
                                    })}
                                  </SelectContent>
                                </Select>
                              </div>
                            )
                          }
                          return (
                            <Select
                              value={selected.status}
                              onValueChange={(v) => {
                                if (v && v !== selected.status) updateStatus(selected._id, v)
                              }}
                              disabled={saving}
                            >
                              <SelectTrigger className="w-full border-white/10 bg-white/5 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="border-white/10 bg-slate-900 text-white">
                                {STATUS_ORDER.map((key) => {
                                  const cfg = STATUS_CONFIG[key]
                                  if (!cfg) return null
                                  const isDisabled = disabledStatuses.has(key) || key === selected.status
                                  return (
                                    <SelectItem key={key} value={key} disabled={isDisabled}>
                                      {cfg.label}
                                    </SelectItem>
                                  )
                                })}
                              </SelectContent>
                            </Select>
                          )
                        })()}
                      </div>
                      <div>
                        <p className="mb-1 text-xs text-slate-400">Ghi chú nội bộ</p>
                        <Textarea
                          value={adminNote}
                          onChange={(e) => setAdminNote(e.target.value)}
                          placeholder="Ghi chú nội bộ (không hiển thị cho khách hàng)..."
                          rows={4}
                          className="border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={() => saveNote(selected._id)}
                        disabled={saving}
                        className="bg-cyan-600 text-white hover:bg-cyan-700"
                      >
                        {saving ? 'Đang lưu...' : 'Lưu ghi chú'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
