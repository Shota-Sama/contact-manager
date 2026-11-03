using MySqlConnector;

namespace ContactManager.Api.AccountModules;

public sealed class MySqlAccountUserRepository(IConfiguration configuration)
    : IAccountUserRepository
{
    private readonly string _connectionString =
        configuration.GetConnectionString("ContactDatabase")
        ?? throw new InvalidOperationException(
            "The ContactDatabase connection string has not been configured.");

    public async Task<AccountUser?> FindByEmailAsync(
        string email,
        CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT account_uuid, full_display_name, account_email,
                   secure_password_hash, created_at
            FROM `shan_contact`.`app_account_users`
            WHERE account_email = @email
            LIMIT 1;
            """;

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);
        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@email", email);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        return await reader.ReadAsync(cancellationToken) ? ReadUser(reader) : null;
    }

    public async Task<AccountUser?> FindByIdAsync(
        string id,
        CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT account_uuid, full_display_name, account_email,
                   secure_password_hash, created_at
            FROM `shan_contact`.`app_account_users`
            WHERE account_uuid = @id
            LIMIT 1;
            """;

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);
        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@id", id);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        return await reader.ReadAsync(cancellationToken) ? ReadUser(reader) : null;
    }

    public async Task CreateAsync(AccountUser user, CancellationToken cancellationToken)
    {
        const string sql = """
            INSERT INTO `shan_contact`.`app_account_users`
                (account_uuid, full_display_name, account_email, secure_password_hash, created_at)
            VALUES
                (@id, @name, @email, @passwordHash, @createdAt);
            """;

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);
        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@id", user.Id);
        command.Parameters.AddWithValue("@name", user.Name);
        command.Parameters.AddWithValue("@email", user.Email);
        command.Parameters.AddWithValue("@passwordHash", user.PasswordHash);
        command.Parameters.AddWithValue("@createdAt", user.CreatedAt);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task UpdateAsync(AccountUser user, CancellationToken cancellationToken)
    {
        const string sql = """
            UPDATE `shan_contact`.`app_account_users`
            SET full_display_name = @name, account_email = @email,
                secure_password_hash = @passwordHash
            WHERE account_uuid = @id;
            """;

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);
        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@id", user.Id);
        command.Parameters.AddWithValue("@name", user.Name);
        command.Parameters.AddWithValue("@email", user.Email);
        command.Parameters.AddWithValue("@passwordHash", user.PasswordHash);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task<bool> DeleteAsync(string id, CancellationToken cancellationToken)
    {
        const string sql = """
            DELETE FROM `shan_contact`.`app_account_users`
            WHERE account_uuid = @id;
            """;

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);
        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@id", id);
        return await command.ExecuteNonQueryAsync(cancellationToken) == 1;
    }

    private static AccountUser ReadUser(MySqlDataReader reader) => new(
        reader.GetString("account_uuid"),
        reader.GetString("full_display_name"),
        reader.GetString("account_email"),
        reader.GetString("secure_password_hash"),
        reader.GetDateTime("created_at"));
}
