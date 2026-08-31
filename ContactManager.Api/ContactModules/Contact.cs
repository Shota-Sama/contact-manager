namespace ContactManager.Api.ContactModules;

public sealed record Contact(
    string Id,
    string UserId,
    string Name,
    string Email,
    string Phone,
    string Address,
    decimal Latitude,
    decimal Longitude,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    string CreatedByName,
    string CreatedByEmail);

public sealed record ContactInput(
    string? Name,
    string? Email,
    string? Phone,
    string? Address,
    decimal? Latitude,
    decimal? Longitude);
