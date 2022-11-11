# Whatsapp API Tutorial

Hi, this is the implementation example of <a href="https://github.com/pedroslopez/whatsapp-web.js">whatsapp-web.js</a>

Watch the tutorials:

- run `npm update whatsapp-web.js`
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

Content-Type: application/json
`Method`: POST
Here the endpoint: `/kirim_pesan`

### Send media to contact

You can send the media to any contact by using `nomor` `url` and caption `caption`
**Paramaters:**

- `nomor`: "08*********",
- `url`: "https://cdn.pixabay.com/photo/2016/03/02/13/59/bird-1232416__340.png",
- `caption`: "Ini adalah caption"

Content-Type: application/json
`Method`: POST
Here the endpoint: `/kirim_gambar`


