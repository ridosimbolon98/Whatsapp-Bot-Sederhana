const { Client, MessageMedia, LocalAuth, Buttons, List } = require('whatsapp-web.js');
const bcrypt = require("bcrypt");
let CryptoJS = require("crypto-js");
const express = require('express');
const { body, validationResult } = require('express-validator');
const socketIO = require('socket.io');
const qrcode = require('qrcode');
const http = require('http');
const fs = require('fs');
const { phoneNumberFormatter, phoneNumberReformatter } = require('./helpers/formatter');
const fileUpload = require('express-fileupload');
const axios = require('axios');
const mime = require('mime-types');
const bodyParser = require("body-parser");
const db = require('./queries');
const translate = require('translate');

const port = process.env.PORT || 8000;
const host = process.env.HOST || '192.168.10.30';

const app = express();
const server = http.createServer(app);
const io = socketIO(server);


app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

app.use(fileUpload({
  debug: false
}));

app.get('/', (req, res) => {
  res.sendFile('index.html', {
    root: __dirname
  });
});



const client = new Client({
  restartOnAuthFail: true,
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process', 
      '--disable-gpu'
    ],
  },
  authStrategy: new LocalAuth()
});




let kamus1 = fs.readFileSync('./data.json');
let kamus  = JSON.parse(kamus1);

client.on('ready', () => {
  // client.getChats().then((chats) => {
  //   myGroup = chats.find((chat) => chat.name === 'Mediakreasiid');
    
  //   const kategoriList = new List(
  //     "Kategori Keluhan:",
  //     "DAFTAR KATEGORI KELUHAN:",
  //     [
  //       {
  //         title: "Daftar Kategori Keluhan",
  //         rows: [
  //           { id: "hardware", title: "hardware" },
  //           { id: "software", title: "software" },
  //           { id: "jaringan", title: "jaringan" },
  //         ],
  //       },
  //     ],
  //     "Silakan dipilih"
  //   );
  //   client.sendMessage(myGroup.id._serialized, kategoriList);
  // });
});

client.on('message', async msg => {
  const d = new Date(); // today, now
  const options_dt = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

  // Timezone zero UTC offset
  let periode = d.toISOString().slice(0, 7) // YYYY-MM-DD 

  if (msg.body.toLowerCase() == 'jadwal'){
    let id_user = phoneNumberReformatter(msg.from);
    let jadwal = await db.getDataJadwalPerUser(periode,id_user);

    if (jadwal.rows.length <= 0) {
      let pesan = `Halo, *${msg._data.notifyName}*. Mohon maaf nomor whatsapp Anda belum terdaftar di sistem Audit 5R. Perihal informasi Jadwal audit anda, silakan hubungi Koordinator Anda. \n\nTerima kasih.`;
      client.sendMessage(msg.from, pesan);
    } else {
      // header msg
      let mssg1   = "Halo, *" + jadwal.rows[0].nama + "*. Berikut *UCOK* informasikan jadwal Audit anda:";
      client.sendMessage(msg.from, mssg1);
  
      let itr=0;
      let adtie = '';
      while(itr < jadwal.rows.length) {
        adtie = '';
        // ambil data auditor
        let adties = await db.getDataAuditieBySection(jadwal.rows[itr].auditee);
            
        adties.rows.forEach(adt => {
          adtie += adt.area_dept+', ';
        });
  
        let mssg   = "*JADWAL KE-"+(itr+1)+"*\nSection: *"+ adties.rows[0].section +"* ("+ adtie +").\nPada: *" + jadwal.rows[itr].tgl_waktu.toLocaleDateString('id-ID', options_dt) + "*.";
  
        client.sendMessage(msg.from, mssg);
  
        itr++;
      }
  
      let mssg2 = "Mohon untuk melakukan audit bersama dengan  masing-masing tim auditor pada jadwal tersebut menggunakan akun koordinator masing-masing. Terima kasih.\n\nKetik: help \nuntuk menampilkan list bantuan yang bisa saya solusikan.";
      client.sendMessage(msg.from, mssg2);
    }


  } else if (msg.body.toLowerCase() == 'section') {
    const number = msg.from;
    const file = MessageMedia.fromFilePath('./section.jpeg');
    const media = new MessageMedia(file.mimetype, file.data.toString('base64'), file.name);
    const caption = 'Data Mapping Auditie per Section';

    client.sendMessage(number, media, {
      caption: caption
    }).then(response => {
      console.log('berhasil');
    }).catch(err => {
      console.log(err);
    });
  } else if(msg.body.toLowerCase() == 'info akun'){
    let no_wa = phoneNumberReformatter(msg.from);
    let user = await db.getUserTemp(no_wa);
    const password = user.rows[0].password;
    // Decrypt
    var bytes  = CryptoJS.AES.decrypt(password, key);
    var passDecrypt = bytes.toString(CryptoJS.enc.Utf8);
    let userInfo = `Informasi User Akun:\n=======================\nUsername: ${user.rows[0].username}\nPassword: ${passDecrypt}\n\n*NB*: Pastikan username dan password tidak diinformasikan ke pada pihak yang tidak berwenang. Terima kasih.`;
    client.sendMessage(msg.from, userInfo).then(response => {
      console.log('berhasil');
    }).catch(err => {
      console.log(err);
    });
  } else {
    for (let index = 0; index < kamus.data_bot.length; index++) {
      if (msg.body.toLowerCase() == kamus.data_bot[index].perintah) {
        msg.reply(kamus.data_bot[index].jawaban);
        if (kamus.data_bot[index].task.length > 0) {
          const helpList = new List(
            "Bantuan Pengguna Audit 5R:",
            "DAFTAR BANTUAN:",
            [
              {
                title: "Daftar Bantuan",
                rows: kamus.data_bot[index].task,
              },
            ],
            "Silakan dipilih"
          );
          msg.reply(helpList);
        }
      } else {
        continue;
      }
    }
  }  
});

