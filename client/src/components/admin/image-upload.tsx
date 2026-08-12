import { useCallback, useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { cn, resolveImageUrl } from '@/lib/utils'
import { uploadApi } from '@/services'
import { getErrorMessage } from '@/services/apiClient'
import { toast } from 'sonner'

interface ImageUploadProps {
  images: string[]
  onChange: (images: string[]) => void
  max?: number
}

export function ImageUpload({ images, onChange, max = 5 }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [reading, setReading] = useState(false)

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return
      const room = max - images.length
      if (room <= 0) return
      setReading(true)
      try {
        const selected = Array.from(files)
          .filter((f) => f.type.startsWith('image/'))
          .slice(0, room)
        const urls: string[] = []
        for (const f of selected) {
          try {
            urls.push(await uploadApi.uploadImage(f))
          } catch (err) {
            toast.error(`${f.name}: ${getErrorMessage(err)}`)
          }
        }
        if (urls.length > 0) onChange([...images, ...urls])
        if (urls.length === 0 && selected.length > 0) {
          toast.error('Không có ảnh nào được tải lên. Vui lòng thử lại.')
        }
      } catch (err) {
        toast.error(getErrorMessage(err))
      } finally {
        setReading(false)
        if (inputRef.current) inputRef.current.value = ''
      }
    },
    [images, max, onChange]
  )

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {images.map((img, i) => (
          <div key={i} className="group relative size-20 overflow-hidden rounded-lg border">
            <img src={resolveImageUrl(img)} alt="" className="size-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(images.filter((_, idx) => idx !== i))}
              className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Xóa ảnh"
            >
              <X className="size-5 text-white" />
            </button>
          </div>
        ))}
        {images.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={reading}
            className={cn(
              'flex size-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-muted-foreground transition-colors hover:border-primary hover:text-primary',
              reading && 'animate-pulse'
            )}
          >
            <ImagePlus className="size-6" />
            <span className="text-[10px]">Tải ảnh</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}
