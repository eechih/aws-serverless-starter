import axios from 'axios'
import { EINVOICE_APP_ID, EINVOICE_URL } from './constants'
import { Barcode, Invoice, QRCode } from './types'

/**
 * 解析一維條碼
 * 一維條碼規格，參考 https://www.einvoice.nat.gov.tw/home/DownLoad?fileName=1575448081679_0.pdf
 * @param barcode
 */
export const parseBarcode = (barcode: string): Barcode => {
  if (barcode.length != 19)
    throw new Error('Barcode length should be 19 characters.')

  return {
    invPeriod: barcode.substring(0, 5),
    invNum: barcode.substring(5, 15),
    randomNumber: barcode.substring(15, 19),
  }
}

/**
 * 解析二維條碼
 * 二維條碼規格，參考 https://www.einvoice.nat.gov.tw/home/DownLoad?fileName=1575448081679_0.pdf
 * @param qrcode
 */
export const parseQRCode = (qrcode: string): QRCode => {
  if (qrcode.length < 77)
    throw new Error('QR code length should be at least 77 characters.')

  return {
    invNum: qrcode.substring(0, 10),
    invDate: qrcode.substring(10, 17),
    randomNumber: qrcode.substring(17, 21),
    amount1: qrcode.substring(21, 29),
    amount2: qrcode.substring(29, 37),
    buyerBan: qrcode.substring(37, 45),
    sellerBan: qrcode.substring(45, 53),
    encrypt: qrcode.substring(53, 77),
  }
}

/**
 * 查詢發票表頭
 * API 規格，參考 https://www.einvoice.nat.gov.tw/home/DownLoad?fileName=1510206773173_0.pdf
 * @param params
 */
export const qryInvHeader = async (params: {
  barcode?: string
  qrcode?: string
}): Promise<Invoice> => {
  console.log('qryInvHeader', params)
  const { barcode, qrcode } = params
  if (qrcode && barcode) {
    try {
      return qryInvDetail_QRCode(qrcode)
    } catch (error) {
      return qryInvDetail_Barcode(barcode)
    }
  } else if (qrcode) {
    return qryInvHeader_QRCode(qrcode)
  } else if (barcode) {
    return qryInvHeader_Barcode(barcode)
  } else {
    throw new Error('Provide at least one of barcode or qrcode.')
  }
}

export const qryInvHeader_Barcode = async (
  barcode: string
): Promise<Invoice> => {
  const { invNum } = parseBarcode(barcode)
  console.log('invNum', invNum)
  const response = await axios.request({
    url: `${EINVOICE_URL}/PB2CAPIVAN/invapp/InvApp`,
    method: 'POST',
    params: {
      version: '0.5',
      type: 'Barcode',
      action: 'qryInvHeader',
      invNum: invNum,
      generation: 'V2',
      UUID: '',
      appID: EINVOICE_APP_ID,
    },
  })
  console.log('response', response)
  return response.data
}

export const qryInvHeader_QRCode = async (qrcode: string): Promise<Invoice> => {
  const { invNum } = parseQRCode(qrcode)
  console.log('invNum', invNum)
  const response = await axios.request({
    url: `${EINVOICE_URL}/PB2CAPIVAN/invapp/InvApp`,
    method: 'POST',
    params: {
      version: '0.5',
      type: 'QRCode',
      action: 'qryInvHeader',
      invNum: invNum,
      generation: 'V2',
      UUID: '',
      appID: EINVOICE_APP_ID,
    },
  })
  console.log('response', response)
  return response.data
}

/**
 * 查詢發票明細
 * API 規格，參考 https://www.einvoice.nat.gov.tw/home/DownLoad?fileName=1510206773173_0.pdf
 * @param params
 */
export const qryInvDetail = async (params: {
  barcode?: string
  qrcode?: string
}): Promise<Invoice> => {
  const { barcode, qrcode } = params
  if (qrcode && barcode) {
    try {
      return qryInvDetail_QRCode(qrcode)
    } catch (error) {
      return qryInvDetail_Barcode(barcode)
    }
  } else if (qrcode) {
    return qryInvDetail_QRCode(qrcode)
  } else if (barcode) {
    return qryInvDetail_Barcode(barcode)
  } else throw new Error('Provide at least one of barcode or qrcode.')
}

export const qryInvDetail_Barcode = async (
  barcode: string
): Promise<Invoice> => {
  const { invNum, invPeriod, randomNumber } = parseBarcode(barcode)
  const response = await axios.request({
    url: `${EINVOICE_URL}/PB2CAPIVAN/invapp/InvApp`,
    method: 'POST',
    params: {
      version: '0.6',
      type: 'Barcode',
      invNum: invNum,
      action: 'qryInvDetail',
      generation: 'V2',
      invTerm: invPeriod,
      // invDate: '',
      UUID: '',
      randomNumber: randomNumber,
      appID: EINVOICE_APP_ID,
    },
  })
  return response.data
}

export const qryInvDetail_QRCode = async (qrcode: string): Promise<Invoice> => {
  const { invNum, invDate, encrypt, sellerBan } = parseQRCode(qrcode)
  const response = await axios.request({
    url: `${EINVOICE_URL}/PB2CAPIVAN/invapp/InvApp`,
    method: 'POST',
    params: {
      version: '0.6',
      type: 'QRCode',
      invNum: invNum,
      action: 'qryInvDetail',
      generation: 'V2',
      invDate: invDate,
      encrypt: encrypt,
      sellerID: sellerBan,
      UUID: '',
      appID: EINVOICE_APP_ID,
    },
  })
  return response.data
}
