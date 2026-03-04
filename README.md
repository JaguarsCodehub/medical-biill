# Medical Bill Generator

A mobile-first Progressive Web App (PWA) for generating medical bills quickly. Designed for chemists and pharmacies to create bills in 20-30 seconds and share them instantly.

## Features

- **Quick Billing Form**
  - Patient details (name, age, gender, phone, address)
  - Multiple medicine entries with auto-add rows
  - Auto total calculation
  - Bill number auto-increment

- **PDF Generation**
  - Professional bill layout
  - 4 copies on one A4 page
  - Download as PDF

- **Print Support**
  - Direct print from browser
  - Optimized print layout

- **WhatsApp Sharing**
  - Share bill details via WhatsApp
  - Auto-format message
  - Direct link to patient's number

- **PWA Features**
  - Add to Home Screen
  - Offline support
  - Fast loading
  - Mobile responsive

## Quick Start

### Option 1: Using Python (Recommended)

```bash
cd medical-bill-app
python3 -m http.server 8080
```

Then open `http://localhost:8080` in your browser.

### Option 2: Using Node.js

```bash
npx serve medical-bill-app
```

### Option 3: Using PHP

```bash
cd medical-bill-app
php -S localhost:8080
```

### Option 4: Open directly

Simply open `index.html` in your browser. Note: Some PWA features may not work without a server.

## Usage Guide

1. **First Time Setup**
   - Enter your shop/pharmacy details (saved automatically)
   - These will be remembered for future bills

2. **Creating a Bill**
   - Enter patient name (required)
   - Add patient details (age, gender, phone, address)
   - Add medicine entries
   - Press Enter or Tab to quickly move between fields
   - Total is calculated automatically

3. **Actions**
   - **PDF**: Generate and download PDF with 4 copies
   - **Print**: Open print dialog
   - **WhatsApp**: Share bill via WhatsApp
   - **Clear**: Reset form for new bill

4. **Keyboard Shortcuts**
   - Enter on medicine name → Jump to quantity
   - Enter on quantity → Jump to amount
   - Enter on amount → Add new row (if last row) or move to next row

## Installing on Mobile

### Android
1. Open the app in Chrome
2. Tap the menu (⋮) and select "Add to Home Screen"
3. Or tap the install prompt when it appears

### iPhone/iPad
1. Open the app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"

## File Structure

```
medical-bill-app/
├── index.html          # Main HTML file
├── styles.css          # All styles
├── app.js              # Application logic
├── manifest.json       # PWA manifest
├── sw.js               # Service worker for offline support
├── icons/
│   └── icon.svg        # App icon
└── README.md           # This file
```

## Customization

### Changing Shop Details
Shop details are stored in localStorage and persist across sessions. To change:
1. Edit the fields in the "Shop Details" section
2. Changes are saved automatically

### Styling
Edit `styles.css` to customize:
- Colors (CSS variables at the top)
- Font sizes
- Spacing
- Bill layout

### Bill Layout
Edit the `generateBillHTML()` function in `app.js` to modify:
- Bill template
- Fields displayed
- Footer text

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Samsung Internet

## Troubleshooting

### PDF not generating
- Ensure you're connected to the internet (first time only, for loading libraries)
- Try refreshing the page
- Check browser console for errors

### WhatsApp not opening
- Ensure WhatsApp is installed on your device
- Check if phone number format is correct (10 digits)

### Print layout issues
- Use Chrome for best print results
- Enable "Background graphics" in print settings

## License

Free to use for personal and commercial purposes.

## Support

For issues or feature requests, please contact the developer.
