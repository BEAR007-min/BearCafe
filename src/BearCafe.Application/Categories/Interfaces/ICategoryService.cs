using BearCafe.Application.Categories.DTOs;

namespace BearCafe.Application.Categories.Interfaces;

public interface ICategoryService
{
    Task<IReadOnlyList<CategoryDto>> GetAllAsync();
    Task<CategoryDto?> GetByIdAsync(int id);
    Task<CategoryDto> CreateAsync(CategoryDto categoryDto);
    Task<bool> UpdateAsync(int id, CategoryDto categoryDto);
    Task<bool> DeleteAsync(int id);
}
