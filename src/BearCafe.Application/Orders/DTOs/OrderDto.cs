namespace BearCafe.Application.Orders.DTOs;

public class OrderDto
{
    public int Id { get; set; }
    public int? CustomerId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string PaymentStatus { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<OrderItemDto> Items { get; set; } = new();
}
