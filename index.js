const express = require("express");
const NetworkSpeed = require("network-speed"); // ES5
const ping = require("ping");
const testNetworkSpeed = new NetworkSpeed();
const path = require("path");
const { type } = require("os");
const axios = require("axios");
const API_KEY = "a30243bb6649460ab61e3f3f6be3fb07";

const app = express();
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "scources")));

app.get("/", function (req, res) {
  res.render("index", { speed: "" });
});

async function getNetworkDownloadSpeed() {
  const baseUrl = "https://eu.httpbin.org/stream-bytes/500000";
  const fileSizeInBytes = 500000;
  try {
    const speed = await testNetworkSpeed.checkDownloadSpeed(
      baseUrl,
      fileSizeInBytes
    );
    return speed;
  } catch (Error) {
    console.log("error ekak down speed eke: " + Error);
  }
  return speed;
}

async function getNetworkUploadSpeed() {
  const options = {
    hostname: "www.facebook.com",
    port: 80,
    path: "/catchers/544b09b4599c1d0200000289",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  };
  try {
    const fileSizeInBytes = 200000;
    const upspeed = await testNetworkSpeed.checkUploadSpeed(
      options,
      fileSizeInBytes
    );
    return upspeed;
  } catch (Error) {
    console.log("error ekak up speed eke: " + Error);
  }
}

async function getPing() {
  var hosts = ["google.com"];
  var sum = 0;
  var loss = 0;
  try {
    for (let host of hosts) {
      // WARNING: -i 2 argument may not work in other platform like windows
      let res = await ping.promise.probe(host, {
        timeout: 1,
      });

      sum = sum + res.time;
      loss += parseInt(res.packetLoss);
    }

    var avg = sum / hosts.length;
    loss = loss / hosts.length;
    var result = { avg: avg, loss: loss };
    return result;
  } catch (error) {
    console.log("error ekak ping eke: " + error);
    result = { avg: 0, loss: 0 };
    return result;
  }
}

async function getLocation(API_KEY) {
  axios
    .get("https://ipgeolocation.abstractapi.com/v1/?api_key=" + API_KEY)
    .then((response) => {
      // console.log(response.data)
      return response.data;
    })
    .catch((error) => {
      console.log("error in geolocation api: " + error);
    });
}
app.get("/checkspeed", async function (req, res) {
  try {
    let ups = await getNetworkDownloadSpeed();

    let downs = await getNetworkUploadSpeed();

    let ping = await getPing();

    // let locationData = await getLocation(API_KEY);

    let locationData = await axios
      .get("https://ipgeolocation.abstractapi.com/v1/?api_key=" + API_KEY)
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        console.log("error in geolocation api: " + error);
      });

    const data = {
      upspeed: ups.mbps,
      downspeed: downs.mbps,
      ping: ping,
      profile: {
        ip_address: locationData.ip_address,
        isp_name: locationData.connection.isp_name,
      },
      ISP: {
        name: locationData.connection.autonomous_system_organization,
        city: locationData.city,
        region: locationData.region,
        country: locationData.country
      },
      data : locationData
    };
    res.send(data);
  } catch (error) {
    console.log("error ekak /checkspeed eke" + error);
  }
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
