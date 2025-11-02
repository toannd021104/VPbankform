# 🏦 VPBank Forms - Bộ Demo Forms

5 forms demo cho hệ thống Voice Bot tự động điền form.

---

## 📋 Danh sách Forms

| STT | Tên Form | Mô tả | Link Demo |
|-----|----------|-------|-----------|
| 1 | 🏠 **Vay vốn** | Đơn vay tiền mua nhà/xe | [Xem](https://vpbank-shared-form-fastdeploy.vercel.app/) |
| 2 | 👤 **Khách hàng** | Quản lý thông tin KH | [Xem](https://case2-ten.vercel.app/) |
| 3 | 💼 **Tuyển dụng** | Đơn ứng tuyển | [Xem](https://case3-seven.vercel.app/) |
| 4 | 📊 **Báo cáo** | Báo cáo tuân thủ | [Xem](https://case4-beta.vercel.app/) |
| 5 | ⚙️ **Giao dịch** | Xử lý giao dịch | [Xem](https://case5-chi.vercel.app/) |

---

## 🎯 Cách hoạt động

```
1. User nói với Voice Bot: "Tôi muốn vay 500 triệu"
   
2. Bot hỏi thêm: tên, CMND, thu nhập...
   
3. Bot tự động: Mở form → Điền thông tin → Submit

4. Hoàn thành! ✅
```

---

## 🔗 Dùng với Voice Bot

### Thêm URLs vào file `.env`
````bash
LOAN_FORM_URL=https://vpbank-shared-form-fastdeploy.vercel.app/
CRM_FORM_URL=https://case2-ten.vercel.app/
HR_FORM_URL=https://case3-seven.vercel.app/
COMPLIANCE_FORM_URL=https://case4-beta.vercel.app/
OPERATIONS_FORM_URL=https://case5-chi.vercel.app/
