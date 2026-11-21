namespace BearCafe.Application.Orders.DTOs;

public class UpdateOrderStatusDto
{
    public string Status { get; set; } = string.Empty;
    public string PaymentStatus { get; set; } = string.Empty;
}
