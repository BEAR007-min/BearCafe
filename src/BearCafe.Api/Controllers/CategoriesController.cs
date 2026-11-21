
using BearCafe.Application.Categories.DTOs;
using BearCafe.Application.Categories.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BearCafe.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryService _service;

    public CategoriesController(ICategoryService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CategoryDto>>> GetAll()
    {
        return Ok(await _service.GetAllAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<CategoryDto>> GetById(int id)
    {
        var item = await _service.GetByIdAsync(id);

        if (item == null)
            return NotFound(new { message = "Không tìm thấy danh mục." });

        return Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<CategoryDto>> Create(
        [FromBody] CategoryDto categoryDto)
    {
        try
        {
            var created = await _service.CreateAsync(categoryDto);

            return CreatedAtAction(
                nameof(GetById),
                new { id = created.Id },
                created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] CategoryDto categoryDto)
    {
        try
        {
            var updated = await _service.UpdateAsync(id, categoryDto);

            if (!updated)
                return NotFound(new { message = "Không tìm thấy danh mục." });

            return NoContent();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var deleted = await _service.DeleteAsync(id);

            if (!deleted)
                return NotFound(new { message = "Không tìm thấy danh mục." });

            return NoContent();
        }
        catch (DbUpdateException)
        {
            return Conflict(new
            {
                message = "Không thể xóa danh mục đang được sản phẩm sử dụng."
            });
        }
    }
}
