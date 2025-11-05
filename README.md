# 🏦 VPBank Forms - Bộ Demo Forms

5 forms demo cho hệ thống Voice Bot tự động điền form.

---

## 📋 Danh sách Forms

| STT | Tên Form | Mô tả | Link Demo |
|-----|----------|-------|-----------|
| 1 | 🏠 **Vay vốn** | Đăng ký vay mua nhà, xe, tiêu dùng | [Xem](https://vpbank-shared-form-fastdeploy.vercel.app/) |
| 2 | 👤 **Cập Nhật CRM** | Ghi nhận, cập nhật thông tin & tương tác KH	 | [Xem](https://case2-ten.vercel.app/) |
| 3 | 💼 **Đơn Nội Bộ HR** | Gửi yêu cầu nội bộ: nghỉ phép, công tác, xác nhận	 | [Xem](https://case3-seven.vercel.app/) |
| 4 | 📊 **Báo Cáo Tuân Thủ** | Báo cáo sự cố, vi phạm, đề xuất cải tiến	 | [Xem](https://case4-beta.vercel.app/) |
| 5 | ⚙️ **Xác Thực Giao Dịch** | Xử lý, xác thực các giao dịch vận hành	 | [Xem](https://case5-chi.vercel.app/) |

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
