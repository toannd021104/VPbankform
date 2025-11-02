# VPbankform
# 🏦 VPBank Forms - Bộ Demo Forms

5 forms demo cho hệ thống Voice Bot tự động điền form.

---

## 📋 Danh sách Forms

| STT | Tên Form | Mô tả | Link Demo |
|-----|----------|-------|-----------|
| 1 | 🏠 **Vay vốn** | Đơn vay tiền mua nhà/xe | [Xem](https://vpbankform-case1.vercel.app) |
| 2 | 👤 **Khách hàng** | Quản lý thông tin KH | [Xem](https://vpbankform-case2.vercel.app) |
| 3 | 💼 **Tuyển dụng** | Đơn ứng tuyển | [Xem](https://vpbankform-case3.vercel.app) |
| 4 | 📊 **Báo cáo** | Báo cáo tuân thủ | [Xem](https://vpbankform-case4.vercel.app) |
| 5 | ⚙️ **Giao dịch** | Xử lý giao dịch | [Xem](https://vpbankform-case5.vercel.app) |

---

## 🎯 Cách hoạt động

```
1. User nói với Voice Bot: "Tôi muốn vay 500 triệu"
   
2. Bot hỏi thêm: tên, CMND, thu nhập...
   
3. Bot tự động: Mở form → Điền thông tin → Submit

4. Hoàn thành! ✅
```

---

## 🚀 Chạy thử trên máy

### Cách 1: Python Server

````bash
# Vào thư mục case1
cd case1

# Chạy server
python3 -m http.server 8001

# Mở trình duyệt: http://localhost:8001
