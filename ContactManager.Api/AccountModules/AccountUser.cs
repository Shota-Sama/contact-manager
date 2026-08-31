namespace ContactManager.Api.AccountModules;

public sealed record AccountUser(
    string Id,
    string Name,
    string Email,
    string PasswordHash,
    DateTime CreatedAt);
