namespace ContactManager.Api.AccountModules;

public interface IAccountUserRepository
{
    Task<AccountUser?> FindByEmailAsync(string email, CancellationToken cancellationToken);
    Task<AccountUser?> FindByIdAsync(string id, CancellationToken cancellationToken);
    Task CreateAsync(AccountUser user, CancellationToken cancellationToken);
    Task UpdateAsync(AccountUser user, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(string id, CancellationToken cancellationToken);
}
