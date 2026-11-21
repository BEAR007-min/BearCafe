# Báo cáo rà soát gói BearCafe

## Các nội dung đã chỉnh trong bản bàn giao

- Thêm `BearCafe.sln` để có thể restore/build từ thư mục gốc.
- Thêm `Properties/launchSettings.json` để cố định URL phát triển `http://localhost:5000`.
- Thêm kiểm tra fail-fast nếu thiếu `ConnectionStrings:DefaultConnection`.
- Bỏ HTTPS redirection khỏi cấu hình HTTP local để không phát sinh cảnh báo thiếu HTTPS port khi chạy dev.
- Đồng bộ fallback API trong `frontend/src/api.ts` và dòng trạng thái ở `App.tsx` về cổng 5000.
- Sửa chuỗi thông báo lỗi tiếng Việt bị sai mã hóa trong API client.
- Thêm `.env.example`; loại file `.env` máy cá nhân khỏi ZIP.
- Thêm `.gitignore`; loại `node_modules`, `bin`, `obj`, `dist` khỏi ZIP bàn giao.
- Thêm script SQL khởi tạo database cho máy mới, script seed dữ liệu demo và script kiểm tra schema.
- Sửa README: dùng lệnh PowerShell đúng, sửa đường dẫn bị lỗi ký tự, ghi rõ cách giữ database có sẵn.
- Thêm tham chiếu trực tiếp `System.Security.Cryptography.Pkcs` 9.0.21 để override bản transitive 9.0.11 bị cảnh báo trong file assets của gói đầu vào.

## Những gì đã được xác nhận từ phiên làm việc của người dùng

Theo kết quả người dùng đã gửi trong hội thoại:

- `dotnet restore` và `dotnet build` đã thành công trên Windows sau khi bổ sung bốn file `.csproj` bị thiếu ở gói trước.
- Backend đã trả `HTTP 200 OK` từ `/api/products`, `/api/categories`, `/api/orders` sau khi cấu hình đúng `localhost\SQLEXPRESS`.
- SQL Server đã trả dữ liệu sản phẩm, danh mục và đơn hàng.
- Một đơn hàng thử nghiệm đã được lưu vào cả `Orders` và `OrderItems`.
- Frontend đã khởi chạy trên Vite và trước đó gặp lỗi gọi nhầm cổng API; bản bàn giao này đồng bộ lại cổng 5000.

## Giới hạn kiểm chứng trong môi trường đóng gói

- Môi trường tạo gói không có .NET SDK, vì vậy không thể chạy `dotnet build` ở đây. Cần chạy lại `dotnet restore` và `dotnet build` trên máy Windows của người dùng.
- TypeScript compiler được chạy trong môi trường đóng gói và không báo lỗi type ở lần kiểm tra. Vite bundle không hoàn tất trên Linux vì `node_modules` trong ZIP đầu vào là dependency đã được cài trên Windows và thiếu binary Rollup cho Linux. Bản bàn giao bỏ `node_modules`; chạy `npm ci` trên máy Windows sẽ cài đúng binary theo nền tảng, sau đó chạy `npm run build`.
- SQL bootstrap script dành cho database mới. Nó chỉ tạo database nếu chưa tồn tại và chỉ tạo bảng nếu bảng chưa tồn tại; nó không thay thế Migration cho phát triển schema lâu dài.

## Tính năng chưa có

- Đăng nhập, xác thực và phân quyền nhân viên.
- Module khách hàng.
- Quản lý bàn/đặt bàn.
- Quản lý nguyên liệu và tồn kho.
- Thanh toán trực tuyến/cổng thanh toán.
- Hóa đơn in hoặc PDF.
- Báo cáo nâng cao và biểu đồ theo thời gian.
- Unit tests / integration tests tự động.

Đây là phiên bản MVP phục vụ trình diễn các luồng Products, Categories, Orders và Dashboard.
