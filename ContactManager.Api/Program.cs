using ContactManager.Api.AccountModules;
using ContactManager.Api.ContactModules;
using MySqlConnector;

var builder = WebApplication.CreateBuilder(args);

var connectionFileValues = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
var connectionEnvironmentPath = Path.Combine(builder.Environment.ContentRootPath, "conn.env");
if (File.Exists(connectionEnvironmentPath))
{
    connectionFileValues = File.ReadLines(connectionEnvironmentPath)
        .Select(line => line.Trim())
        .Where(line => line.Length > 0 && !line.StartsWith('#') && line.Contains('='))
        .Select(line => line.Split('=', 2))
        .ToDictionary(parts => parts[0].Trim(), parts => parts[1].Trim(), StringComparer.OrdinalIgnoreCase);

}

// Environment variables are used in production hosts such as Render. The local
// conn.env file remains a convenient fallback for development and is never committed.
string? GetDatabaseSetting(string key) => builder.Configuration[key]
    ?? connectionFileValues.GetValueOrDefault(key);

if (string.IsNullOrWhiteSpace(builder.Configuration.GetConnectionString("ContactDatabase")) &&
    GetDatabaseSetting("DB_SERVER") is { } server &&
    GetDatabaseSetting("DB_PORT") is { } portText && uint.TryParse(portText, out var port) &&
    GetDatabaseSetting("DB_DATABASE") is { } database &&
    GetDatabaseSetting("DB_USER") is { } userId &&
    GetDatabaseSetting("DB_PASSWORD") is { } password)
{
    var connectionString = new MySqlConnectionStringBuilder
    {
        Server = server,
        Port = port,
        Database = database,
        UserID = userId,
        Password = password,
    }.ConnectionString;

    builder.Configuration["ConnectionStrings:ContactDatabase"] = connectionString;
}

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddScoped<IAccountUserRepository, MySqlAccountUserRepository>();
builder.Services.AddScoped<IContactRepository, MySqlContactRepository>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("NextFrontend", policy =>
        policy.WithOrigins("http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod());
});

var app = builder.Build();

var databaseConnectionString = app.Configuration.GetConnectionString("ContactDatabase")
    ?? throw new InvalidOperationException("The ContactDatabase connection string has not been configured.");

try
{
await using (var connection = new MySqlConnection(databaseConnectionString))
{
    await connection.OpenAsync();
    await using var command = new MySqlCommand("""
        CREATE TABLE IF NOT EXISTS `shan_contact`.`contact_manager_contacts` (
          `contact_uuid` VARCHAR(36) NOT NULL,
          `account_uuid` VARCHAR(36) NOT NULL,
          `contact_name` VARCHAR(255) NOT NULL,
          `contact_email` VARCHAR(255) NOT NULL DEFAULT '',
          `contact_phone` VARCHAR(50) NOT NULL DEFAULT '',
          `contact_address` VARCHAR(500) NOT NULL DEFAULT '',
          `latitude` DECIMAL(10,7) NOT NULL DEFAULT 0,
          `longitude` DECIMAL(10,7) NOT NULL DEFAULT 0,
          `created_at` TIMESTAMP NOT NULL,
          `updated_at` TIMESTAMP NOT NULL,
          `created_by_name` VARCHAR(255) NOT NULL DEFAULT '',
          `created_by_email` VARCHAR(255) NOT NULL DEFAULT '',
          PRIMARY KEY (`contact_uuid`),
          KEY `ix_contact_manager_contacts_account_uuid` (`account_uuid`),
          CONSTRAINT `fk_contact_manager_contacts_account` FOREIGN KEY (`account_uuid`)
            REFERENCES `app_account_users` (`account_uuid`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
        """, connection);
    await command.ExecuteNonQueryAsync();

    await using var addCreatorColumns = new MySqlCommand("""
        ALTER TABLE `shan_contact`.`contact_manager_contacts`
          ADD COLUMN IF NOT EXISTS `created_by_name` VARCHAR(255) NOT NULL DEFAULT '',
          ADD COLUMN IF NOT EXISTS `created_by_email` VARCHAR(255) NOT NULL DEFAULT '';
        """, connection);
    await addCreatorColumns.ExecuteNonQueryAsync();

    await using var backfillCreators = new MySqlCommand("""
        UPDATE `shan_contact`.`contact_manager_contacts` AS contact
        INNER JOIN `shan_contact`.`app_account_users` AS account
          ON account.account_uuid = contact.account_uuid
        SET contact.created_by_name = account.full_display_name,
            contact.created_by_email = account.account_email
        WHERE contact.created_by_name = '' OR contact.created_by_email = '';
        """, connection);
    await backfillCreators.ExecuteNonQueryAsync();
}
}
catch (MySqlException exception)
{
    Console.Error.WriteLine($"Database setup was skipped because MySQL is currently unavailable: {exception.Message}");
}

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("NextFrontend");
app.MapControllers();

app.Run();
