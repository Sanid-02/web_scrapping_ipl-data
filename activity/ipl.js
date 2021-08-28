let request = require("request");
let cheerio = require("cheerio");
let fs = require("fs");
let path = require("path");

let link = "https://www.espncricinfo.com/series/ipl-2020-21-1210595";

request(link, cb);
function cb(error, response, html) {
  if (error) {
    console.log(error);
  } else if (response.statusCode === 404) {
    console.log("Page Not Found");
  } else {
    console.log("Extracting Results Link");
    getLink(html);
  }
}

function getLink(html) {
  let searchTool = cheerio.load(html);
  let url1 = searchTool('a[data-hover="View All Results"]');
  let url2 = searchTool(url1).attr("href");
  let fullUrl = `https://www.espncricinfo.com${url2}`;
  //   console.log(fullUrl);
  request(fullUrl, cburl);
}

function cburl(error, response, html) {
  if (error) {
    console.log(error);
  } else if (response.statusCode === 404) {
    console.log("Page Not Found");
  } else {
    console.log("Extracting ScoreCard Links");
    getScoreCardLinks(html);
  }
}

function getScoreCardLinks(html) {
  let searchTool = cheerio.load(html);
  let array = searchTool('a[data-hover="Scorecard"]');
  for (let i = 0; i < array.length; i++) {
    let urls = searchTool(array[i]).attr("href");
    let scoreCardUrls = `https://www.espncricinfo.com${urls}`;
    console.log(scoreCardUrls);
    request(scoreCardUrls, cbsc);
  }
}

function cbsc(error, response, html) {
  if (error) {
    console.log(error);
  } else if (response.statusCode === 404) {
    console.log("Page Not Found");
  } else {
    console.log("Extracting Batting Data");
    getBattingData(html);
  }
}

function getBattingData(html) {
  let searchTool = cheerio.load(html);
  let teamsName = searchTool(".name-link p");
  let batData = searchTool(".table.batsman");
  for (let i = 0; i < batData.length; i++) {
    let data = searchTool(batData[i]).find("tbody tr");
    let t_name = searchTool(teamsName[i]).text().trim();
    console.log(t_name);
    for (let j = 0; j < data.length; j += 2) {
      let col = searchTool(data[j]).find("td");
      let isBatsManRow = searchTool(col[0]).hasClass("batsman-cell");
      if (isBatsManRow == true) {
        let pName = searchTool(col[0]).text().trim();
        let pRun = searchTool(col[2]).text().trim();
        let pBall = searchTool(col[3]).text().trim();
        let pFour = searchTool(col[5]).text().trim();
        let pSix = searchTool(col[6]).text().trim();
        let pStrike = searchTool(col[7]).text().trim();
        console.log(
          pName +
            " " +
            pRun +
            " " +
            pBall +
            " " +
            pFour +
            " " +
            pSix +
            " " +
            pStrike
        );

        fillDir(t_name, pName, pRun, pBall, pFour, pSix, pStrike);
      }
    }
  }
}

function fillDir(t_name, pName, pRun, pBall, pFour, pSix, pStrike) {
  let m_Folder = path.join(__dirname, "ipl");
  if (!fs.existsSync(m_Folder)) {
    console.log("folder not present");
    fs.mkdirSync(m_Folder);
  }
  let t_path = path.join(m_Folder, t_name);
  if (!fs.existsSync(t_path)) {
    fs.mkdirSync(t_path);
  }
  let p_path = path.join(t_path, pName + ".xlsx");
  let p_Data = [];
  let p_obj = {
    t_name,
    pName,
    pRun,
    pBall,
    pFour,
    pSix,
    pStrike,
  };

  if (!fs.existsSync(p_path)) {
    p_Data.push(p_obj);
  } else {
    p_Data = excelReader(p_path, pName);
    p_Data.push(p_obj);
  }
  excelWriter(p_path, p_Data, pName);
}

function excelWriter(filePath, json, sheetName) {
  // workbook create
  let newWB = xlsx.utils.book_new();
  // worksheet
  let newWS = xlsx.utils.json_to_sheet(json);
  xlsx.utils.book_append_sheet(newWB, newWS, sheetName);
  // excel file create
  xlsx.writeFile(newWB, filePath);
}

// // json data -> excel format convert
// // -> newwb , ws , sheet name
// // filePath
// read
//  workbook get

function excelReader(filePath, sheetName) {
  // player workbook
  let wb = xlsx.readFile(filePath);
  // get data from a particular sheet in that wb
  let excelData = wb.Sheets[sheetName];
  // sheet to json
  let ans = xlsx.utils.sheet_to_json(excelData);
  return ans;
}
