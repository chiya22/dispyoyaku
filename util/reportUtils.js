// const { getYoubi } = require('./common'); // getYoubi is used in reportService.js

/**
 * 会議室名から対象行数を返却する
 * This is the version from the original routes/dlriyoustatus.js
 * @param {*} roomName 
 * @returns {number|null} returns row number (1-indexed based on visual Excel rows) or null
 */
function getRowNumByRoomname(roomName) {
  // Note: The original function implies these are direct row numbers.
  // ExcelJS usually uses 1-indexed rows.
  // The original code added +1 to this result, e.g. `row = getRowNumByRoomname(roomName)+1`
  // This means this function should return the number that, after adding 1, becomes the target Excel row.
  // So, if '会議室500' is on Excel row 6, this should return 5.
  if (roomName === '会議室500') {
    return 5;
  } else if (roomName === '会議室501') {
    return 7;
  } else if (roomName === '会議室502') {
    return 9;
  } else if (roomName === '会議室503') {
    return 11;
  } else if (roomName === '会議室504') {
    return 13;
  } else if (roomName === '会議室505') {
    return 15;
  } else if (roomName === '会議室506') {
    return 17;
  } else if (roomName === '会議室507') {
    return 19;
  } else if (roomName === '会議室401') {
    return 22;
  } else if (roomName === '会議室402') {
    return 24;
  } else if (roomName === 'ミーティングR001') {
    return 27;
  } else if (roomName === 'ミーティングR002') {
    return 29;
  } else if (roomName === 'ミーティングR003') {
    return 31;
  } else if (roomName === 'ミーティングR004') {
    return 33;
  } else if (roomName === 'ミーティングR005') {
    return 35;
  } else if (roomName === 'プレゼンＲ') {
    return 37;
  } else if (roomName === 'プロジェクトR011') {
    return 45;
  } else if (roomName === 'プロジェクトR012') {
    return 47;
  } else if (roomName === 'プロジェクトR013') {
    return 49;
  } else if (roomName === 'プロジェクトR014') {
    return 51;
  } else if (roomName === 'プロジェクトR015') {
    return 53;
  }
  console.warn(`Unknown roomName in getRowNumByRoomname: ${roomName}`);
  return null; // Or throw an error, or handle as per application's needs
}

/**
 * R1C!参照方式をA1参照方式に変換
 * This is the version from the original routes/dlriyoustatus.js
 * @param {number} r - row number
 * @param {number} c - column number
 * @returns {string} - A1 format string
 */
function r1c1ToA1(r, c) {
  const columnLetter = (col) => {
      let letter = '';
      while (col > 0) {
          const mod = (col - 1) % 26;
          letter = String.fromCharCode(65 + mod) + letter;
          col = Math.floor((col - mod) / 26);
      }
  return letter;
  };
  return `${columnLetter(c)}${r}`;
}


/**
 * 対象シートの対象行において同じ利用者名が設定されているセルをマージする
 * This is the version from the original routes/dlriyoustatus.js
 * @param {object} worksheet - ExcelJS worksheet object
 * @param {number} row - The target row number to process merges on
 */
function rowMergeProc(worksheet, row) {
  let beforeKey = null;
  let key = null;
  let startCell = ""; // Not actually used for merge in this version, but for logic
  let endCell = "";   // Not actually used for merge in this version
  let startColNum = -1; // To keep track of the starting column number for a merge

  // 1行の処理
  // The original code implies column 3 is '09:00' and column 16 is '22:00'
  // These are 1-indexed column numbers.
  const firstDataColumn = 3; // C
  const lastDataColumn = 16; // P

  for (let col = firstDataColumn; col <= lastDataColumn; col++) {
    key = worksheet.getCell(row, col).value;
    
    if (beforeKey !== key) { // If current cell value is different from the previous one
      if (beforeKey !== null && startColNum !== -1 && (col -1 > startColNum) ) { // If there was a previous value and more than one cell had it
        // Merge the cells for the 'beforeKey'
        //利用者名の上のセル（背景色黒）
        const headStartCellA1 = r1c1ToA1(row - 1, startColNum);
        const headEndCellA1 = r1c1ToA1(row - 1, col - 1);
        worksheet.mergeCells(`${headStartCellA1}:${headEndCellA1}`);
        //利用者名のセル
        const dataStartCellA1 = r1c1ToA1(row, startColNum);
        const dataEndCellA1 = r1c1ToA1(row, col - 1);
        worksheet.mergeCells(`${dataStartCellA1}:${dataEndCellA1}`);
        worksheet.getCell(dataStartCellA1).alignment = { vertical: 'middle', horizontal: 'center' };

      }
      // Reset for the new value
      startColNum = col;
      beforeKey = key;
    }
    
    // Handle the last segment of the row
    if (col === lastDataColumn && beforeKey !== null && startColNum !== -1 && (col >= startColNum)) {
        if (col > startColNum) { // Only merge if more than one cell
            const headStartCellA1 = r1c1ToA1(row - 1, startColNum);
            const headEndCellA1 = r1c1ToA1(row - 1, col);
            worksheet.mergeCells(`${headStartCellA1}:${headEndCellA1}`);
            
            const dataStartCellA1 = r1c1ToA1(row, startColNum);
            const dataEndCellA1 = r1c1ToA1(row, col);
            worksheet.mergeCells(`${dataStartCellA1}:${dataEndCellA1}`);
            worksheet.getCell(dataStartCellA1).alignment = { vertical: 'middle', horizontal: 'center' };
        }
    }
  }
}

module.exports = {
  getRowNumByRoomname,
  r1c1ToA1,
  rowMergeProc,
};
