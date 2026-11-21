using BearCafe.Application.Categories.DTOs;
using BearCafe.Application.Categories.Interfaces;
using BearCafe.Domain.Entities;

namespace BearCafe.Application.Categories.Services;

public class CategoryService : ICategoryService
{
    private readonly ICategoryRepository _repository;
    public CategoryService(ICategoryRepository repository) => _repository = repository;

    public async Task<IReadOnlyList<CategoryDto>> GetAllAsync() =>
        (await _repository.GetAllAsync()).Select(ToDto).ToList();

    public async Task<CategoryDto?> GetByIdAsync(int id)
    {
        var category = await _repository.GetByIdAsync(id);
        return category is null ? null : ToDto(category);
    }

    public async Task<CategoryDto> CreateAsync(CategoryDto dto)
    {
        Validate(dto);
        var category = new Category { Name = dto.Name.Trim(), Description = dto.Description?.Trim(), IsActive = dto.IsActive };
        await _repository.AddAsync(category);
        return ToDto(category);
    }

    public async Task<bool> UpdateAsync(int id, CategoryDto dto)
    {
        Validate(dto);
        var category = await _repository.GetByIdAsync(id);
        if (category is null) return false;
        category.Name = dto.Name.Trim();
        category.Description = dto.Description?.Trim();
        category.IsActive = dto.IsActive;
        await _repository.UpdateAsync(category);
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var category = await _repository.GetByIdAsync(id);
        if (category is null) return false;
        await _repository.DeleteAsync(category);
        return true;
    }

    private static void Validate(CategoryDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name)) throw new ArgumentException("Tên danh mục không được để trống.");
        if (dto.Name.Trim().Length > 100) throw new ArgumentException("Tên danh mục tối đa 100 ký tự.");
        if (dto.Description?.Length > 500) throw new ArgumentException("Mô tả tối đa 500 ký tự.");
    }

    private static CategoryDto ToDto(Category x) => new()
    {
        Id = x.Id, Name = x.Name, Description = x.Description, IsActive = x.IsActive
    };
}
