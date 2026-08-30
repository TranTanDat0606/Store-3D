import ExcelJS from 'exceljs';
import { Order, OrderItem, PaymentStatus, OrderStatus } from '../models';

function formatVnd(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value) + 'đ';
}

export async function generateRevenueExcel(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Store3D';
  workbook.created = new Date();

  const paidNotCancelled = {
    'payment.status': PaymentStatus.Paid,
    status: { $ne: OrderStatus.Cancelled },
  };

  const [overviewResult, dailyRevenue, monthlyRevenue, productSales] = await Promise.all([
    Order.aggregate([
      { $match: paidNotCancelled },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          totalOrders: { $sum: 1 },
          totalItems: { $sum: { $size: '$items' } },
        },
      },
    ]),
    Order.aggregate([
      { $match: paidNotCancelled },
      { $addFields: { revenueDate: { $ifNull: ['$paidAt', '$updatedAt'] } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$revenueDate' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: paidNotCancelled },
      { $addFields: { revenueDate: { $ifNull: ['$paidAt', '$updatedAt'] } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$revenueDate' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    OrderItem.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productData',
        },
      },
      { $unwind: { path: '$productData', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$product',
          name: { $first: '$name' },
          totalSold: { $sum: '$quantity' },
          revenue: { $sum: { $multiply: ['$price', '$quantity'] } },
          stock: { $first: '$productData.stock' },
        },
      },
      { $sort: { revenue: -1 } },
    ]),
  ]);

  const overview = overviewResult[0] || { totalRevenue: 0, totalOrders: 0, totalItems: 0 };

  // Sheet 1: Tổng quan
  const overviewSheet = workbook.addWorksheet('Tổng quan');
  overviewSheet.columns = [
    { header: 'Chỉ tiêu', key: 'metric', width: 30 },
    { header: 'Giá trị', key: 'value', width: 25 },
  ];
  overviewSheet.getRow(1).font = { bold: true, size: 12 };
  overviewSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
  overviewSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  overviewSheet.addRow({ metric: 'Tổng doanh thu', value: formatVnd(overview.totalRevenue) });
  overviewSheet.addRow({ metric: 'Tổng đơn hàng', value: overview.totalOrders });
  overviewSheet.addRow({ metric: 'Tổng sản phẩm bán', value: overview.totalItems });
  overviewSheet.addRow({ metric: 'Ngày xuất', value: new Date().toLocaleDateString('vi-VN') });

  // Sheet 2: Doanh thu theo ngày
  const dailySheet = workbook.addWorksheet('Doanh thu theo ngày');
  dailySheet.columns = [
    { header: 'Ngày', key: 'date', width: 15 },
    { header: 'Đơn hàng', key: 'orders', width: 12 },
    { header: 'Doanh thu', key: 'revenue', width: 20 },
  ];
  dailySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  dailySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };

  for (const row of dailyRevenue) {
    const r = dailySheet.addRow({
      date: row._id,
      orders: row.orders,
      revenue: formatVnd(row.revenue),
    });
    r.getCell('revenue').alignment = { horizontal: 'right' };
  }

  // Sheet 3: Doanh thu theo tháng
  const monthlySheet = workbook.addWorksheet('Doanh thu theo tháng');
  monthlySheet.columns = [
    { header: 'Tháng', key: 'month', width: 15 },
    { header: 'Đơn hàng', key: 'orders', width: 12 },
    { header: 'Doanh thu', key: 'revenue', width: 20 },
  ];
  monthlySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  monthlySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };

  for (const row of monthlyRevenue) {
    const r = monthlySheet.addRow({
      month: row._id,
      orders: row.orders,
      revenue: formatVnd(row.revenue),
    });
    r.getCell('revenue').alignment = { horizontal: 'right' };
  }

  // Sheet 4: Sản phẩm
  const productSheet = workbook.addWorksheet('Sản phẩm');
  productSheet.columns = [
    { header: 'Sản phẩm', key: 'name', width: 35 },
    { header: 'Đã bán', key: 'sold', width: 12 },
    { header: 'Tồn kho', key: 'stock', width: 12 },
    { header: 'Doanh thu', key: 'revenue', width: 20 },
  ];
  productSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  productSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };

  for (const row of productSales) {
    const r = productSheet.addRow({
      name: row.name || 'N/A',
      sold: row.totalSold,
      stock: row.stock ?? 0,
      revenue: formatVnd(row.revenue),
    });
    r.getCell('revenue').alignment = { horizontal: 'right' };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
