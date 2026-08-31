using BCrypt.Net;
using ContactManager.Api.AccountModules;
using Microsoft.AspNetCore.Mvc;

namespace ContactManager.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class AuthController(IAccountUserRepository users) : ControllerBase
{
    [HttpPost("signup")]
    public async Task<ActionResult<AccountResponse>> SignUp(
        SignUpRequest request,
        CancellationToken cancellationToken)
    {
        var name = request.Name?.Trim();
        var email = request.Email?.Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(email) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { error = "Name, email, and password are required." });
        }

        if (request.Password.Length < 6)
        {
            return BadRequest(new { error = "Password must be at least 6 characters." });
        }

        if (await users.FindByEmailAsync(email, cancellationToken) is not null)
        {
            return Conflict(new { error = "An account with this email already exists." });
        }

        var user = new AccountUser(
            Guid.NewGuid().ToString(),
            name,
            email,
            BCrypt.Net.BCrypt.HashPassword(request.Password),
            DateTime.UtcNow);

        await users.CreateAsync(user, cancellationToken);
        var response = ToResponse(user);
        return CreatedAtAction(nameof(GetById), new { id = response.Id }, response);
    }

    [HttpPost("login")]
    public async Task<ActionResult<AccountResponse>> Login(
        LoginRequest request,
        CancellationToken cancellationToken)
    {
        var email = request.Email?.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { error = "Email and password are required." });
        }

        var user = await users.FindByEmailAsync(email, cancellationToken);
        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized(new { error = "Invalid email or password." });
        }

        return Ok(ToResponse(user));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AccountResponse>> GetById(
        string id,
        CancellationToken cancellationToken)
    {
        var user = await users.FindByIdAsync(id, cancellationToken);
        return user is null ? NotFound() : Ok(ToResponse(user));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<AccountResponse>> UpdateProfile(
        string id,
        UpdateProfileRequest request,
        CancellationToken cancellationToken)
    {
        var name = request.Name?.Trim();
        var email = request.Email?.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(email) ||
            string.IsNullOrWhiteSpace(request.CurrentPassword))
        {
            return BadRequest(new { error = "Name, email, and current password are required." });
        }

        var user = await users.FindByIdAsync(id, cancellationToken);
        if (user is null) return NotFound();
        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
        {
            return Unauthorized(new { error = "Your current password is incorrect." });
        }

        var accountWithEmail = await users.FindByEmailAsync(email, cancellationToken);
        if (accountWithEmail is not null && accountWithEmail.Id != id)
        {
            return Conflict(new { error = "An account with this email already exists." });
        }

        var newPassword = request.NewPassword?.Trim();
        if (!string.IsNullOrEmpty(newPassword) && newPassword.Length < 6)
        {
            return BadRequest(new { error = "New password must be at least 6 characters." });
        }

        var updatedUser = user with
        {
            Name = name,
            Email = email,
            PasswordHash = string.IsNullOrEmpty(newPassword)
                ? user.PasswordHash
                : BCrypt.Net.BCrypt.HashPassword(newPassword),
        };
        await users.UpdateAsync(updatedUser, cancellationToken);
        return Ok(ToResponse(updatedUser));
    }

    private static AccountResponse ToResponse(AccountUser user) => new(
        user.Id, user.Name, user.Email, user.CreatedAt);
}

public sealed record SignUpRequest(string? Name, string? Email, string? Password);
public sealed record LoginRequest(string? Email, string? Password);
public sealed record UpdateProfileRequest(string? Name, string? Email, string? CurrentPassword, string? NewPassword);
public sealed record AccountResponse(string Id, string Name, string Email, DateTime CreatedAt);
