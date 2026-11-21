using BearCafe.Application.Orders.DTOs;
using BearCafe.Application.Orders.Interfaces;
using BearCafe.Application.Products.Interfaces;
using BearCafe.Domain.Entities;

namespace BearCafe.Application.Orders.Services;

public class OrderService : IOrderService
{
    private static readonly string[] OrderStatuses = ["Pending", "Processing", "Completed", "Cancelled"];
    private static readonly string[] PaymentStatuses = ["Unpaid", "Paid", "Refunded"];
    private readonly IOrderRepository _orders;
    private readonly IProductRepository _products;

    public OrderService(IOrderRepository orders, IProductRepository products)
    {
        _orders = orders;
        _products = products;
    }

    public async Task<IReadOnlyList<OrderDto>> GetAllAsync() =>
        (await _orders.GetAllAsync()).Select(ToDto).ToList();

    public async Task<OrderDto?> GetByIdAsync(int id)
    {
        var order = await _orders.GetByIdAsync(id);
        return order is null ? null : ToDto(order);
    }

    public async Task<OrderDto> CreateAsync(CreateOrderDto dto)
    {
        if (dto.Items is null || dto.Items.Count == 0)
            throw new ArgumentException("Đơn hàng phải có ít nhất một sản phẩm.");

        var orderItems = new List<OrderItem>();
        foreach (var item in dto.Items)
        {
            if (item.ProductId <= 0) throw new ArgumentException("ProductId không hợp lệ.");
            if (item.Quantity <= 0) throw new ArgumentException("Số lượng phải lớn hơn 0.");

            var product = await _products.GetByIdAsync(item.ProductId);
            if (product is null) throw new KeyNotFoundException($"Không tìm thấy sản phẩm ID {item.ProductId}.");
            if (!product.IsAvailable) throw new InvalidOperationException($"Sản phẩm '{product.Name}' hiện không kinh doanh.");

            orderItems.Add(new OrderItem
            {
                ProductId = product.Id,
                Quantity = item.Quantity,
                UnitPrice = product.Price,
                SubTotal = product.Price * item.Quantity
            });
        }

        var order = new Order
        {
            CustomerId = dto.CustomerId,
            Status = "Pending",
            PaymentStatus = "Unpaid",
            CreatedAt = DateTime.UtcNow,
            TotalAmount = orderItems.Sum(x => x.SubTotal),
            OrderItems = orderItems
        };

        await _orders.AddAsync(order);
        var saved = await _orders.GetByIdAsync(order.Id);
        if (saved is null) throw new InvalidOperationException("Không tải được đơn hàng vừa tạo.");
        return ToDto(saved);
    }

    public async Task<bool> UpdateStatusAsync(int id, string status, string paymentStatus)
    {
        var order = await _orders.GetByIdAsync(id);
        if (order is null) return false;
        if (!OrderStatuses.Contains(status, StringComparer.OrdinalIgnoreCase))
            throw new ArgumentException("Status phải là Pending, Processing, Completed hoặc Cancelled.");
        if (!PaymentStatuses.Contains(paymentStatus, StringComparer.OrdinalIgnoreCase))
            throw new ArgumentException("PaymentStatus phải là Unpaid, Paid hoặc Refunded.");
        order.Status = OrderStatuses.First(x => x.Equals(status, StringComparison.OrdinalIgnoreCase));
        order.PaymentStatus = PaymentStatuses.First(x => x.Equals(paymentStatus, StringComparison.OrdinalIgnoreCase));
        await _orders.UpdateAsync(order);
        return true;
    }

    private static OrderDto ToDto(Order x) => new()
    {
        Id = x.Id, CustomerId = x.CustomerId, Status = x.Status,
        PaymentStatus = x.PaymentStatus, TotalAmount = x.TotalAmount, CreatedAt = x.CreatedAt,
        Items = x.OrderItems.Select(item => new OrderItemDto
        {
            Id = item.Id, ProductId = item.ProductId,
            ProductName = item.Product?.Name ?? "Sản phẩm không xác định",
            Quantity = item.Quantity, UnitPrice = item.UnitPrice, SubTotal = item.SubTotal
        }).ToList()
    };
}
