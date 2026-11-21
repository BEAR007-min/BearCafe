using BearCafe.Application.Categories.Interfaces;
using BearCafe.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BearCafe.Infrastructure.Persistence.Repositories;

public class CategoryRepository : ICategoryRepository
{
    private readonly BearCafeDbContext _context;
    public CategoryRepository(BearCafeDbContext context) => _context = context;

    public async Task<IReadOnlyList<Category>> GetAllAsync() =>
        await _context.Categories.AsNoTracking().OrderBy(x => x.Name).ToListAsync();

    public async Task<Category?> GetByIdAsync(int id) =>
        await _context.Categories.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);

    public async Task AddAsync(Category category)
    {
        await _context.Categories.AddAsync(category);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(Category category)
    {
        _context.Categories.Update(category);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Category category)
    {
        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();
    }
}
