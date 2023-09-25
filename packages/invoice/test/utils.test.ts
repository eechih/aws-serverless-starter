import axios from 'axios'
import { EINVOICE_APP_ID, EINVOICE_URL } from '../src/constants'
import {
  parseBarcode,
  parseQRCode,
  qryInvDetail,
  qryInvHeader,
} from '../src/utils'

describe('Utils test', () => {
  const barcode = '10404UZ176908720122'
  const qrcode =
    'AB112233441020523999900000144000001540000000001234567ydXZt4LAN1UHN/j1juVcRA=='

  test('parseBarCode', () => {
    expect(parseBarcode(barcode)).toEqual({
      invPeriod: '10404',
      invNum: 'UZ17690872',
      randomNumber: '0122',
    })
    expect(() => parseBarcode(barcode.substring(0, 18))).toThrow(
      'Barcode length should be 19 characters.'
    )
  })

  test('parseQRCode', () => {
    expect(parseQRCode(qrcode)).toEqual({
      invNum: 'AB11223344',
      invDate: '1020523',
      randomNumber: '9999',
      amount1: '00000144',
      amount2: '00000154',
      buyerBan: '00000000',
      sellerBan: '01234567',
      encrypt: 'ydXZt4LAN1UHN/j1juVcRA==',
    })
    expect(() => parseQRCode(qrcode.substring(0, 76))).toThrow(
      'QR code length should be at least 77 characters.'
    )
  })

  describe('qryInvHeader', () => {
    const mockFn = jest.spyOn(axios, 'request')

    beforeEach(() => {
      const resp = { data: { mock: 'mock' } }
      mockFn.mockClear().mockResolvedValue(resp)
    })

    test('by barcode', async () => {
      await expect(qryInvHeader({ barcode })).resolves.toEqual({ mock: 'mock' })
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith({
        url: `${EINVOICE_URL}/PB2CAPIVAN/invapp/InvApp`,
        method: 'POST',
        params: {
          version: '0.5',
          type: 'Barcode',
          action: 'qryInvHeader',
          invNum: 'UZ17690872',
          generation: 'V2',
          UUID: '',
          appID: EINVOICE_APP_ID,
        },
      })
    })

    test('by qrcode', async () => {
      await expect(qryInvHeader({ qrcode })).resolves.toEqual({ mock: 'mock' })
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith({
        url: `${EINVOICE_URL}/PB2CAPIVAN/invapp/InvApp`,
        method: 'POST',
        params: {
          version: '0.5',
          type: 'QRCode',
          action: 'qryInvHeader',
          invNum: 'AB11223344',
          generation: 'V2',
          UUID: '',
          appID: EINVOICE_APP_ID,
        },
      })
    })
  })

  describe('qryInvDetail', () => {
    const mockFn = jest.spyOn(axios, 'request')

    beforeEach(() => {
      const resp = { data: { mock: 'mock' } }
      mockFn.mockClear().mockResolvedValue(resp)
    })

    test('by barcode', async () => {
      await expect(qryInvDetail({ barcode })).resolves.toEqual({ mock: 'mock' })
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith({
        url: `${EINVOICE_URL}/PB2CAPIVAN/invapp/InvApp`,
        method: 'POST',
        params: {
          version: '0.6',
          type: 'Barcode',
          action: 'qryInvDetail',
          invNum: 'UZ17690872',
          generation: 'V2',
          invTerm: '10404',
          UUID: '',
          randomNumber: '0122',
          appID: EINVOICE_APP_ID,
        },
      })
    })
    test('by qrcode', async () => {
      await expect(qryInvDetail({ qrcode })).resolves.toEqual({ mock: 'mock' })
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith({
        url: `${EINVOICE_URL}/PB2CAPIVAN/invapp/InvApp`,
        method: 'POST',
        params: {
          version: '0.6',
          type: 'QRCode',
          action: 'qryInvDetail',
          invNum: 'AB11223344',
          generation: 'V2',
          invDate: '1020523',
          encrypt: 'ydXZt4LAN1UHN/j1juVcRA==',
          sellerID: '01234567',
          UUID: '',
          appID: EINVOICE_APP_ID,
        },
      })
    })
  })
})
