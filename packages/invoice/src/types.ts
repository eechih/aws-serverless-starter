export type Barcode = {
  invPeriod: string // 對獎發票期別 (5碼)
  invNum: string // 發票號碼 (10碼)
  randomNumber: string // 隨機碼 (4碼)
}

export type QRCode = {
  invNum: string // 發票號碼 (10碼)
  invDate: string // 發票開立日期 yyyMMdd (民國年) (7碼)
  randomNumber: string // 隨機碼 (4碼)
  amount1: string // 銷售額 (8碼)
  amount2: string // 總金額 (8碼)
  buyerBan: string // 買方統一編號 (8碼)
  sellerBan: string // 賣方統一編號 (8碼)
  encrypt: string // 發票檢驗碼 (24碼)
}

export type Invoice = {
  invNum: string // 發票號碼
  invDate: string // 發票開立日期 yyyyMMdd
  invStatus: string // 發票狀態
  invPeriod: string // 對獎發票期別
  sellerName: string // 賣方名稱
  sellerBan: string // 賣方營業人統編
  sellerAddress?: string // 賣方營業人地址
  invoiceTime: string // 發票開立時間(HH:mm:ss)
  buyerBan?: string // 買方營業人統編
  currency?: string // 幣別
  amount?: string // 總金額
  details?: InvoiceDetail[] // 發票明細
}

export type InvoiceDetail = {
  rowNum: string // 明細編號
  description: string // 品名
  quantity: string // 數量
  unitPrice: string // 單價
  amount: string // 小計
}

export type CreateInvoiceInput = {
  barcode?: string
  qrcode?: string
}

export type CreateInvoiceArgs = {
  input: CreateInvoiceInput
}

export type GetInvoiceArgs = {
  invNum: string
}
