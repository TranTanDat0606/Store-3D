import { ContactRequest, ContactStatus } from '../models/ContactRequest';
import { config } from '../config';

const ALLOWED_TRANSITIONS: Record<string, ContactStatus[]> = {
  [ContactStatus.New]: [ContactStatus.InProgress, ContactStatus.Rejected],
  [ContactStatus.InProgress]: [ContactStatus.Resolved, ContactStatus.Rejected],
  [ContactStatus.Resolved]: [],
  [ContactStatus.Rejected]: [],
};

export interface ContactInput {
  fullname: string;
  email: string;
  phone: string;
  message: string;
  subject?: string;
  userId?: string;
}

export class ContactService {
  async submit(data: ContactInput) {
    const contact = await ContactRequest.create({
      userId: data.userId || undefined,
      fullname: data.fullname,
      email: data.email,
      phone: data.phone,
      subject: data.subject || 'Liên hệ từ trang web',
      message: data.message,
      status: ContactStatus.New,
    });

    console.log('[Contact Submission]', {
      id: contact._id,
      to: config.supportEmail,
      from: data.email,
      name: data.fullname,
      phone: data.phone,
      message: data.message,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      message: 'Liên hệ của bạn đã được ghi nhận. Chúng tôi sẽ phản hồi trong thời gian sớm nhất.',
      id: contact._id,
    };
  }

  async list(params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) {
    const { page = 1, limit = 20, status, search } = params;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { fullname: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      ContactRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ContactRequest.countDocuments(filter),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  async getById(id: string) {
    return ContactRequest.findById(id).lean();
  }

  async updateStatus(id: string, status: ContactStatus, adminNote?: string) {
    const contact = await ContactRequest.findById(id).lean() as (Record<string, unknown> & { status: string }) | null;
    if (!contact) return null;

    const allowed = ALLOWED_TRANSITIONS[contact.status] || [];
    if (!allowed.includes(status)) {
      throw new Error(
        `Không thể chuyển trạng thái từ "${contact.status}" sang "${status}". Chỉ cho phép: ${allowed.length > 0 ? allowed.join(', ') : 'không (trạng thái cuối)'}`
      );
    }

    const update: Record<string, unknown> = { status };
    if (adminNote !== undefined) update.adminNote = adminNote;
    if (status === ContactStatus.Resolved || status === ContactStatus.Rejected) {
      update.resolvedAt = new Date();
    }
    return ContactRequest.findByIdAndUpdate(id, update, { new: true }).lean();
  }

  async addNote(id: string, adminNote: string) {
    return ContactRequest.findByIdAndUpdate(id, { adminNote }, { new: true }).lean();
  }

  async countNew() {
    return ContactRequest.countDocuments({ status: ContactStatus.New });
  }
}

export const contactService = new ContactService();
