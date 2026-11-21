using BearCafe.Application.Orders.DTOs;

namespace BearCafe.Application.Orders.Interfaces;

public interface IOrderService
{
    Task<IReadOnlyList<OrderDto>> GetAllAsync();
    Task<OrderDto?> GetByIdAsync(int id);
    Task<OrderDto> CreateAsync(CreateOrderDto orderDto);
    Task<bool> UpdateStatusAsync(int id, string status, string paymentStatus);
}
