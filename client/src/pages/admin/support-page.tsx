import { useEffect, useState, useCallback, useRef } from 'react'
import { Search, Filter, Eye, MessageSquare, Clock, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Ban, Send, MailCheck, MailX, Wifi } from 'lucide-react'
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
  const [resolutionContent, setResolutionContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [sendingResolution, setSendingResolution] = useState(false)
  const [resolutionStatus, setResolutionStatus] = useState<'idle' | 'success' | 'error' | 'not_configured'>('idle')
  const [resolutionErrorMsg, setResolutionErrorMsg] = useState('')
  const [smtpStatus, setSmtpStatus] = useState<{ status: string; message: string } | null>(null)
  const [smtpChecking, setSmtpChecking] = useState(false)
  const detailRef = useRef<HTMLDivElement>(null)

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
      setResolutionContent(data.resolutionContent || '')
      setResolutionStatus('idle')
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

  const sendResolution = async (id: string) => {
    if (!resolutionContent.trim()) return
    setSendingResolution(true)
    setResolutionStatus('idle')
    setResolutionErrorMsg('')
    try {
      const result = await contactApi.adminSendResolution(id, resolutionContent)
      setSelected(result.data)
      const emailStatus = result.meta?.emailStatus
      if (emailStatus === 'sent') {
        setResolutionStatus('success')
      } else if (emailStatus === 'not_configured') {
        setResolutionStatus('not_configured')
        setResolutionErrorMsg('SMTP chưa được cấu hình. Vui lòng thiết lập MAIL_HOST, MAIL_USER, MAIL_PASSWORD trong .env')
      } else {
        setResolutionStatus('error')
        setResolutionErrorMsg(result.meta?.emailError || 'Gửi email thất bại. Vui lòng thử lại.')
      }
    } catch {
      setResolutionStatus('error')
      setResolutionErrorMsg('Không thể gửi email. Vui lòng thử lại.')
    } finally {
      setSendingResolution(false)
    }
  }

  const handleSearch = () => {
    fetchContacts(1)
  }

  const checkSmtp = async () => {
    setSmtpChecking(true)
    try {
      const result = await contactApi.adminSmtpTest()
      setSmtpStatus(result)
    } catch {
      setSmtpStatus({ status: 'connection_failed', message: 'Không thể kiểm tra SMTP' })
    } finally {
      setSmtpChecking(false)
    }
  }

  useEffect(() => {
    checkSmtp()
  }, [])

  useEffect(() => {
    if (selected && detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [selected])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Yêu cầu hỗ trợ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên, email, chủ đề..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Mới</SelectItem>
                  <SelectItem value="in_progress">Đang xử lý</SelectItem>
                  <SelectItem value="resolved">Đã xử lý</SelectItem>
                  <SelectItem value="rejected">Từ chối xử lý</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleSearch}>
                <Filter className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {smtpStatus && smtpStatus.status !== 'connection_ok' && (
        <Card className={smtpStatus.status === 'not_configured' ? 'border-amber-500/30' : 'border-red-500/30'}>
          <CardContent className="flex items-center gap-3 py-3">
            <Wifi className="size-4 text-amber-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {smtpStatus.status === 'not_configured' ? 'SMTP chưa được cấu hình' : 'SMTP connection issue'}
              </p>
              <p className="text-xs text-muted-foreground">{smtpStatus.message}</p>
            </div>
            <Button variant="outline" size="sm" onClick={checkSmtp} disabled={smtpChecking}>
              {smtpChecking ? 'Đang kiểm tra...' : 'Kiểm tra lại'}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-4 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
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
                  <tr className="border-b border-border text-left text-muted-foreground">
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
                      <tr key={c._id} className="border-b border-border/50 hover:bg-accent/50">
                        <td className="px-4 py-3 text-muted-foreground">{(meta?.page ?? 1) * 10 - 10 + idx + 1}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{c.fullname}</p>
                          <p className="text-xs text-muted-foreground">{c.email}</p>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{c.subject}</td>
                        <td className="px-4 py-3">
                          <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', st.color)}>
                            <st.icon className="size-3" />
                            {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(c.createdAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="sm" onClick={() => openDetail(c._id)} className="text-primary hover:bg-primary/10 hover:text-primary">
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
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Trang {meta.page}/{meta.totalPages} · {meta.total} yêu cầu
              </p>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" disabled={!meta.hasPrevPage} onClick={() => fetchContacts(meta.page - 1)}>
                  <ChevronLeft className="size-4" />
                </Button>
                <Button variant="ghost" size="sm" disabled={!meta.hasNextPage} onClick={() => fetchContacts(meta.page + 1)}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {(selected || detailLoading) && (
        <div ref={detailRef}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Chi tiết yêu cầu</span>
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
                <XCircle className="size-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {detailLoading ? (
              <div className="space-y-4">
                <div className="h-8 w-1/3 animate-pulse rounded bg-muted" />
                <div className="h-20 animate-pulse rounded bg-muted" />
              </div>
            ) : selected && (
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">Thông tin khách hàng</p>
                    <div className="rounded-lg border border-border p-4 space-y-2">
                      <p className="text-foreground"><span className="text-muted-foreground">Tên:</span> {selected.fullname}</p>
                      <p className="text-foreground"><span className="text-muted-foreground">Email:</span> {selected.email}</p>
                      <p className="text-foreground"><span className="text-muted-foreground">Điện thoại:</span> {selected.phone}</p>
                      {selected.userId && <p className="text-foreground"><span className="text-muted-foreground">User ID:</span> <span className="font-mono text-xs">{selected.userId}</span></p>}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">Nội dung yêu cầu</p>
                    <div className="rounded-lg border border-border p-4 space-y-2">
                      <p className="text-foreground"><span className="text-muted-foreground">Chủ đề:</span> {selected.subject}</p>
                      <p className="text-foreground"><span className="text-muted-foreground">Ngày gửi:</span> {formatDate(selected.createdAt)}</p>
                      <p className="text-foreground whitespace-pre-line mt-2">{selected.message}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">Xử lý</p>
                    <div className="rounded-lg border border-border p-4 space-y-3">
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">Chuyển trạng thái</label>
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
                                  <SelectTrigger className="w-full opacity-60">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
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
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
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
                        <p className="mb-1 text-xs text-muted-foreground">Ghi chú nội bộ</p>
                        <Textarea
                          value={adminNote}
                          onChange={(e) => setAdminNote(e.target.value)}
                          placeholder="Ghi chú nội bộ (không hiển thị cho khách hàng)..."
                          rows={6}
                          className="resize-none"
                          style={{ minHeight: '120px' }}
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={() => saveNote(selected._id)}
                        disabled={saving}
                      >
                        {saving ? 'Đang lưu...' : 'Lưu ghi chú'}
                      </Button>
                      <div className="border-t border-border pt-3">
                        <p className="mb-1 text-xs text-muted-foreground">Nội dung xử lý</p>
                        <Textarea
                          value={resolutionContent}
                          onChange={(e) => { setResolutionContent(e.target.value); setResolutionStatus('idle') }}
                          placeholder="Nhập nội dung xử lý để gửi cho khách hàng..."
                          rows={8}
                          className="resize-none"
                          style={{ minHeight: '200px' }}
                        />
                        <Button
                          size="sm"
                          onClick={() => sendResolution(selected._id)}
                          disabled={sendingResolution || !resolutionContent.trim()}
                          className="mt-2"
                        >
                          {sendingResolution ? (
                            <>
                              <Send className="mr-1 size-3 animate-pulse" />
                              Đang gửi...
                            </>
                          ) : (
                            <>
                              <Send className="mr-1 size-3" />
                              Gửi nội dung xử lý cho khách hàng
                            </>
                          )}
                        </Button>
                        {resolutionStatus === 'success' && (
                          <p className="mt-2 flex items-center gap-1 text-xs text-emerald-400">
                            <MailCheck className="size-3" />
                            Đã gửi email cho khách hàng
                          </p>
                        )}
                        {resolutionStatus === 'not_configured' && (
                          <p className="mt-2 flex items-center gap-1 text-xs text-amber-400">
                            <MailX className="size-3" />
                            {resolutionErrorMsg || 'Email chưa được cấu hình. Nội dung xử lý đã được lưu.'}
                          </p>
                        )}
                        {resolutionStatus === 'error' && (
                          <p className="mt-2 flex items-center gap-1 text-xs text-red-400">
                            <MailX className="size-3" />
                            {resolutionErrorMsg || 'Không thể gửi email. Vui lòng thử lại.'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      )}
    </div>
  )
}
