import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, MapPin, MessageCircle, Phone, Send, Box } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { toast } from 'sonner'

const contactSchema = z.object({
  fullname: z.string().trim().min(2, 'Vui lòng nhập họ và tên').max(100, 'Họ tên tối đa 100 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().regex(/^[0-9+\-\s]{8,15}$/, 'Số điện thoại không hợp lệ'),
  message: z.string().trim().min(10, 'Nội dung tối thiểu 10 ký tự').max(2000, 'Nội dung tối đa 2000 ký tự'),
})

type ContactValues = z.infer<typeof contactSchema>

const CONTACT_INFO = [
  { icon: MapPin, label: 'Địa chỉ', value: '123 Nguyễn Trãi, Thanh Xuân, Hà Nội' },
  { icon: Phone, label: 'Điện thoại', value: '0901 234 567' },
  { icon: Mail, label: 'Email', value: 'lienhe@store3d.com' },
]

export default function ContactPage() {
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { fullname: '', email: '', phone: '', message: '' },
  })

  const onSubmit = async () => {
    setSubmitting(true)
    // Frontend-only: no contact API exists. Simulate a clean submit.
    await new Promise((resolve) => setTimeout(resolve, 600))
    setSubmitting(false)
    setSent(true)
    form.reset()
    toast.success('Gửi liên hệ thành công', { description: 'Store 3D sẽ phản hồi bạn trong thời gian sớm nhất.' })
    setTimeout(() => setSent(false), 6000)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-10 text-center">
        <div className="bg-primary/10 text-primary mx-auto flex size-14 items-center justify-center rounded-2xl">
          <MessageCircle className="size-7" />
        </div>
        <h1 className="mt-4 text-3xl font-bold">Liên hệ</h1>
        <p className="text-muted-foreground mx-auto mt-2 max-w-xl text-sm">
          Bạn có thắc mắc về sản phẩm, đơn hàng hoặc muốn đặt mô hình in 3D theo yêu cầu? Hãy gửi cho
          chúng tôi, Store 3D sẽ phản hồi trong thời gian sớm nhất.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
        <div className="space-y-4">
          {CONTACT_INFO.map((item) => (
            <Card key={item.label}>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-xl">
                  <item.icon className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-muted-foreground text-sm">{item.label}</p>
                  <p className="font-medium">{item.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
                  <Box className="size-5" />
                </div>
                <div>
                  <p className="font-medium">Store3D</p>
                  <p className="text-muted-foreground text-sm">Cửa hàng mô hình in 3D chất lượng cao</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gửi liên hệ</CardTitle>
            <p className="text-muted-foreground text-sm">
              Điền thông tin bên dưới, chúng tôi sẽ liên hệ lại với bạn.
            </p>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="fullname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Họ và tên</FormLabel>
                        <FormControl>
                          <Input placeholder="Nguyễn Văn A" {...field} disabled={submitting} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Số điện thoại</FormLabel>
                        <FormControl>
                          <Input placeholder="0901 234 567" {...field} disabled={submitting} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="ban@example.com" {...field} disabled={submitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nội dung</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Nội dung cần hỗ trợ..." rows={5} {...field} disabled={submitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center gap-3">
                  <Button type="submit" disabled={submitting} className="min-w-36">
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Đang gửi...
                      </span>
                    ) : (
                      <>
                        <Send className="size-4" />
                        Gửi liên hệ
                      </>
                    )}
                  </Button>
                  {sent && (
                    <span className="text-emerald-600 dark:text-emerald-400 text-sm">
                      Đã gửi. Cảm ơn bạn đã liên hệ!
                    </span>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
