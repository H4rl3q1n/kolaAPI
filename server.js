const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mariadb = require('mariadb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express()
.use(cors());

const pool = mariadb.createPool({
    host     : 'acvl-clouver02.procom.intern',
    user     : 'kola',
    password : 'P1l0t3n!',
    database : 'kolatest'
});

app.use(bodyParser.json());

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM users WHERE username = ?', [username]);
    const saltRounds = 10;

    if (rows.length === 0) {
      return res.status(400).send('Invalid credentials');
    }

    const user = rows[0];   
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).send('Invalid credentials');
    }

    const token = jwt.sign({ id: user.id }, 'yourSecretKey', { expiresIn: '1h' });
    console.log("token raw: ", token);
    res.json({ token });
    conn.end();
  } catch (err) {
    res.status(500).send('Server error');
  }
});


app.post('/api/questionaire', async(req, res) =>{
  console.log("received");
  const data = req.body;
  console.log("Data", data);

  try{
    //console.log("Firmendaten", data["firma"]);
    const conn = await pool.getConnection();
    //console.log("Trage Firma ein");
    const firma = await conn.query(`INSERT IGNORE INTO Firma (Name, \`Straße\`, Stadt, Postleitzahl, Kurzbeschreibung, Webseite) VALUES ('`+data["firma"]["Name"]+`','`+data["firma"]["Straße"]+`','`+data["firma"]["Stadt"]+`','`+data["firma"]["Postleitzahl"]+`','`+data["firma"]["Kurzbeschreibung"]+`','`+data["firma"]["Webseite"]+`')`);
    //console.log("Trage Ansprechpartner ein");

    const ansprechpartner = await conn.query(`INSERT IGNORE INTO Ansprechpartner (Firmenname, Vorname, Nachname, \`E-Mail\`, Telefon) VALUES ('`+data["firma"]["Name"]+`','`+data["ansprechpartner"]["Vorname"]+`','`+data["ansprechpartner"]["Nachname"]+`','`+data["ansprechpartner"]["E-mail"]+`','`+data["ansprechpartner"]["Telefon"]+`')`);
    
    //console.log("Trage Laserverfahren ein");

    data["verfahrenListe"].forEach(async( verfahren)=>{
      
      //console.log("Füge neue Verfahrensgruppe ein");

          
            if(verfahren["Verfahrensgruppe"] === "andere"){
              const material = await conn.query(`INSERT IGNORE INTO \`Verfahrensgruppe\` (\`Name\`) VALUES ('`+verfahren["Verfahrensgruppe_New"]+`')`);
            }
            console.log("Prüfe auf neues Laserverfahren", verfahren["LaserverfahrenName"]);

            if(verfahren["LaserverfahrenName"] === "anderes"){
              console.log("Neues Laserverfahren gefunden");
              console.log("Füge ein: " + verfahren["Laserverfahren_New"],","+verfahren["Laserverfahren_Comment"]+","+verfahren["Verfahrensgruppe"]);
              if(verfahren["Verfahrensgruppe"] === "andere"){
                const laser = await conn.query(`INSERT IGNORE INTO Prozesskategorie (Name, Beschreibung, Verfahrensgruppe) VALUES ('`+verfahren["Laserverfahren_New"]+`', '`+verfahren["Laserverfahren_Comment"]+`', '`+verfahren["Verfahrensgruppe_New"]+`')`);
              }else{
                const laser = await conn.query(`INSERT IGNORE INTO Prozesskategorie (Name, Beschreibung, Verfahrensgruppe) VALUES ('`+verfahren["Laserverfahren_New"]+`', '`+verfahren["Laserverfahren_Comment"]+`', '`+verfahren["Verfahrensgruppe"]+`')`);

              }
            }
      
      //console.log("Prüfe auf neues Material");

        for(const werkstoff in verfahren["Werkstoff"]["Werkstoff"]){
         // console.log("WERKSTOFF", werkstoff);
          if(werkstoff==="Andere"){
            //console.log("Neues Material gefunden: ", verfahren["Werkstoff"]["Werkstoff_Other"]);
            const material = await conn.query(`INSERT IGNORE INTO Material (Name) VALUES ('`+verfahren["Werkstoff"]["Werkstoff_Other"]+`')`);
          }
        }
        //console.log("Füge Lasertyp ein");

          for(const type in verfahren["VerfahrenLaserTypen"]){
            if(type === "Sonstige"){
              const material = await conn.query(`INSERT IGNORE INTO \`Lasertyp\` (\`Name\`) VALUES ('`+verfahren["VerfahrenLaserTypenOther"]+`')`);
            }
          }
        //console.log("Prüfe auf neuen Materialzustand");
        for(const state in verfahren["Werkstoff"]["Werkstoff_State"]){
          if(state === "Sonstige"){
            const materialzustand = await conn.query(`INSERT IGNORE INTO Materialzustand (Name) VALUES ('`+verfahren["Werkstoff"]["Werkstoff_State_Other"]+`')`);
          }
        }
  

      //console.log("Prüfe auf neues Gas");
        for(const gas in verfahren["VerfahrenGas"]){
          if(gas === "Sonstige"){
            const schutzgas = await conn.query(`INSERT IGNORE INTO Schutzgas (Name) VALUES ('`+verfahren["VerfahrenGasOther"]+`')`);
          }
        }
      
      //console.log("Füge Prozesse ein");

        
          //console.log("Füge Übersicht Bauteile ein");

          Object.keys(verfahren["BauteilComplexity"]).forEach(async (complexity)=>{
            const complex = await conn.query(`INSERT IGNORE INTO \`Übersicht<>Bauteilkomplexität\` (\`Prozess-Eigenname/ Maschine\`, \`Bauteilkomplexität\`) VALUES ('`+verfahren["VerfahrenName"]+`','`+complexity+`')`);
          });
          //console.log("Füge Übersicht Material ein");

          for(const material in verfahren["Werkstoff"]["Werkstoff"]){
            if(material != "Andere"){
              const mat = await conn.query(`INSERT IGNORE INTO \`Übersicht<>Material\` (\`Prozess-Eigenname/ Maschine\`, \`Material\`) VALUES ('`+verfahren["VerfahrenName"]+`','`+material+`')`);
            }else{
              const mat = await conn.query(`INSERT IGNORE INTO \`Übersicht<>Material\` (\`Prozess-Eigenname/ Maschine\`, \`Material\`) VALUES ('`+verfahren["VerfahrenName"]+`','`+verfahren["Werkstoff"]["Werkstoff_Other"]+`')`);
            }
          }

          //console.log("Füge Übersicht Materialzustand ein");

          for(const state in verfahren["Werkstoff"]["Werkstoff_State"]){
            if(state != "Sonstige"){
              const material = await conn.query(`INSERT IGNORE INTO \`Übersicht<>Materialzustand\` (\`Prozess-Eigenname/ Maschine\`, \`Materialzustand\`) VALUES ('`+verfahren["VerfahrenName"]+`','`+state+`')`);
            }else{
              const material = await conn.query(`INSERT IGNORE INTO \`Übersicht<>Materialzustand\` (\`Prozess-Eigenname/ Maschine\`, \`Materialzustand\`) VALUES ('`+verfahren["VerfahrenName"]+`','`+verfahren["Werkstoff"]["Werkstoff_State_Other"]+`')`);
            }
          }

          

          
          //console.log("Füge Übersicht Optik ein");

          const optic = await conn.query(`INSERT IGNORE INTO \`Übersicht<>Optik\` (\`Prozess-Eigenname/ Maschine\`, \`Optik\`) VALUES ('`+verfahren["VerfahrenName"]+`','`+verfahren["VerfahrenOptic"]+`')`);
          //console.log("Füge Übersicht Gas ein");

          for(const gas in verfahren["VerfahrenGas"]){
            if(gas != "Sonstige"){
              const schutzgas = await conn.query(`INSERT IGNORE INTO \`Übersicht<>Schutzgas\` (\`Prozess-Eigenname/ Maschine\`, \`Schutzgas\`) VALUES ('`+verfahren["VerfahrenName"]+`','`+gas+`')`);
            }else{
              const schutzgas = await conn.query(`INSERT IGNORE INTO \`Übersicht<>Schutzgas\` (\`Prozess-Eigenname/ Maschine\`, \`Schutzgas\`) VALUES ('`+verfahren["VerfahrenName"]+`','`+verfahren["VerfahrenGasOther"]+`')`);
            }
          }


          //console.log("Füge Übersicht Strahlquelle ein");

          for(const lasertyp in verfahren["VerfahrenLaserTypen"]){
            if(lasertyp != "Sonstige"){
              const typ = await conn.query(`INSERT IGNORE INTO \`Übersicht<>Strahlquelle\` (\`Prozess-Eigenname/ Maschine\`, \`Lasertyp\`) VALUES ('`+verfahren["VerfahrenName"]+`','`+lasertyp+`')`);
            }else{
              const typ = await conn.query(`INSERT IGNORE INTO \`Übersicht<>Strahlquelle\` (\`Prozess-Eigenname/ Maschine\`, \`Lasertyp\`) VALUES ('`+verfahren["VerfahrenName"]+`','`+verfahren["VerfahrenLaserTypenOther"]+`')`);
            }
          }

          //console.log("Füge nachgelagerte Prozesse ein");

          for(const proz in verfahren["VerfahrenNachgelagert"]){
            if(verfahren["Laserverfahren"] != "anderes"){
              const typ = await conn.query(`INSERT IGNORE INTO \`NachgelagerterProzess\` (\`Prozesskategorie\`, \`Nachgelagerter Prozess\`) VALUES ('`+verfahren["LaserverfahrenName_New"]+`','`+proz+`')`);
            }else{
              const typ = await conn.query(`INSERT IGNORE INTO \`NachgelagerterProzess\` (\`Prozesskategorie\`, \`Nachgelagerter Prozess\`) VALUES ('`+verfahren["LaserverfahrenName"]+`','`+proz+`')`);
            }
          }
          //console.log("Füge Übersicht Prozesse ein");
          if(verfahren["LaserverfahrenName"] === "anderes"){
            const proc = await conn.query(`INSERT IGNORE INTO \`Übersicht\` (\`Prozess-Eigenname/ Maschine\`, Firmenname, Prozesskategorie, \`maximale Bauteillänge\`, \`maximale Bauteilbreite\`, \`maximale Bauteilhöhe\`, \`maximaler Bauteildurchmesser\`, \`erreichbare Fertigungspräzision\`, \`Aufbaurate\`, \`Flächenrate\`, \`Abtragraten\`) VALUES ('`+verfahren["VerfahrenName"]+`','`+data["firma"]["Name"]+`','`+verfahren["Laserverfahren_New"]+`','`+verfahren["BauteilMaxLength"]+`','`+verfahren["BauteilMaxWidth"]+`','`+verfahren["BauteilMaxHeight"]+`','`+verfahren["BauteilMaxRadius"]+`','`+verfahren["BauteilPrecision"]+`','`+verfahren["BauteilAufbaurate"]+`','`+verfahren["BauteilFlaechenrate"]+`','`+verfahren["BauteilAbtragrate"]+`')`);
          }else{
            const proc = await conn.query(`INSERT IGNORE INTO \`Übersicht\` (\`Prozess-Eigenname/ Maschine\`, Firmenname, Prozesskategorie, \`maximale Bauteillänge\`, \`maximale Bauteilbreite\`, \`maximale Bauteilhöhe\`, \`maximaler Bauteildurchmesser\`, \`erreichbare Fertigungspräzision\`, \`Aufbaurate\`, \`Flächenrate\`, \`Abtragraten\`) VALUES ('`+verfahren["VerfahrenName"]+`','`+data["firma"]["Name"]+`','`+verfahren["LaserverfahrenName"]+`','`+verfahren["BauteilMaxLength"]+`','`+verfahren["BauteilMaxWidth"]+`','`+verfahren["BauteilMaxHeight"]+`','`+verfahren["BauteilMaxRadius"]+`','`+verfahren["BauteilPrecision"]+`','`+verfahren["BauteilAufbaurate"]+`','`+verfahren["BauteilFlaechenrate"]+`','`+verfahren["BauteilAbtragrate"]+`')`);
          }

    });
    console.log("Done");

    conn.end();
  }catch(error){
    console.log("error");
  }
  



});

