# CS2 Inspect API

A REST API service to fetch detailed information about Counter-Strike 2 items (Float, Paint Seed, Stickers, etc.) by interacting directly with the Game Coordinator (GC).

## Features

- **Direct GC Interaction**: Fetches real-time data from Valve's servers.
- **Multi-Bot Architecture**: Support for unlimited Steam accounts for parallel processing.
- **Batch Processing**: Process up to 1000 items in a single request.
- **Redis Caching**: 24-hour persistent cache for instant repeated requests.
- **Inspect Link Parsing**: Automatically extracts parameters from standard inspect links.
- **Structured Response**: Returns clean JSON with all item properties.
- **Advanced Calculations**: Automatically calculates Doppler phases, Fade percentages, and Blue Gem status.

## Getting Started

### Prerequisites

- Node.js (v18+)
- Redis server
- 1-20 Steam Accounts with CS2 (more bots = better performance)

### Installation

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure environment variables:
    Create a `.env` file in the root directory:
    ```env
    # Steam bots (unlimited, format: username:password:secret|username:password:secret|...)
    # Examples:
    # With 2FA: STEAM_BOTS=bot1:pass1:secret1|bot2:pass2:secret2
    # Without 2FA: STEAM_BOTS=bot1:pass1:|bot2:pass2:
    # Mixed: STEAM_BOTS=bot1:pass1:secret1|bot2:pass2:|bot3:pass3:secret3
    STEAM_BOTS=your_username:your_password:your_shared_secret_optional

    # Redis configuration
    REDIS_HOST=localhost
    REDIS_PORT=6379
    REDIS_PASSWORD=
    REDIS_DB=0

    # Performance tuning
    INSPECT_CACHE_TTL=86400
    INSPECT_MAX_BATCH_SIZE=1000

    # Server
    PORT=3002
    ```
    
    **Multi-Bot Setup**: For optimal performance with large batches, configure 10-20 Steam accounts. Each bot can process ~1 item/second, so 20 bots = ~20 items/second throughput.

4.  Start the server:
    ```bash
    npm run start
    ```

## API Reference

### Get Item Details

Retrieves technical details about a CS2 item.

**Endpoint:** `GET /api/v1/inspect`

#### Query Parameters

You must provide **either** a `link` **OR** the combination of `a`, `d`, and (`s` or `m`).

| Parameter | Type   | Description                                                                 |
| :-------- | :----- | :-------------------------------------------------------------------------- |
| `link`    | string | Full CS2 inspect link (e.g., `steam://rungame/730/...`).                    |
| `s`       | string | Owner's SteamID64. Required if `link` is not provided (unless `m` is used). |
| `a`       | string | Asset ID (Item ID). Required if `link` is not provided.                     |
| `d`       | string | D Parameter (Unique ID). Required if `link` is not provided.                |
| `m`       | string | Market Listing ID. Alternative to `s` for market items.                     |

#### Example Request (Link)

```http
GET /api/v1/inspect?link=steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20S76561198084749846A698323590D7935523998312483177
```

#### Example Request (Params)

```http
GET /api/v1/inspect?s=76561198084749846&a=698323590&d=7935523998312483177
```

#### Success Response (200 OK)

```json
{
  "accountid": null,
  "itemid": {
    "low": 698323590,
    "high": 0,
    "unsigned": true
  },
  "defindex": 7,
  "paintindex": 44,
  "rarity": 6,
  "quality": 4,
  "paintwear": 0.054321,
  "paintseed": 123,
  "killeaterscoretype": null,
  "killeatervalue": null,
  "customname": null,
  "stickers": [],
  "inventory": 3221225475,
  "origin": 24,
  "questid": null,
  "dropreason": null,
  "musicindex": null,
  "entindex": null,
  "phase": "Sapphire",
  "fadePercentage": 99.5,
  "isBlueGem": false
}
```

#### Error Responses

- **400 Bad Request**: Missing required parameters or invalid link format.
- **408 Request Timeout**: GC did not respond in time (usually 10s).
- **500 Internal Server Error**: Steam bot is not connected to GC.

---

### Batch Inspect Items

Retrieves technical details for multiple CS2 items in a single request. Uses intelligent caching and queue management for optimal performance.

**Endpoint:** `POST /api/v1/inspect/batch`

#### Request Body

```json
{
  "items": [
    {
      "s": "76561198084749846",
      "a": "698323590",
      "d": "7935523998312483177"
    },
    {
      "s": "76561198084749846",
      "a": "698323591",
      "d": "7935523998312483178"
    }
  ]
}
```

Each item in the array follows the same parameter format as the single inspect endpoint.

#### Success Response (200 OK)

```json
{
  "items": [
    {
      "accountid": null,
      "itemid": { "low": 698323590, "high": 0, "unsigned": true },
      "defindex": 7,
      "paintindex": 44,
      "rarity": 6,
      "quality": 4,
      "paintwear": 0.054321,
      "paintseed": 123,
      "phase": "Sapphire",
      "fadePercentage": 99.5,
      "isBlueGem": false
    },
    {
      "accountid": null,
      "itemid": { "low": 698323591, "high": 0, "unsigned": true },
      "defindex": 7,
      "paintindex": 44,
      "phase": null,
      "fadePercentage": null,
      "isBlueGem": false
    }
  ],
  "stats": {
    "total": 2,
    "cached": 0,
    "fetched": 2,
    "failed": 0
  }
}
```

#### Performance

- **Cache Hits**: Instant response (<100ms)
- **1 Bot**: ~1 item/second
- **10 Bots**: ~10 items/second (~100 items in 10 seconds)
- **20 Bots**: ~20 items/second (~1000 items in 50-60 seconds)

---

### Get Statistics

Get current bot, queue, and cache statistics.

**Endpoint:** `GET /api/v1/inspect/stats`

#### Success Response (200 OK)

```json
{
  "bots": {
    "total": 5,
    "ready": 5,
    "bots": [
      { "id": 0, "username": "bot1", "isGcReady": true },
      { "id": 1, "username": "bot2", "isGcReady": true }
    ]
  },
  "queue": {
    "queueLength": 0,
    "processing": false,
    "processed": 1523,
    "failed": 2,
    "queued": 1525
  },
  "cache": {
    "hits": 8234,
    "misses": 1525,
    "sets": 1523,
    "hitRate": "84.38%"
  }
}
```

---

## Rate Limiting & Performance

The Steam Game Coordinator allows approximately **1 request per second per Steam account**. This API uses:

- **Multi-Bot Architecture**: Configure multiple Steam accounts to process requests in parallel
- **Intelligent Queue**: Distributes requests across available bots using round-robin
- **Redis Caching**: 24-hour cache for repeated inspections (instant response)
- **Automatic Retry**: Failed requests are retried up to 3 times

**Performance Examples:**
- 1000 items with 1 bot: ~16-17 minutes (first request)
- 1000 items with 10 bots: ~2-3 minutes (first request)
- 1000 items with 20 bots: ~50-60 seconds (first request)
- 1000 items (cached): <1 second (subsequent requests)

**Recommended Setup**: 10-20 bots for production use with large inventories.
