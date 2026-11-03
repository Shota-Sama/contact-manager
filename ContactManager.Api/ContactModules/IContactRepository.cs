namespace ContactManager.Api.ContactModules;

public interface IContactRepository
{
    Task<IReadOnlyList<Contact>> GetByUserIdAsync(string userId, CancellationToken cancellationToken);
    Task<Contact?> GetByIdAsync(string id, string userId, CancellationToken cancellationToken);
    Task CreateAsync(Contact contact, CancellationToken cancellationToken);
    Task<bool> UpdateAsync(Contact contact, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(string id, string userId, CancellationToken cancellationToken);
    Task DeleteAllForUserAsync(string userId, CancellationToken cancellationToken);
}