app.get('/api/data', async (req, res) => {
  console.log("Blubb");
  const token = req.headers['authorization'];
  console.log("token", token);

  if (!token) {
    return res.status(401).send('Access denied');
  }

  try {
    const temp = token.split(" ")[1];
    const decoded = jwt.verify(temp, 'yourSecretKey');
    console.log("decoded", decoded);
    const conn = await pool.getConnection();
    const rows = await conn.query(`
    SELECT \`Übersicht\`.\`Prozess-Eigenname/ Maschine\`, 
    \`Übersicht\`.\`Firmenname\`, 
    \`Übersicht\`.\`Prozesskategorie\`, 
    \`Übersicht<>Material\`.\`Material\`, 
    \`Ansprechpartner\`.\`Vorname\`, 
    \`Ansprechpartner\`.\`Nachname\`,
    \`Ansprechpartner\`.\`E-Mail\`,
    \`Ansprechpartner\`.\`Telefon\`,
    \`Firma\`.\`Straße\`,
    \`Firma\`.\`Stadt\`,
    \`Firma\`.\`Postleitzahl\`,
    \`Firma\`.\`Kurzbeschreibung\`,
    \`Firma\`.\`Webseite\`
    FROM Übersicht 
    JOIN \`Übersicht<>Material\`
    ON \`Übersicht\`.\`Prozess-Eigenname/ Maschine\`=\`Übersicht<>Material\`.\`Prozess-Eigenname/ Maschine\`
    JOIN \`Ansprechpartner\` 
    ON \`Übersicht\`.\`Firmenname\`=\`Ansprechpartner\`.\`Firmenname\` 
    JOIN \`Firma\` 
    ON \`Übersicht\`.\`Firmenname\`=\`Firma\`.\`Name\``);
    //const rows = await conn.query('SELECT * from Übersicht');
    console.log("asdfa");
    res.json(rows);
    conn.end();
  } catch (err) {
    res.status(401).send('Invalid token');
  }
});

