import appSyncResolverHandler, {
  isAppSyncResolverEvent,
} from './appSyncResolverHandler'

export const handler = async (event: any): Promise<any> => {
  console.log('Received event {}', JSON.stringify(event, null, 3))
  if (isAppSyncResolverEvent(event)) {
    return appSyncResolverHandler(event)
  } else {
    throw new Error('Unknown event:' + event)
  }
}
