using BearCafe.Application.Products.DTOs;
using BearCafe.Application.Products.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BearCafe.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _service;
    public ProductsController(IProductService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ProductDto>>> GetAll() => Ok(await _service.GetAllAsync());

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProductDto>> GetById(int id)
    {
        var item = await _service.GetByIdAsync(id);
        return item is null ? NotFound(new { message = "Không tìm thấy sản phẩm." }) : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<ProductDto>> Create(ProductDto dto)
    {
        try
        {
            var created = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (DbUpdateException) { return Conflict(new { message = "Không thể lưu sản phẩm. Hãy kiểm tra CategoryId có tồn tại không." }); }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, ProductDto dto)
    {
        try
        {
            var updated = await _service.UpdateAsync(id, dto);
            return updated ? NoContent() : NotFound(new { message = "Không tìm thấy sản phẩm." });
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (DbUpdateException) { return Conflict(new { message = "Không thể cập nhật sản phẩm. Hãy kiểm tra CategoryId." }); }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var deleted = await _service.DeleteAsync(id);
            return deleted ? NoContent() : NotFound(new { message = "Không tìm thấy sản phẩm." });
        }
        catch (DbUpdateException) { return Conflict(new { message = "Không thể xóa sản phẩm đang được sử dụng trong đơn hàng." }); }
    }
}