app.get('/api/detail', async (req, res) => {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(401).send('Access denied');
  }

  try {
    const temp = token.split(" ")[1];
    const decoded = jwt.verify(temp, 'yourSecretKey');
    console.log("Getting Data for Detail");
    const conn = await pool.getConnection();
    const rows = await conn.query(`
    SELECT \`Übersicht\`.\`Prozess-Eigenname/ Maschine\`, 
    \`Übersicht\`.\`Firmenname\`, 
    \`Übersicht\`.\`Prozesskategorie\`,
    \`Übersicht\`.\`maximale Bauteillänge\`, 
    \`Übersicht\`.\`maximale Bauteilbreite\`, 
    \`Übersicht\`.\`maximale Bauteilhöhe\`,
    \`Übersicht\`.\`erreichbare Fertigungspräzision\`, 
    \`Übersicht\`.\`Aufbaurate\`,  
    \`Übersicht\`.\`Flächenrate\`,   
    \`Übersicht\`.\`Abtragraten\`,    
    \`Übersicht<>Material\`.\`Material\`,
    \`Übersicht<>Materialzustand\`.\`Materialzustand\`,
    \`Übersicht<>Optik\`.\`Optik\`,
    \`Übersicht<>Schutzgas\`.\`Schutzgas\`,
    \`Übersicht<>Strahlquelle\`.\`Lasertyp\`,
    \`Prozesskategorie\`.\`Beschreibung\`,
    \`Prozesskategorie\`.\`Verfahrensgruppe\`,
    \`Firma\`.\`Straße\`,
    \`Firma\`.\`Stadt\`,
    \`Firma\`.\`Postleitzahl\`,
    \`Firma\`.\`Kurzbeschreibung\`,
    \`Firma\`.\`Webseite\`,
    \`Übersicht<>Bauteilkomplexität\`.\`Bauteilkomplexität\`
    FROM Übersicht 
    JOIN \`Übersicht<>Material\`
    ON \`Übersicht\`.\`Prozess-Eigenname/ Maschine\`=\`Übersicht<>Material\`.\`Prozess-Eigenname/ Maschine\`
    JOIN \`Firma\` 
    ON \`Übersicht\`.\`Firmenname\`=\`Firma\`.\`Name\`
    JOIN \`Übersicht<>Bauteilkomplexität\`
    ON \`Übersicht\`.\`Prozess-Eigenname/ Maschine\`=\`Übersicht<>Bauteilkomplexität\`.\`Prozess-Eigenname/ Maschine\` 
    JOIN \`Prozesskategorie\`
    ON \`Übersicht\`.\`Prozesskategorie\`=\`Prozesskategorie\`.\`Name\` 
    JOIN \`Übersicht<>Materialzustand\`
    ON \`Übersicht\`.\`Prozess-Eigenname/ Maschine\`=\`Übersicht<>Materialzustand\`.\`Prozess-Eigenname/ Maschine\`
    JOIN \`Übersicht<>Optik\`
    ON \`Übersicht\`.\`Prozess-Eigenname/ Maschine\`=\`Übersicht<>Optik\`.\`Prozess-Eigenname/ Maschine\`
    JOIN \`Übersicht<>Schutzgas\`
    ON \`Übersicht\`.\`Prozess-Eigenname/ Maschine\`=\`Übersicht<>Schutzgas\`.\`Prozess-Eigenname/ Maschine\`
    JOIN \`Übersicht<>Strahlquelle\`
    ON \`Übersicht\`.\`Prozess-Eigenname/ Maschine\`=\`Übersicht<>Strahlquelle\`.\`Prozess-Eigenname/ Maschine\`
    `);
    //const rows = await conn.query('SELECT * from Übersicht');
    console.log("Request for detailed data complete");
    res.json(rows);
    conn.end();
  } catch (err) {
    res.status(401).send('Invalid token');
  }
});

