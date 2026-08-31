FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ContactManager.Api/ContactManager.Api.csproj ContactManager.Api/
RUN dotnet restore ContactManager.Api/ContactManager.Api.csproj

COPY ContactManager.Api/ ContactManager.Api/
RUN dotnet publish ContactManager.Api/ContactManager.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://0.0.0.0:10000
EXPOSE 10000
ENTRYPOINT ["dotnet", "ContactManager.Api.dll"]
