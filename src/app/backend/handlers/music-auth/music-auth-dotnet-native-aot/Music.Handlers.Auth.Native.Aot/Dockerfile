FROM public.ecr.aws/lambda/dotnet:8 AS base

FROM mcr.microsoft.com/dotnet/sdk:8.0 as build

# Install Native AOT prerequisites
RUN apt-get update && \
    apt-get install -y clang zlib1g-dev libkrb5-dev libtinfo5

WORKDIR /src
COPY ["Music.Handlers.Auth.Native.Aot.csproj", "Music.Handlers.Auth.Native.Aot/"]
RUN dotnet restore "Music.Handlers.Auth.Native.Aot/Music.Handlers.Auth.Native.Aot.csproj"

WORKDIR "/src/Music.Handlers.Auth.Native.Aot"
COPY . .
RUN dotnet build "Music.Handlers.Auth.Native.Aot.csproj" --configuration Release --output /app/build

FROM build AS publish
RUN dotnet publish "Music.Handlers.Auth.Native.Aot.csproj" \
            --configuration Release \
            --runtime linux-x64 \
            --self-contained true \
            --output /app/publish \
            -p:PublishAot=true \
            -p:StripSymbols=true \
            -p:TrimMode=link \
            -p:TrimmerDefaultAction=link \
            -p:EnableCompressionInNativeAOT=true

FROM base AS final
WORKDIR /var/task
COPY --from=publish /app/publish .