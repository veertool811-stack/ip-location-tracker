# IP Location Tracker (consent/GPS-free version)

यह project visitor की **IP address से approximate location** रिकॉर्ड करता है।
यह GPS location नहीं लेता और browser location permission को bypass नहीं करता।

## Run

```bash
npm install
cp .env.example .env
npm start
```

फिर:
- Dashboard: `http://localhost:5000/`
- Tracking link: `http://localhost:5000/t/demo123`

Production में `.env` में एक मजबूत `ADMIN_KEY` रखें।

## Important

IP geolocation केवल अनुमान देता है और VPN, proxy, mobile networks आदि के कारण गलत हो सकता है।
Production use में privacy notice, retention limits और applicable laws का पालन करें।
