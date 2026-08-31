using ContactManager.Api.ContactModules;
using Microsoft.AspNetCore.Mvc;

namespace ContactManager.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class ContactController(IContactRepository contacts) : ControllerBase
{
    [HttpGet("user/{userId}")]
    public async Task<ActionResult<IReadOnlyList<Contact>>> GetForUser(string userId, CancellationToken cancellationToken) =>
        Ok(await contacts.GetByUserIdAsync(userId, cancellationToken));

    [HttpGet("{id}")]
    public async Task<ActionResult<Contact>> GetById(string id, [FromQuery] string userId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(userId)) return BadRequest(new { error = "userId is required." });
        var contact = await contacts.GetByIdAsync(id, userId, cancellationToken);
        return contact is null ? NotFound() : Ok(contact);
    }

    [HttpPost]
    public async Task<ActionResult<Contact>> Create(CreateContactRequest request, CancellationToken cancellationToken)
    {
        if (!TryCreateContact(request.UserId, request.Contact, out var contact, out var error))
            return BadRequest(new { error });
        await contacts.CreateAsync(contact, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = contact.Id, userId = contact.UserId }, contact);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Contact>> Update(string id, UpdateContactRequest request, CancellationToken cancellationToken)
    {
        if (!TryCreateContact(request.UserId, request.Contact, out var contact, out var error, id))
            return BadRequest(new { error });
        return await contacts.UpdateAsync(contact, cancellationToken) ? Ok(contact) : NotFound();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, [FromQuery] string userId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(userId)) return BadRequest(new { error = "userId is required." });
        return await contacts.DeleteAsync(id, userId, cancellationToken) ? NoContent() : NotFound();
    }

    private static bool TryCreateContact(string? userId, ContactInput? input, out Contact contact, out string error, string? id = null)
    {
        contact = default!;
        error = string.Empty;
        if (string.IsNullOrWhiteSpace(userId) || input is null || string.IsNullOrWhiteSpace(input.Name))
        {
            error = "userId and contact name are required.";
            return false;
        }
        var now = DateTime.UtcNow;
        contact = new Contact(id ?? Guid.NewGuid().ToString(), userId, input.Name.Trim(),
            input.Email?.Trim() ?? string.Empty, input.Phone?.Trim() ?? string.Empty,
            input.Address?.Trim() ?? string.Empty, input.Latitude ?? 0, input.Longitude ?? 0,
            now, now, string.Empty, string.Empty);
        return true;
    }
}

public sealed record CreateContactRequest(string? UserId, ContactInput? Contact);
public sealed record UpdateContactRequest(string? UserId, ContactInput? Contact);
