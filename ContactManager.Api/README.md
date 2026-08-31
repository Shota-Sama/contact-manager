# ContactManager API

1. In Navicat, open a query for the `shan_contact` database and run [`database/setup.sql`](database/setup.sql). It creates the account and contact tables expected by this API if they do not already exist.
2. In `appsettings.Development.json`, replace `YOUR_SERVER`, `YOUR_USERNAME`, and `YOUR_PASSWORD` with the values from Navicat's **Edit Connection** dialog. Do not commit this file.
3. Start the API with `dotnet run`, then visit `http://localhost:5197/swagger`.

Swagger includes `Auth` signup/login endpoints and complete `Contact` CRUD endpoints. Passwords are saved only as BCrypt hashes.