app.get('/api/prozesskette', async (req, res) => {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(401).send('Access denied');
  }

  try {
    const temp = token.split(" ")[1];
    const decoded = jwt.verify(temp, 'yourSecretKey');
    console.log("Getting Data for Detail");
    const conn = await pool.getConnection();
    const rows = await conn.query(`
    SELECT 
    \`Übersicht\`.\`Firmenname\`, 
    \`Übersicht\`.\`Prozesskategorie\`,
    \`NachgelagerterProzess\`.\`Nachgelagerter Prozess\`
    FROM Übersicht 
    LEFT JOIN \`NachgelagerterProzess\`
    ON \`Übersicht\`.\`Prozesskategorie\`=\`NachgelagerterProzess\`.\`Prozesskategorie\`
    `);
    //const rows = await conn.query('SELECT * from Übersicht');
    console.log("Request for detailed data complete");
    res.json(rows);
    conn.end();
  } catch (err) {
    res.status(401).send('Invalid token');
  }
});


app.get('/api/prozesskategorien', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const rows = await conn.query(`
    SELECT 
    Name, Beschreibung, \`Suchbegriffe / Alternativnamen\`
    FROM Prozesskategorie 
    `);
    //const rows = await conn.query('SELECT * from Übersicht');
    res.json(rows);
    conn.end();
  } catch (err) {
    res.status(401).send('Invalid token');
  }
});

