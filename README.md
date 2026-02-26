# GTA Tools - Simeon's Export Tracker

A web-based tracker for managing Simeon's vehicle export requests in GTA V. Track which vehicles you've tested, monitor the 24-hour delivery cooldown, and efficiently find vehicles across spawn locations.

## Features

- 🚗 **Vehicle Grid Display** - Visual cards showing all possible export vehicles with images
- ⏱️ **24-Hour Countdown Timer** - Track time remaining until next delivery
- ✅ **Progress Tracking** - Mark vehicles as tested and track your search progress
- 🎯 **Group-Based System** - Vehicles are organized by spawn groups; testing one vehicle grays out all vehicles in its groups
- 🔗 **Wiki Integration** - Quick links to GTA Wiki pages for vehicle information
- 💾 **Auto-Save** - All progress automatically saved to browser localStorage
- 🌙 **Dark Mode** - Easy-on-the-eyes dark theme for long gaming sessions
- 📱 **Responsive Design** - Works on desktop and mobile devices
- ⚙️ **Easy Configuration** - Simple JSON-based vehicle configuration

## Demo

Visit the live demo: `https://yourusername.github.io/gtatools/`

## Installation

### Run Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/gtatools.git
   cd gtatools
   ```

2. Open `index.html` in your web browser
   - No build process or dependencies required
   - Works with any modern web browser

### Deploy to GitHub Pages

1. Fork or clone this repository to your GitHub account
2. Go to repository **Settings** → **Pages**
3. Under **Source**, select **Deploy from a branch**
4. Select **main** branch and **/ (root)** folder
5. Click **Save**
6. Your tracker will be available at `https://yourusername.github.io/gtatools/`

## Usage

### Starting a Test Session

1. **Mark Delivery** - Click to start the 24-hour countdown timer
2. **Search for Vehicles** - Visit spawn locations to find requested vehicles
3. **Mark as Tested** - Click "Tested" on vehicle cards as you check them
4. **Track Progress** - Tested vehicles and their group vehicles will be grayed out

### Understanding the System

- **2-Star Wanted Level** - A vehicle that gives an instant 2-star wanted level when you enter it is confirmed to be on Simeon's current request list
- **Spawn Groups** - Vehicles are organized by parking lot spawn groups. When you mark one vehicle as tested, all vehicles in the same groups are grayed out
- **One Per Day** - You can only deliver one vehicle per 24-hour period in GTA V

## Configuration

Edit `config.json` to customize the vehicle list:

```json
{
  "vehicles": [
    {
      "id": "vehicle-001",
      "name": "Banshee",
      "image": "images/_0019_Banshee.png",
      "groups": [2, 4, 6],
      "tooltip": "High-performance sports coupe",
      "wiki": "https://gta.fandom.com/wiki/Banshee_(HD_Universe)"
    }
  ]
}
```

### Configuration Fields

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Unique identifier for the vehicle |
| `name` | Yes | Display name of the vehicle |
| `image` | Yes | Path to vehicle image (relative to index.html) |
| `groups` | Yes | Array of spawn group numbers (1-8) |
| `tooltip` | No | Additional info shown on hover |
| `wiki` | No | URL to wiki page (shows link button if provided) |

### Adding Custom Vehicles

1. Add vehicle image to the `images/` folder (PNG, JPG, or WebP)
2. Add new entry to `config.json` with unique ID
3. Specify spawn groups based on parking lot locations

## Technology Stack

- **HTML5** - Semantic markup
- **CSS3** - Modern styling with CSS Grid and Flexbox
- **Vanilla JavaScript** - No frameworks or dependencies
- **LocalStorage API** - Client-side data persistence

## Project Structure

```
gtatools/
├── index.html          # Main HTML file
├── style.css           # Stylesheet
├── script.js           # Application logic
├── config.json         # Vehicle configuration
├── images/             # Vehicle images
│   └── README.md
├── LICENSE             # License file
└── README.md           # This file
```

## Browser Support

- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Opera

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Vehicle images and information from [GTA Wiki](https://gta.fandom.com/wiki/)
- Inspired by the GTA V community and Simeon's export missions

## Disclaimer

This is a fan-made tool for Grand Theft Auto V. All trademarks and copyrights related to GTA V belong to Rockstar Games and Take-Two Interactive.

---

**Happy Hunting! 🚗💨**
