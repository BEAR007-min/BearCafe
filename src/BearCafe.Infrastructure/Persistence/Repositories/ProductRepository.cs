using BearCafe.Application.Products.Interfaces;
using BearCafe.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BearCafe.Infrastructure.Persistence.Repositories;

public class ProductRepository : IProductRepository
{
    private readonly BearCafeDbContext _context;
    public ProductRepository(BearCafeDbContext context) => _context = context;

    public async Task<IReadOnlyList<Product>> GetAllAsync() =>
        await _context.Products.AsNoTracking().OrderBy(x => x.Name).ToListAsync();

    public async Task<Product?> GetByIdAsync(int id) =>
        await _context.Products.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);

    public async Task AddAsync(Product product)
    {
        await _context.Products.AddAsync(product);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(Product product)
    {
        _context.Products.Update(product);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Product product)
    {
        _context.Products.Remove(product);
        await _context.SaveChangesAsync();
    }
}