app.get('/api/material', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const rows = await conn.query(`
    SELECT 
    Name
    FROM Material 
    `);
    //const rows = await conn.query('SELECT * from Übersicht');
    res.json(rows);
    conn.end();
  } catch (err) {
    res.status(401).send('Invalid token');
  }
});

app.get('/api/verfahrensgruppe', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const rows = await conn.query(`
    SELECT 
    Name
    FROM Verfahrensgruppe 
    `);
    //const rows = await conn.query('SELECT * from Übersicht');
    res.json(rows);
    conn.end();
  } catch (err) {
    res.status(401).send('Invalid token');
  }
});

app.get('/api/lasertyp', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const rows = await conn.query(`
    SELECT 
    Name
    FROM Lasertyp 
    `);
    //const rows = await conn.query('SELECT * from Übersicht');
    res.json(rows);
    conn.end();
  } catch (err) {
    res.status(401).send('Invalid token');
  }
});

app.get('/api/materialzustand', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const rows = await conn.query(`
    SELECT 
    Name
    FROM Materialzustand 
    `);
    //const rows = await conn.query('SELECT * from Übersicht');
    res.json(rows);
    conn.end();
  } catch (err) {
    res.status(401).send('Invalid token');
  }
});

app.get('/api/bauteilkomplex', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const rows = await conn.query(`
    SELECT 
    Name
    FROM \`Bauteilkomplexität\` 
    `);
    //const rows = await conn.query('SELECT * from Übersicht');
    res.json(rows);
    conn.end();
  } catch (err) {
    res.status(401).send('Invalid token');
  }
});

