# BearCafe – Tài liệu bàn giao và chạy dự án

BearCafe là website quản lý quán cà phê ở mức MVP, gồm ASP.NET Core Web API, React + TypeScript và SQL Server Express.

## 1. Công nghệ và cấu trúc

- Backend: ASP.NET Core Web API, .NET 10.
- Kiến trúc Backend: Domain / Application / Infrastructure / API.
- ORM: Entity Framework Core 10.
- Database: Microsoft SQL Server Express.
- Frontend: React 18, TypeScript, Vite 6.

```text
BearCafe/
├── BearCafe.sln
├── .gitignore
├── README.md
├── database/
│   ├── 01_Create_BearCafeDb_IfMissing.sql
│   ├── 02_Seed_Demo_Data.sql
│   └── 03_Check_Database.sql
├── docs/
│   └── AUDIT_AND_LIMITATIONS.md
├── src/
│   ├── BearCafe.Domain/
│   ├── BearCafe.Application/
│   ├── BearCafe.Infrastructure/
│   └── BearCafe.Api/
└── frontend/
    ├── .env.example
    ├── package.json
    ├── package-lock.json
    └── src/
```

## 2. Yêu cầu cài đặt

1. .NET 10 SDK.
2. SQL Server Express (hoặc SQL Server khác) và SSMS.
3. Node.js 22 LTS hoặc phiên bản Node tương thích với Vite 6.
4. PowerShell hoặc CMD.

Kiểm tra công cụ:

```powershell
dotnet --version
node -v
npm -v
```

## 3. Cấu hình database

### Trường hợp A – Bạn đã có database BearCafeDb

**Không chạy script tạo database và không tạo Migration mới.** Giữ database hiện tại, mở `src/BearCafe.Api/appsettings.json` và kiểm tra `DefaultConnection` khớp với SQL Server trên máy.

Cấu hình mẫu cho SQL Server Express cài trên máy local:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost\\SQLEXPRESS;Database=BearCafeDb;Trusted_Connection=True;TrustServerCertificate=True;"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

Nếu SSMS hiển thị Server name khác, thay phần `Server=...` bằng đúng tên instance. Cấu hình trên sử dụng Windows Authentication; không chứa mật khẩu.

### Trường hợp B – Cài trên máy mới, chưa có database

Mở SSMS, kết nối đúng SQL Server instance, sau đó chạy lần lượt:

1. `database/01_Create_BearCafeDb_IfMissing.sql` – tạo database và các bảng còn thiếu. Script không xóa hoặc thay đổi bảng đã tồn tại.
2. `database/02_Seed_Demo_Data.sql` – thêm danh mục và một sản phẩm mẫu nếu chúng chưa tồn tại.
3. `database/03_Check_Database.sql` – kiểm tra cấu trúc và dữ liệu.

Nếu database đã tồn tại, script khởi tạo sẽ chỉ tạo các bảng còn thiếu; nó không sửa cấu trúc bảng hiện có. Với database đang sử dụng, nên sao lưu trước mọi thay đổi SQL.

## 4. Restore và Build Backend

Mở PowerShell tại thư mục gốc `BearCafe`:

```powershell
cd D:\BearCafe
dotnet restore .\BearCafe.sln
dotnet build .\BearCafe.sln
```

Có thể build riêng API:

```powershell
dotnet build .\src\BearCafe.Api\BearCafe.Api.csproj
```

## 5. Chạy Backend

Từ thư mục gốc:

```powershell
dotnet run --project .\src\BearCafe.Api\BearCafe.Api.csproj
```

Cấu hình `launchSettings.json` đặt địa chỉ phát triển là:

`http://localhost:5000`

Giữ cửa sổ terminal này mở. Kiểm tra các endpoint trong PowerShell thứ hai:

```powershell
curl.exe -i http://localhost:5000/api/products
curl.exe -i http://localhost:5000/api/categories
curl.exe -i http://localhost:5000/api/orders
```

Kết quả mong đợi khi kết nối database thành công là `HTTP/1.1 200 OK` và JSON.

OpenAPI JSON (không phải Swagger UI) có tại:

`http://localhost:5000/openapi/v1.json`

## 6. Chạy Frontend

Mở PowerShell thứ hai:

```powershell
cd D:\BearCafe\frontend
Copy-Item .env.example .env
npm ci
npm run build
npm run dev
```