client.initialize();

// Socket IO
io.on('connection', function(socket) {
  socket.emit('message', 'Connecting...');

  client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.toDataURL(qr, (err, url) => {
      socket.emit('qr', url);
      socket.emit('message', 'QR Code received, scan please!');
    });
  });

  client.on('ready', () => {
    socket.emit('ready', 'Whatsapp is ready!');
    socket.emit('message', 'Whatsapp is ready!');
  });

  client.on('authenticated', () => {
    socket.emit('authenticated', 'Whatsapp is authenticated!');
    socket.emit('message', 'Whatsapp is authenticated!');
    console.log('AUTHENTICATED');
  });

  client.on('auth_failure', function(session) {
    socket.emit('message', 'Auth failure, restarting...');
  });

  client.on('disconnected', (reason) => {
    socket.emit('message', 'Whatsapp is disconnected!');
    client.destroy();
    client.initialize();
  });
});


const checkRegisteredNumber = async function(number) {
  const isRegistered = await client.isRegisteredUser(number);
  return isRegistered;
}


// setting key
const key = 'asdoiownfoiwsneorwqebsouebr2985ysdnf384tg48273ebf48375';
app.post('/user', async(req, res) => {
  // protected data
  const password = req.body.password;

  // Encrypt
  var ciphertext = CryptoJS.AES.encrypt(password, key).toString();
  
  await db.updatePasswordUser(ciphertext, req.body.username).then(response => {
    res.status(200).json({
      status: true,
      response: response
    });
  }).catch(err => {
    res.status(500).json({
      status: false,
      response: err
    });
  });
  console.log("Encrypted message: " + ciphertext);

});

app.post('/get-user', async (req, res) => {
  let user = await db.getUserTemp(req.body.username);
  const password = user.rows[0].password;
  // Decrypt
  var bytes  = CryptoJS.AES.decrypt(password, key);
  var originalText = bytes.toString(CryptoJS.enc.Utf8);
  console.log("Decrypted message: " + originalText);

  return originalText;
});

app.get('/kirim-pesan', (req, res) => {
  const helpList = new List(
    "Bantuan Pengguna Audit 5R:",
    "DAFTAR BANTUAN:",
    [
      {
        title: "Daftar Bantuan",
        rows: [
          { "id": "panduan", "title": "panduan" },
          { "id": "tentang", "title": "tentang" },
          { "id": "jadwal", "title": "jadwal" },
          { "id": "section", "title": "section" }
        ]
      },
    ],
    "Silakan dipilih"
  );
  client.sendMessage('6281227777980@c.us', helpList);
});

