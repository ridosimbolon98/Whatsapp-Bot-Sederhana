# Whatsapp API Tutorial

Hi, this is the implementation example of <a href="https://github.com/pedroslopez/whatsapp-web.js">whatsapp-web.js</a>

Watch the tutorials:

- run `npm update whatsapp-web.js`
- run `apt-get update`
- run `sudo apt install -y gconf-service libgbm-dev libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget`
- run `npm install pm2 -g`

## Important thing!

As because Whatsapp regularly makes an update, so we needs to always **use the latest version of whatsapp-web.js**. Some errors may occurs with the old versions, so please try to update the library version before creating an issue.

### How to use?

- Clone or download this repo
- Enter to the project directory
- Run `npm install`
- Run `npm run start:dev`, or
- Run `pm2 start app.js --name "wabot"`
- Open browser and go to address `http://localhost:8000`
- Scan the QR Code
- Enjoy!

### Send message to contact

You can send the message to any contact by using `nomor` and message `pesan`
**Paramaters:**

- `nomor`: 08*********
- `pesan`: the message

Content-Type: application/json <br>
`Method`: POST <br>
Here the endpoint: `/kirim_pesan` <br> <br>

``` js
POST http://localhost:8000/kirim_pesan
Content-Type: application/json

{
  "nomor": "0812345687",
  "pesan": "Tes Pesan"
}
```
### Send media to contact

You can send the media to any contact by using `nomor` `url` and caption `caption`
**Paramaters:**

- `nomor`: "08*********",
- `url`: "https://cdn.pixabay.com/photo/2016/03/02/13/59/bird-1232416__340.png",
- `caption`: "Ini adalah caption"

Content-Type: application/json <br>
`Method`: POST <br>
Here the endpoint: `/kirim_gambar` <br> <br>

```
POST http://localhost:8000/kirim_gambar
Content-Type: application/json

{
  "nomor": "0812345687",
  "url": "https://cdn.pixabay.com/photo/2016/03/02/13/59/bird-1232416__340.png",
  "caption": "Tes Caption"
}
```

