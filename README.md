# CS2 Inspect API

A REST API service to fetch detailed information about Counter-Strike 2 items (Float, Paint Seed, Stickers, etc.) by interacting directly with the Game Coordinator (GC).

## Features

- **Direct GC Interaction**: Fetches real-time data from Valve's servers.
- **Inspect Link Parsing**: Automatically extracts parameters from standard inspect links.
- **Structured Response**: Returns clean JSON with all item properties.
- **Rate Limiting**: Built-in queue to respect Valve's rate limits.
- **Advanced Calculations**: Automatically calculates Doppler phases, Fade percentages, and Blue Gem status.

## Getting Started

### Prerequisites

- Node.js (v18+)
- A Steam Account with CS2 (for the bot)

### Installation

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure environment variables:
    Create a `.env` file in the root directory:
    ```env
    STEAM_USERNAME=your_steam_username
    STEAM_PASSWORD=your_steam_password
    STEAM_SHARED_SECRET=optional_shared_secret_for_2fa
    PORT=3002
    ```
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

## Rate Limiting

The Steam Game Coordinator allows approximately **1 request per second**. The API attempts to handle this, but heavy load may result in timeouts.