// Send message
app.get('/send-jadwal', async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped()
    });
  }

  const d = new Date(); // today, now
  const options_dt = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

  // Timezone zero UTC offset
  let periode = d.toISOString().slice(0, 7) // YYYY-MM-DD 

  var data_wa   = await db.getDataWA(periode,'USER');
  let iter=0;
  const helpList = new List(
    "Bantuan Pengguna Audit 5R:",
    "DAFTAR BANTUAN:",
    [
      {
        title: "Daftar Bantuan",
        rows: [
            { "id": "panduan", "title": "panduan" },
            { "id": "tentang", "title": "tentang" },
            { "id": "jadwal", "title": "jadwal" }
        ]
      },
    ],
    "Silakan dipilih"
  );
  
  let auditie = '';
  let tim ='';
  while (iter < data_wa.rows.length) {
    auditie = '';
    tim ='';
    // ambil data auditor
    let audities = await db.getDataAuditieBySection(data_wa.rows[iter].auditee);
        
    audities.rows.forEach(adt => {
      auditie += adt.area_dept+', ';
    });

    console.log(auditie);

    tim += JSON.parse(data_wa.rows[iter].anggota_auditor);

    let number    = phoneNumberFormatter(data_wa.rows[iter].no_wa);
    let message   = "Halo, *" + data_wa.rows[iter].nama + "*. *UCOK* mengingatkan anda untuk melakukan audit di:\nSection: *"+ audities.rows[0].section +"* ("+ auditie +").\nPada: *" + data_wa.rows[iter].tgl_waktu.toLocaleDateString('id-ID', options_dt) + "*, dengan \nTim auditor: *"+ tim +"*. \n\nMohon untuk melakukan audit bersama dengan  masing-masing tim auditor pada jadwal tersebut menggunakan akun koordinator masing-masing. Terima kasih.\n\n*NB:* ketik *help* untuk menampilkan list bantuan yang bisa saya solusikan.";

    client.sendMessage(number, message);
    client.sendMessage(number, helpList);
    iter++;
  }
  return res.status(200).json({
    status: true
  });
});

// Send media
app.post('/send-media', async (req, res) => {
  const number = phoneNumberFormatter(req.body.number);
  const caption = req.body.caption;
  const fileUrl = req.body.file;

  // const media = MessageMedia.fromFilePath('./image-example.png');
  // const file  = req.files.file;
  // const media = new MessageMedia(file.mimetype, file.data.toString('base64'), file.name);
  let mimetype;
  const attachment = await axios.get(fileUrl, {
    responseType: 'arraybuffer'
  }).then(response => {
    mimetype = response.headers['content-type'];
    return response.data.toString('base64');
  });

  const media = new MessageMedia(mimetype, attachment, 'Media');

  client.sendMessage(number, media, {
    caption: caption
  }).then(response => {
    res.status(200).json({
      status: true,
      response: response
    });
  }).catch(err => {
    res.status(500).json({
      status: false,
      response: err
    });
  });
});

const findGroupByName = async function(name) {
  const group = await client.getChats().then(chats => {
    return chats.find(chat => 
      chat.isGroup && chat.name.toLowerCase() == name.toLowerCase()
    );
  });
  return group;
}

// Send message to group
// You can use chatID or group name, yea!
app.post('/send-group-message', [
  body('id').custom((value, { req }) => {
    if (!value && !req.body.name) {
      throw new Error('Invalid value, you can use `id` or `name`');
    }
    return true;
  }),
  body('message').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped()
    });
  }

  let chatId = req.body.id;
  const groupName = req.body.name;
  const message = req.body.message;

  // Find the group by name
  if (!chatId) {
    const group = await findGroupByName(groupName);
    if (!group) {
      return res.status(422).json({
        status: false,
        message: 'No group found with name: ' + groupName
      });
    }
    chatId = group.id._serialized;
  }

  client.sendMessage(chatId, message).then(response => {
    res.status(200).json({
      status: true,
      response: response
    });
  }).catch(err => {
    res.status(500).json({
      status: false,
      response: err
    });
  });
});

