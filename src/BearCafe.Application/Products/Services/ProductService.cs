using BearCafe.Application.Products.DTOs;
using BearCafe.Application.Products.Interfaces;
using BearCafe.Domain.Entities;

namespace BearCafe.Application.Products.Services;

public class ProductService : IProductService
{
    private readonly IProductRepository _repository;
    public ProductService(IProductRepository repository) => _repository = repository;

    public async Task<IReadOnlyList<ProductDto>> GetAllAsync() =>
        (await _repository.GetAllAsync()).Select(ToDto).ToList();

    public async Task<ProductDto?> GetByIdAsync(int id)
    {
        var product = await _repository.GetByIdAsync(id);
        return product is null ? null : ToDto(product);
    }

    public async Task<ProductDto> CreateAsync(ProductDto dto)
    {
        Validate(dto);
        var product = new Product
        {
            Name = dto.Name.Trim(), Description = dto.Description?.Trim(),
            Price = dto.Price, ImageUrl = dto.ImageUrl?.Trim(),
            CategoryId = dto.CategoryId, IsAvailable = dto.IsAvailable
        };
        await _repository.AddAsync(product);
        return ToDto(product);
    }

    public async Task<bool> UpdateAsync(int id, ProductDto dto)
    {
        Validate(dto);
        var product = await _repository.GetByIdAsync(id);
        if (product is null) return false;
        product.Name = dto.Name.Trim();
        product.Description = dto.Description?.Trim();
        product.Price = dto.Price;
        product.ImageUrl = dto.ImageUrl?.Trim();
        product.CategoryId = dto.CategoryId;
        product.IsAvailable = dto.IsAvailable;
        await _repository.UpdateAsync(product);
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var product = await _repository.GetByIdAsync(id);
        if (product is null) return false;
        await _repository.DeleteAsync(product);
        return true;
    }

    private static void Validate(ProductDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name)) throw new ArgumentException("Tên sản phẩm không được để trống.");
        if (dto.Name.Trim().Length > 150) throw new ArgumentException("Tên sản phẩm tối đa 150 ký tự.");
        if (dto.Description?.Length > 1000) throw new ArgumentException("Mô tả tối đa 1000 ký tự.");
        if (dto.ImageUrl?.Length > 500) throw new ArgumentException("Đường dẫn ảnh tối đa 500 ký tự.");
        if (dto.Price < 0) throw new ArgumentException("Giá sản phẩm không được âm.");
        if (dto.CategoryId <= 0) throw new ArgumentException("CategoryId không hợp lệ.");
    }

    private static ProductDto ToDto(Product x) => new()
    {
        Id = x.Id, Name = x.Name, Description = x.Description, Price = x.Price,
        ImageUrl = x.ImageUrl, CategoryId = x.CategoryId, IsAvailable = x.IsAvailable
    };
}