Mở URL Vite hiển thị trong terminal, mặc định:

`http://localhost:5173`

Nếu Backend chạy ở cổng khác, sửa `VITE_API_URL` trong file `frontend/.env`, sau đó khởi động lại Vite. Không đưa file `.env` có cấu hình riêng của máy vào Git hoặc gói chia sẻ; chỉ đưa `.env.example`.

## 7. Chức năng hiện có

### Products – Sản phẩm

- Xem danh sách và chi tiết sản phẩm.
- Thêm, cập nhật, xóa sản phẩm.
- Gán danh mục và bật/tắt trạng thái kinh doanh.

### Categories – Danh mục

- Xem danh sách và chi tiết danh mục.
- Thêm, cập nhật, xóa danh mục.
- Bật/tắt trạng thái danh mục.

### Orders – Đơn hàng

- Xem danh sách và chi tiết đơn hàng.
- Tạo đơn hàng từ các sản phẩm đang kinh doanh.
- Backend lấy giá hiện tại từ database và tự tính SubTotal / TotalAmount.
- Cập nhật trạng thái đơn hàng và thanh toán.

### Dashboard

- Tổng số sản phẩm, danh mục và đơn hàng.
- Doanh thu cộng từ các đơn có `PaymentStatus = Paid`.
- Hiển thị các đơn hàng gần đây.

## 8. API endpoints

| Method | Endpoint | Chức năng |
|---|---|---|
| GET | `/api/products` | Danh sách sản phẩm |
| GET | `/api/products/{id}` | Chi tiết sản phẩm |
| POST | `/api/products` | Thêm sản phẩm |
| PUT | `/api/products/{id}` | Cập nhật sản phẩm |
| DELETE | `/api/products/{id}` | Xóa sản phẩm |
| GET | `/api/categories` | Danh sách danh mục |
| GET | `/api/categories/{id}` | Chi tiết danh mục |
| POST | `/api/categories` | Thêm danh mục |
| PUT | `/api/categories/{id}` | Cập nhật danh mục |
| DELETE | `/api/categories/{id}` | Xóa danh mục |
| GET | `/api/orders` | Danh sách đơn hàng |
| GET | `/api/orders/{id}` | Chi tiết đơn hàng |
| POST | `/api/orders` | Tạo đơn hàng |
| PUT | `/api/orders/{id}/status` | Cập nhật trạng thái |

Ví dụ body tạo đơn hàng:

```json
{
  "customerId": null,
  "items": [
    { "productId": 1, "quantity": 2 }
  ]
}
```

Không gửi giá từ Frontend. Backend lấy đơn giá từ bảng `Products`.

## 9. Kiểm tra demo và chuẩn bị nộp bài

1. Chạy Backend và kiểm tra ba endpoint GET.
2. Chạy Frontend, mở Dashboard và kiểm tra dữ liệu.
3. Thêm một danh mục kiểm thử.
4. Thêm sản phẩm thuộc danh mục vừa tạo.
5. Tạo đơn hàng từ giao diện.
6. Kiểm tra các bản ghi trong `Orders` và `OrderItems` bằng SSMS.
7. Cập nhật trạng thái đơn hàng và thanh toán, sau đó xác minh trong SQL Server.

Không xóa dữ liệu thật chỉ để chụp ảnh minh chứng. Dùng bản ghi kiểm thử riêng.

## 10. Lưu ý bảo mật và vận hành

- Cấu hình mặc định trong `appsettings.json` là ví dụ Windows Authentication cho `localhost\SQLEXPRESS`; cần đổi nếu máy khác dùng instance khác.
- File `.env` là cấu hình cục bộ, không được chia sẻ nếu chứa thông tin riêng.
- Backend dùng HTTP ở cấu hình phát triển local. Khi triển khai thật, cần cấu hình HTTPS, xác thực và phân quyền.
- Không có module đăng nhập/phân quyền trong phiên bản MVP.
- Không có module khách hàng; `CustomerId` hiện có thể để `null`.
- Chưa có quản lý kho, quản lý bàn, tích hợp cổng thanh toán thật, hóa đơn in hoặc báo cáo biểu đồ nâng cao.
- Không chạy `database drop` và không chạy Migration mới trên database hiện tại nếu chưa sao lưu và kiểm tra schema.