app.get('/api/optik', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const rows = await conn.query(`
    SELECT 
    Name
    FROM \`Optik\` 
    `);
    //const rows = await conn.query('SELECT * from Übersicht');
    res.json(rows);
    conn.end();
  } catch (err) {
    res.status(401).send('Invalid token');
  }
});

app.get('/api/lasermodus', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const rows = await conn.query(`
    SELECT 
    Name
    FROM \`Lasermodus\` 
    `);
    //const rows = await conn.query('SELECT * from Übersicht');
    res.json(rows);
    conn.end();
  } catch (err) {
    res.status(401).send('Invalid token');
  }
});

app.get('/api/intensity', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const rows = await conn.query(`
    SELECT 
    Name
    FROM \`Intensitätsverteilung\` 
    `);
    //const rows = await conn.query('SELECT * from Übersicht');
    res.json(rows);
    conn.end();
  } catch (err) {
    res.status(401).send('Invalid token');
  }
});

app.get('/api/schutzgas', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const rows = await conn.query(`
    SELECT 
    Name
    FROM \`Schutzgas\` 
    `);
    //const rows = await conn.query('SELECT * from Übersicht');
    res.json(rows);
    conn.end();
  } catch (err) {
    res.status(401).send('Invalid token');
  }
});

app.get('/api/ansprechpartner', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const rows = await conn.query(`
    SELECT 
    column_name
    FROM information_schema.COLUMNS
    WHERE table_schema=DATABASE()
    AND TABLE_NAME='Ansprechpartner' 
    `);
    //const rows = await conn.query('SELECT * from Übersicht');
    res.json(rows);
    conn.end();
  } catch (err) {
    res.status(401).send('Invalid token');
  }
});

app.get('/api/firma', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const rows = await conn.query(`
    SELECT 
    column_name
    FROM information_schema.COLUMNS
    WHERE table_schema=DATABASE()
    AND TABLE_NAME='Firma' 
    `);
    //const rows = await conn.query('SELECT * from Übersicht');
    res.json(rows);
    conn.end();
  } catch (err) {
    res.status(401).send('Invalid token');
  }
});


app.listen(3000, () => {
  console.log('Server running on port 3000');
});