// ambil kirim data daily ke group
app.post('/send-notif', async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped()
    });
  }

  // ambil data daily dari databaase
  var daily       = await db.getDataDaily('description','sc_wa.wasent');

  // data yang akan di kirim ke wa bot
  let chatId      = req.body.id;
  const groupName = 'Mediakreasiid';
  const message   = daily;

  // Find the group by name
  if (!chatId) {
    const group = await findGroupByName(groupName);
    if (!group) {
      return res.status(422).json({
        status: false,
        message: 'No group found with name: ' + groupName
      });
    }
    chatId = group.id._serialized;
  }

  client.sendMessage(chatId, message).then(response => {
    res.status(200).json({
      status: true,
      response: response
    });
  }).catch(err => {
    res.status(500).json({
      status: false,
      response: err
    });
  });
});

// Clearing message on spesific chat
app.post('/clear-message', [
  body('number').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped()
    });
  }

  const number = phoneNumberFormatter(req.body.number);

  const isRegisteredNumber = await checkRegisteredNumber(number);

  if (!isRegisteredNumber) {
    return res.status(422).json({
      status: false,
      message: 'The number is not registered'
    });
  }

  const chat = await client.getChatById(number);
  
  chat.clearMessages().then(status => {
    res.status(200).json({
      status: true,
      response: status
    });
  }).catch(err => {
    res.status(500).json({
      status: false,
      response: err
    });
  })
});

app.get('/get-msg', (req,res) => {
  let data_msg;
  client
  .getChats()
  .then(chats => chats.find((chat) => chat.name === 'Mediakreasiid').fetchMessages())
  .then(messages => {
    data_msg = res.status(200).json({
      status:true,
      response: messages
    });
    return data_msg;
  });
});

// looping message
app.get('/reminder', async (req, res) => {
  const number = '6282226964001@c.us';
  // const number = '6285292133150@c.us';
  const msg    = '*REMINDER* \n\nJangan lupa untuk mengirim scan file *BSO ASTINET* ke POS hari ini pukul 15.00 WIB.';
  let iter = 0;
  while (iter < 9) {
    client.sendMessage(number, msg);
    iter++;
  }
});

// send ranking data audit
app.get('/ranking/:periode/:area', async (req,res) => {
  const periode = req.params.periode;
  const area = req.params.area;
  // ambil data ranking berdasarkan periode
  let ranking = await db.getRanking(periode,area);
  let data = ranking.rows;
  let msg = '';
  data.forEach(rank => {
    console.log(rank);
    msg += '- ' + rank.area_dept + ' : ranking ' + rank.row_number + ' dari ' + data.length + '\n';
  });

  // ambil data wa tipe USER dari databaase
  let wa = await db.getAllWa();
  console.log(wa.rows);
  

  let iter = 0;
  let header = "*DATA RANKING AUDIT 5R "+ area +" PERIODE "+periode+"*\n===================================================\n\n";
  let pesan = header + msg;
  console.log(pesan);
  while (iter < wa.rows.length) {
    let number = phoneNumberFormatter(wa.rows[iter].no_wa);
    console.log(number);
    console.log(pesan);
    client.sendMessage(number, pesan);
    console.log("berhasil kirim botif ranking ke, "+number);
    iter++;
  }
});

// const setup = '1 * * * * *';
// cron.schedule(setup, async () => {
//     console.log('menjalakan fungsi setiap detik 1');
    
//     if (data_notif.rowCount === 0 ) {
//         console.log('data kosong');
//     } else {
//         // console.log(data_notif.rows);
//         for (let index = 0; index < data_notif.rows.length; index++) {
//             let nomor = data_notif.rows[index].no_wa;
//             let msg = `*NOTIFIKASI ${data_notif.rows[index].tipe_trx}*\n====================\n\nHalo auditor ${data_notif.rows[index].user}.\n` + data_notif.rows[index].deskripsi;

//             // kirim pesan notif ke wa auditor
//             sendNotif(nomor, msg);

//             // lakukan update data
//             const update = db.updateDataNotif('s_wa.tb_notif', data_notif.rows[index].id);
//             if (!update) {
//                 console.log('gagal update');
//             }
//         }
//     }
// });

server.listen(port, function() {
  console.log('App running on *: ' + port);
});
