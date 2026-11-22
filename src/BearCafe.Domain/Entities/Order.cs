namespace BearCafe.Domain.Entities;

public class Order
{
    public int Id { get; set; }
    public int? CustomerId { get; set; }

    public string Status { get; set; } = "Pending";
    public string PaymentStatus { get; set; } = "Unpaid";

    public string? PaymentMethod { get; set; }

    public decimal TotalAmount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}