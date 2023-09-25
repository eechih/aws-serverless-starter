import { AppSyncResolverEvent } from 'aws-lambda'
import { CreateInvoiceArgs, GetInvoiceArgs, Invoice } from './types'
import { qryInvHeader } from './utils'

export const isAppSyncResolverEvent = (event: any): boolean => {
  return 'arguments' in event && 'source' in event && 'request' in event
}

export default async function (
  event: AppSyncResolverEvent<CreateInvoiceArgs | GetInvoiceArgs>
): Promise<Invoice | void> {
  const { fieldName } = event.info
  if (fieldName === 'createInvoice') {
    const { input } = event.arguments as CreateInvoiceArgs
    const invoice = await qryInvHeader(input)
    return invoice
  } else if (fieldName === 'getInvoice') {
    const { invNum } = event.arguments as GetInvoiceArgs
    return {
      invNum: invNum,
      invDate: 'yyyyMMdd',
      invStatus: '發票狀態',
      invPeriod: '對獎發票期別',
      sellerName: '賣方名稱',
      sellerBan: '賣方營業人統編',
      invoiceTime: 'HH:mm:ss',
    }
  } else {
    throw new Error('Unknown field, unable to resolve' + fieldName)
  }
}
