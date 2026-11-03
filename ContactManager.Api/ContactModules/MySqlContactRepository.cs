using MySqlConnector;

namespace ContactManager.Api.ContactModules;

public sealed class MySqlContactRepository(IConfiguration configuration) : IContactRepository
{
    private readonly string _connectionString = configuration.GetConnectionString("ContactDatabase")
        ?? throw new InvalidOperationException("The ContactDatabase connection string has not been configured.");

    public async Task<IReadOnlyList<Contact>> GetByUserIdAsync(string userId, CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT contact_uuid, account_uuid, contact_name, contact_email, contact_phone,
                   contact_address, latitude, longitude, created_at, updated_at,
                   created_by_name, created_by_email
            FROM `shan_contact`.`contact_manager_contacts`
            WHERE account_uuid = @userId
            ORDER BY created_at DESC;
            """;

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);
        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@userId", userId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var contacts = new List<Contact>();
        while (await reader.ReadAsync(cancellationToken)) contacts.Add(ReadContact(reader));
        return contacts;
    }

    public async Task<Contact?> GetByIdAsync(string id, string userId, CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT contact_uuid, account_uuid, contact_name, contact_email, contact_phone,
                   contact_address, latitude, longitude, created_at, updated_at,
                   created_by_name, created_by_email
            FROM `shan_contact`.`contact_manager_contacts`
            WHERE contact_uuid = @id AND account_uuid = @userId
            LIMIT 1;
            """;

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);
        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@id", id);
        command.Parameters.AddWithValue("@userId", userId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        return await reader.ReadAsync(cancellationToken) ? ReadContact(reader) : null;
    }

    public async Task CreateAsync(Contact contact, CancellationToken cancellationToken)
    {
        const string sql = """
            INSERT INTO `shan_contact`.`contact_manager_contacts`
                (contact_uuid, account_uuid, contact_name, contact_email, contact_phone,
                 contact_address, latitude, longitude, created_at, updated_at,
                 created_by_name, created_by_email)
            SELECT
                @id, @userId, @name, @email, @phone, @address, @latitude, @longitude,
                @createdAt, @updatedAt, account.full_display_name, account.account_email
            FROM `shan_contact`.`app_account_users` AS account
            WHERE account.account_uuid = @userId;
            """;
        await ExecuteContactCommandAsync(sql, contact, cancellationToken);
    }

    public async Task<bool> UpdateAsync(Contact contact, CancellationToken cancellationToken)
    {
        const string sql = """
            UPDATE `shan_contact`.`contact_manager_contacts`
            SET contact_name = @name, contact_email = @email, contact_phone = @phone,
                contact_address = @address, latitude = @latitude, longitude = @longitude,
                updated_at = @updatedAt
            WHERE contact_uuid = @id AND account_uuid = @userId;
            """;
        return await ExecuteContactCommandAsync(sql, contact, cancellationToken) == 1;
    }

    public async Task<bool> DeleteAsync(string id, string userId, CancellationToken cancellationToken)
    {
        const string sql = "DELETE FROM `shan_contact`.`contact_manager_contacts` WHERE contact_uuid = @id AND account_uuid = @userId;";
        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);
        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@id", id);
        command.Parameters.AddWithValue("@userId", userId);
        return await command.ExecuteNonQueryAsync(cancellationToken) == 1;
    }

    public async Task DeleteAllForUserAsync(string userId, CancellationToken cancellationToken)
    {
        const string sql = "DELETE FROM `shan_contact`.`contact_manager_contacts` WHERE account_uuid = @userId;";
        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);
        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@userId", userId);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private async Task<int> ExecuteContactCommandAsync(string sql, Contact contact, CancellationToken cancellationToken)
    {
        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);
        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@id", contact.Id);
        command.Parameters.AddWithValue("@userId", contact.UserId);
        command.Parameters.AddWithValue("@name", contact.Name);
        command.Parameters.AddWithValue("@email", contact.Email);
        command.Parameters.AddWithValue("@phone", contact.Phone);
        command.Parameters.AddWithValue("@address", contact.Address);
        command.Parameters.AddWithValue("@latitude", contact.Latitude);
        command.Parameters.AddWithValue("@longitude", contact.Longitude);
        command.Parameters.AddWithValue("@createdAt", contact.CreatedAt);
        command.Parameters.AddWithValue("@updatedAt", contact.UpdatedAt);
        return await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static Contact ReadContact(MySqlDataReader reader) => new(
        reader.GetString("contact_uuid"), reader.GetString("account_uuid"),
        reader.GetString("contact_name"), reader.GetString("contact_email"),
        reader.GetString("contact_phone"), reader.GetString("contact_address"),
        reader.GetDecimal("latitude"), reader.GetDecimal("longitude"),
        reader.GetDateTime("created_at"), reader.GetDateTime("updated_at"),
        reader.GetString("created_by_name"), reader.GetString("created_by_email"));
}
