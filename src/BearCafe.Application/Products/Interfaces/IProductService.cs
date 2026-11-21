using BearCafe.Application.Products.DTOs;

namespace BearCafe.Application.Products.Interfaces;

public interface IProductService
{
    Task<IReadOnlyList<ProductDto>> GetAllAsync();
    Task<ProductDto?> GetByIdAsync(int id);
    Task<ProductDto> CreateAsync(ProductDto productDto);
    Task<bool> UpdateAsync(int id, ProductDto productDto);
    Task<bool> DeleteAsync(int id);
}
