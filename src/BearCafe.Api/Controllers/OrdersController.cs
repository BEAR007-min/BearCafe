using BearCafe.Application.Orders.DTOs;
using BearCafe.Application.Orders.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace BearCafe.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _service;
    public OrdersController(IOrderService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<OrderDto>>> GetAll() => Ok(await _service.GetAllAsync());

    [HttpGet("{id:int}")]
    public async Task<ActionResult<OrderDto>> GetById(int id)
    {
        var item = await _service.GetByIdAsync(id);
        return item is null ? NotFound(new { message = "Không tìm thấy đơn hàng." }) : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<OrderDto>> Create(CreateOrderDto dto)
    {
        try
        {
            var created = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }


[HttpPut("{id:int}/status")]
public async Task<IActionResult> UpdateStatus(
    int id,
    UpdateOrderStatusDto dto)
{
    try
    {
        var updated = await _service.UpdateStatusAsync(
            id,
            dto.Status,
            dto.PaymentStatus,
            dto.PaymentMethod
        );

        return updated
            ? NoContent()
            : NotFound(new { message = "Không tìm thấy đơn hàng." });
    }
    catch (ArgumentException ex)
    {
        return BadRequest(new { message = ex.Message });
    }
}
}
