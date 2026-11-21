using BearCafe.Application.Orders.Interfaces;
using BearCafe.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BearCafe.Infrastructure.Persistence.Repositories;

public class OrderRepository : IOrderRepository
{
    private readonly BearCafeDbContext _context;
    public OrderRepository(BearCafeDbContext context) => _context = context;

    public async Task<IReadOnlyList<Order>> GetAllAsync() =>
        await _context.Orders
            .Include(x => x.OrderItems).ThenInclude(x => x.Product)
            .AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

    public async Task<Order?> GetByIdAsync(int id) =>
        await _context.Orders
            .Include(x => x.OrderItems).ThenInclude(x => x.Product)
            .FirstOrDefaultAsync(x => x.Id == id);

    public async Task AddAsync(Order order)
    {
        await _context.Orders.AddAsync(order);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(Order order)
    {
        // GetByIdAsync tracks the entity, so SaveChanges persists its changes.
        await _context.SaveChangesAsync();
    }
}
